import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity, UserRole } from './entities/user.entity';
import { RegisterDto } from '../auth/dto/register.dto';

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
}
