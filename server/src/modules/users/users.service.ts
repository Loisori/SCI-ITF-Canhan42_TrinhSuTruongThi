import { Injectable, NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
  }

  async changePassword(id: number, dto: ChangePasswordDto): Promise<void> {
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
  }

  async toggleCategoryPreference(
    userId: number,
    categoryId: number,
    type: 'favorite' | 'blacklist',
  ) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['favoriteCategories', 'blacklistCategories'],
    });

    if (!user) throw new NotFoundException('User not found');

    const category = await this.categoryRepository.findOne({
      where: { id: categoryId },
    });
    if (!category) throw new NotFoundException('Category not found');

    const listName =
      type === 'favorite' ? 'favoriteCategories' : 'blacklistCategories';
    const otherListName =
      type === 'favorite' ? 'blacklistCategories' : 'favoriteCategories';

    const index = user[listName].findIndex((c) => c.id === categoryId);

    if (index > -1) {
      // Remove
      user[listName].splice(index, 1);
    } else {
      // Add
      user[listName].push(category);
      // Remove from other list if present
      const otherIndex = user[otherListName].findIndex(
        (c) => c.id === categoryId,
      );
      if (otherIndex > -1) {
        user[otherListName].splice(otherIndex, 1);
      }
    }

    return this.usersRepository.save(user);
  }

  async updateProfile(id: number, dto: UpdateProfileDto): Promise<UserEntity> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['favoriteCategories', 'blacklistCategories'],
    });

    if (!user) throw new NotFoundException('User not found');

    if (dto.favoriteCategoryIds !== undefined) {
      user.favoriteCategories = dto.favoriteCategoryIds.map((categoryId) => ({
        id: categoryId,
      })) as any;
    }

    if (dto.blacklistCategoryIds !== undefined) {
      user.blacklistCategories = dto.blacklistCategoryIds.map((categoryId) => ({
        id: categoryId,
      })) as any;
    }

    return this.usersRepository.save(user);
  }
}
