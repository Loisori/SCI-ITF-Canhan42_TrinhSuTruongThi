import { Injectable, NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserEntity, UserRole } from './entities/user.entity';
import { RegisterDto } from '../auth/dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CloudinaryService } from '../media/cloudinary.service';
import { ProjectCategoryEntity } from '../projects/entities/category.entity';

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
      favoriteCategories: registerDto.favoriteCategoryIds
        ? registerDto.favoriteCategoryIds.map((id) => ({ id })) as any
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
      throw new BadRequestException(`Không thể cập nhật ảnh đại diện: ${error.message}`);
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

    const listName = type === 'favorite' ? 'favoriteCategories' : 'blacklistCategories';
    const otherListName = type === 'favorite' ? 'blacklistCategories' : 'favoriteCategories';
    const joinTable = type === 'favorite' ? 'user_favorite_categories' : 'user_blacklist_categories';
    const otherJoinTable = type === 'favorite' ? 'user_blacklist_categories' : 'user_favorite_categories';

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

  async updateProfile(id: number, dto: UpdateProfileDto): Promise<UserEntity | null> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['favoriteCategories', 'blacklistCategories'],
    });

    if (!user) throw new NotFoundException('User not found');

    // Update simple fields first
    const { favoriteCategoryIds, blacklistCategoryIds, ...simpleFields } = dto;
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

  async updateNotificationSettings(id: number, settings: Record<string, boolean>): Promise<UserEntity> {
    try {
      const user = await this.usersRepository.findOne({ where: { id } });
      if (!user) throw new NotFoundException('User not found');

      user.notificationSettings = {
        ...(user.notificationSettings || {}),
        ...settings,
      };

      return await this.usersRepository.save(user);
    } catch (error: any) {
      console.error(`[UsersService] updateNotificationSettings error:`, error.message);
      throw new BadRequestException(`Tính năng cấu hình thông báo chưa sẵn sàng. Vui lòng thử lại sau.`);
    }
  }
}
