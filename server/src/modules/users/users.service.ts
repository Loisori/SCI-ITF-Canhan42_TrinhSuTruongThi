import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, Not, IsNull } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserEntity, UserRole } from './entities/user.entity';
import { RegisterDto } from '../auth/dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CloudinaryService } from '../media/cloudinary.service';
import { ProjectCategoryEntity } from '../projects/entities/category.entity';
import {
  TransactionEntity,
  TransactionType,
  TransactionStatus,
} from '../transactions/entities/transaction.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private usersRepository: Repository<UserEntity>,
    @InjectRepository(ProjectCategoryEntity)
    private categoryRepository: Repository<ProjectCategoryEntity>,
    private cloudinaryService: CloudinaryService,
    private dataSource: DataSource,
  ) {}

  async onModuleInit() {
    await this.backfillSlugs();
  }

  private async backfillSlugs() {
    const usersWithoutSlug = await this.usersRepository.find({
      where: { slug: IsNull() },
    });

    if (usersWithoutSlug.length > 0) {
      console.log(
        `[UsersService] Backfilling slugs for ${usersWithoutSlug.length} users...`,
      );
      for (const user of usersWithoutSlug) {
        user.slug = await this.generateUniqueSlug(user.fullName);
        await this.usersRepository.save(user);
      }
      console.log(`[UsersService] Backfill complete.`);
    }
  }

  private generateRawSlug(fullName: string): string {
    return fullName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9 ]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  async generateUniqueSlug(fullName: string): Promise<string> {
    const baseSlug = this.generateRawSlug(fullName) || 'user';
    let slug = baseSlug;
    let counter = 1;

    // Check for collisions
    // We use a loop to ensure uniqueness
    while (await this.usersRepository.findOne({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    return slug;
  }

  async findBySlug(slug: string): Promise<UserEntity | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.favoriteCategories', 'favoriteCategories')
      .leftJoinAndSelect('user.blacklistCategories', 'blacklistCategories')
      .addSelect([
        'user.id',
        'user.email',
        'user.fullName',
        'user.role',
        'user.balance',
        'user.avatarUrl',
        'user.isVerified',
        'user.bio',
        'user.address',
        'user.coverPhotoUrl',
        'user.socialLinks',
        'user.notificationSettings',
        'user.createdAt',
        'user.updatedAt',
        'user.slug',
      ])
      .where('user.slug = :slug', { slug })
      .getOne();
  }

  async findByIdentifier(identifier: string): Promise<UserEntity | null> {
    // Check if it's a numeric ID
    const numericId = parseInt(identifier, 10);
    if (!isNaN(numericId) && /^\d+$/.test(identifier)) {
      return this.findById(numericId);
    }
    // Otherwise, treat as slug
    return this.findBySlug(identifier);
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.email',
        'user.fullName',
        'user.role',
        'user.balance',
        'user.avatarUrl',
        'user.isVerified',
        'user.createdAt',
        'user.updatedAt',
      ])
      .addSelect('user.password')
      .where('user.email = :email', { email: email.toLowerCase() })
      .getOne();
  }

  async findById(id: number): Promise<UserEntity | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.favoriteCategories', 'favoriteCategories')
      .leftJoinAndSelect('user.blacklistCategories', 'blacklistCategories')
      .select([
        'user.id',
        'user.email',
        'user.fullName',
        'user.role',
        'user.balance',
        'user.avatarUrl',
        'user.isVerified',
        'user.bio',
        'user.coverPhotoUrl',
        'user.socialLinks',
        'user.notificationSettings',
        'user.createdAt',
        'user.updatedAt',
        'favoriteCategories.id',
        'favoriteCategories.name',
        'blacklistCategories.id',
        'blacklistCategories.name',
      ])
      .where('user.id = :id', { id })
      .getOne();
  }

  async create(registerDto: RegisterDto): Promise<UserEntity> {
    const newUser = this.usersRepository.create({
      email: registerDto.email.toLowerCase(),
      password: registerDto.password,
      fullName: registerDto.fullName,
      role: registerDto.role ?? UserRole.INVESTOR,
      balance: 0,
      slug: await this.generateUniqueSlug(registerDto.fullName),
      favoriteCategories: registerDto.favoriteCategoryIds
        ? (registerDto.favoriteCategoryIds.map((id) => ({ id })) as any)
        : undefined,
    });
    return this.usersRepository.save(newUser);
  }

  async findAll(): Promise<UserEntity[]> {
    return this.usersRepository.find({
      select: [
        'id',
        'email',
        'fullName',
        'role',
        'balance',
        'createdAt',
        'updatedAt',
      ],
    });
  }

  async updateRole(id: number, role: UserRole): Promise<UserEntity | null> {
    await this.usersRepository.update(id, { role });
    return this.findById(id);
  }

  async updateAvatar(
    id: number,
    file: Express.Multer.File,
  ): Promise<Partial<UserEntity>> {
    try {
      const user = await this.usersRepository.findOne({ where: { id } });
      if (!user) throw new NotFoundException('User not found');

      const result = await this.cloudinaryService.uploadImage(
        file,
        `investpro/avatars/${id}`,
      );
      user.avatarUrl = result.secure_url;

      await this.usersRepository.save(user);
      const { password, ...safeUser } = user;
      return safeUser;
    } catch (error: any) {
      console.error(`[UsersService] updateAvatar error:`, error.message);
      if (error.status) throw error;
      throw new BadRequestException(
        `Không thể cập nhật ảnh đại diện: ${error.message}`,
      );
    }
  }

  async changePassword(id: number, dto: ChangePasswordDto): Promise<void> {
    try {
      const user = await this.usersRepository
        .createQueryBuilder('user')
        .addSelect('user.password')
        .where('user.id = :id', { id })
        .getOne();

      if (!user) throw new NotFoundException('User not found');

      const isMatch = await bcrypt.compare(dto.oldPassword, user.password);
      if (!isMatch) {
        throw new UnauthorizedException('Mật khẩu cũ không chính xác');
      }

      user.password = await bcrypt.hash(dto.newPassword, 10);
      await this.usersRepository.save(user);
    } catch (error: any) {
      console.error(`[UsersService] changePassword error:`, error.message);
      if (error.status) throw error;
      throw new BadRequestException(`Không thể đổi mật khẩu: ${error.message}`);
    }
  }

  async toggleCategoryPreference(
    userId: number,
    categoryId: number,
    type: 'favorite' | 'blacklist',
  ) {
    const category = await this.categoryRepository.findOne({
      where: { id: categoryId },
    });
    if (!category) throw new NotFoundException('Category not found');

    const listName =
      type === 'favorite' ? 'favoriteCategories' : 'blacklistCategories';
    const otherListName =
      type === 'favorite' ? 'blacklistCategories' : 'favoriteCategories';
    const joinTable =
      type === 'favorite'
        ? 'user_favorite_categories'
        : 'user_blacklist_categories';
    const otherJoinTable =
      type === 'favorite'
        ? 'user_blacklist_categories'
        : 'user_favorite_categories';

    // Manual check for existence to avoid ER_DUP_ENTRY
    const exists = await this.dataSource.query(
      `SELECT 1 FROM ${joinTable} WHERE user_id = ? AND category_id = ?`,
      [userId, categoryId],
    );

    if (exists.length > 0) {
      // Remove connection
      await this.usersRepository
        .createQueryBuilder()
        .relation(UserEntity, listName)
        .of(userId)
        .remove(categoryId);
    } else {
      // Ensure it's not in the other list first
      const existsInOther = await this.dataSource.query(
        `SELECT 1 FROM ${otherJoinTable} WHERE user_id = ? AND category_id = ?`,
        [userId, categoryId],
      );
      if (existsInOther.length > 0) {
        await this.usersRepository
          .createQueryBuilder()
          .relation(UserEntity, otherListName)
          .of(userId)
          .remove(categoryId);
      }

      // Add connection
      await this.usersRepository
        .createQueryBuilder()
        .relation(UserEntity, listName)
        .of(userId)
        .add(categoryId);
    }

    return this.findById(userId);
  }

  async updateProfile(
    id: number,
    dto: UpdateProfileDto,
  ): Promise<UserEntity | null> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['favoriteCategories', 'blacklistCategories'],
    });

    if (!user) throw new NotFoundException('User not found');

    // Update simple fields first
    const { favoriteCategoryIds, blacklistCategoryIds, ...simpleFields } = dto;

    // If fullName is changed AND slug is currently null, generate it.
    // However, user requested "Immutable after first generated".
    // So we only set slug if it's null.
    if (!user.slug) {
      (simpleFields as any).slug = await this.generateUniqueSlug(
        dto.fullName || user.fullName,
      );
    }

    if (Object.keys(simpleFields).length > 0) {
      await this.usersRepository.update(id, simpleFields);
    }

    // Handle favoriteCategories manually
    if (favoriteCategoryIds !== undefined) {
      const currentIds = user.favoriteCategories.map((c) => Number(c.id));
      if (currentIds.length > 0) {
        await this.usersRepository
          .createQueryBuilder()
          .relation(UserEntity, 'favoriteCategories')
          .of(id)
          .remove(currentIds);
      }
      if (favoriteCategoryIds.length > 0) {
        await this.usersRepository
          .createQueryBuilder()
          .relation(UserEntity, 'favoriteCategories')
          .of(id)
          .add(favoriteCategoryIds);
      }
    }

    // Handle blacklistCategories manually
    if (blacklistCategoryIds !== undefined) {
      const currentIds = user.blacklistCategories.map((c) => Number(c.id));
      if (currentIds.length > 0) {
        await this.usersRepository
          .createQueryBuilder()
          .relation(UserEntity, 'blacklistCategories')
          .of(id)
          .remove(currentIds);
      }
      if (blacklistCategoryIds.length > 0) {
        await this.usersRepository
          .createQueryBuilder()
          .relation(UserEntity, 'blacklistCategories')
          .of(id)
          .add(blacklistCategoryIds);
      }
    }

    return this.findById(id);
  }

  async updateNotificationSettings(
    id: number,
    settings: Record<string, boolean>,
  ): Promise<UserEntity> {
    try {
      const user = await this.usersRepository.findOne({ where: { id } });
      if (!user) throw new NotFoundException('User not found');

      user.notificationSettings = {
        ...(user.notificationSettings || {}),
        ...settings,
      };

      return await this.usersRepository.save(user);
    } catch (error: any) {
      console.error(
        `[UsersService] updateNotificationSettings error:`,
        error.message,
      );
      throw new BadRequestException(
        `Tính năng cấu hình thông báo chưa sẵn sàng. Vui lòng thử lại sau.`,
      );
    }
  }

  async freezeAccount(userId: number, reason: string): Promise<UserEntity> {
    return this.dataSource.transaction(async (manager) => {
      const userRepo = manager.getRepository(UserEntity);
      const transactionRepo = manager.getRepository(TransactionEntity);

      const user = await userRepo.findOne({ where: { id: userId } });
      if (!user) throw new NotFoundException('User không tồn tại.');

      await userRepo.update(userId, { isFrozen: true });

      const log = transactionRepo.create({
        userId,
        amount: 0,
        type: TransactionType.SYSTEM_LOG,
        status: TransactionStatus.SUCCESS,
        description: `Hệ thống tự động đóng băng tài khoản do: ${reason}`,
      });
      await transactionRepo.save(log);

      const updatedUser = await userRepo.findOne({ where: { id: userId } });
      if (!updatedUser)
        throw new NotFoundException('User không tồn tại sau khi cập nhật.');
      return updatedUser;
    });
  }
}
