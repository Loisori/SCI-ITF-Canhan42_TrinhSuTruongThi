import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserEntity } from '../users/entities/user.entity';
import { UsersModule } from '../users/users.module';
import { JwtStrategy } from './jwt.strategy';
import { GoogleStrategy } from './google.strategy';

import { RolesGuard } from '../../common/guards/roles.guard';
import { IsOwnerGuard } from '../../common/guards/is-owner.guard';
import { IsInvestorGuard } from '../../common/guards/is-investor.guard';

@Module({
  imports: [
    ConfigModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const expiresIn = configService.get<string>('JWT_EXPIRES_IN') ?? '1d';
        return {
          secret: configService.get<string>('JWT_SECRET') ?? 'fallback_secret',
          signOptions: {
            expiresIn,
          },
        } as any;
      },
    }),
    TypeOrmModule.forFeature([UserEntity]),
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, GoogleStrategy, RolesGuard, IsOwnerGuard, IsInvestorGuard],
  exports: [AuthService, RolesGuard, IsOwnerGuard, IsInvestorGuard],
})
export class AuthModule {}
