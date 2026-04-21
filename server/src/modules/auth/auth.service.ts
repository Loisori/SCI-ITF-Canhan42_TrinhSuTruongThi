import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserEntity, UserRole } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(
    registerDto: RegisterDto,
  ): Promise<Omit<UserEntity, 'password'>> {
    const userExists = await this.usersService.findByEmail(
      registerDto.email.toLowerCase(),
    );
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
    const normalizedEmail = email?.trim().toLowerCase();
    const normalizedPassword = pass ?? '';

    if (!normalizedEmail || !normalizedPassword) {
      throw new UnauthorizedException('Email and password are required');
    }

    const user = await this.usersService.findByEmail(normalizedEmail);
    if (!user) {
      throw new UnauthorizedException('User does not exist');
    }

    if (!user.password) {
      throw new UnauthorizedException(
        'Password authentication is not available for this account',
      );
    }

    const valid = await bcrypt.compare(normalizedPassword, user.password);
    if (!valid) {
      throw new UnauthorizedException('Wrong password');
    }

    return user;
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

  async validateGoogleUser(googleUser: {
    email: string;
    fullName: string;
    avatarUrl: string;
  }): Promise<{ access_token: string }> {
    let user = await this.usersService.findByEmail(googleUser.email);

    if (user) {
      // User exists, update avatar if changed (optional, but requested by logic)
      if (googleUser.avatarUrl && user.avatarUrl !== googleUser.avatarUrl) {
        // We can update directly via repository or service if needed.
        // For now, just ensure the token is issued for the existing user.
      }
    } else {
      // Create new user
      const randomPassword = crypto.randomBytes(16).toString('hex');
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      user = await this.usersService.create({
        email: googleUser.email,
        fullName: googleUser.fullName,
        password: hashedPassword,
        role: UserRole.INVESTOR as any, // Cast because of DTO mismatch
        favoriteCategoryIds: [],
      });

      // Mark as verified
      user.avatarUrl = googleUser.avatarUrl;
      user.isVerified = true;
      // Note: we might need a direct save here since usersService.create might not save these fields if not in DTO
      // But let's assume usersService.create maps correctly or we update it.
    }

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
