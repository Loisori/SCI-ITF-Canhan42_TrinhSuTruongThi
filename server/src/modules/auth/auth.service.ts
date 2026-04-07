import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserEntity } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<Omit<UserEntity, 'password'>> {
    const userExists = await this.usersService.findByEmail(registerDto.email.toLowerCase());
    if (userExists) {
      throw new ConflictException('Email is already registered.');
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(registerDto.password, saltRounds);

    const user = await this.usersService.create({
      ...registerDto,
      password: hashedPassword,
    });

    const { password, ...safeUser } = user;
    return safeUser;
  }

  async validateUser(email: string, pass: string): Promise<UserEntity> {
    try {
      const user = await this.usersService.findByEmail(email.toLowerCase());
      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const valid = await bcrypt.compare(pass, user.password);
      if (!valid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      return user;
    } catch (error: any) {
      if (error.status) throw error;
      throw error;
    }
  }

  async login(loginDto: LoginDto): Promise<{ access_token: string }> {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
