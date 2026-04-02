import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity, UserRole } from './entities/user.entity';
import { RegisterDto } from '../auth/dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private usersRepository: Repository<UserEntity>,
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
        ? registerDto.favoriteCategoryIds.map(id => ({ id })) as any
        : undefined,
    });
    return this.usersRepository.save(newUser);
  }

  async findAll(): Promise<UserEntity[]> {
    return this.usersRepository.find({
      select: ['id', 'email', 'fullName', 'role', 'balance', 'createdAt', 'updatedAt'],
    });
  }

  async updateRole(id: number, role: UserRole): Promise<UserEntity | null> {
    await this.usersRepository.update(id, { role });
    return this.findById(id);
  }

  async updateProfile(id: number, dto: UpdateProfileDto): Promise<UserEntity> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['favoriteCategories', 'blacklistCategories'],
    });

    if (!user) throw new Error('User not found');

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
