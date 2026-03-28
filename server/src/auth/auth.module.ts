import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserEntity } from '../users/user.entity';
import { UsersModule } from '../users/users.module';
import { JwtStrategy } from './jwt.strategy';
import { RolesGuard } from './guards/roles.guard';
import { IsOwnerGuard } from './guards/is-owner.guard';
import { IsInvestorGuard } from './guards/is-investor.guard';

@Module({
  imports: [
    ConfigModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const expiresIn = configService.get<string>('JWT_EXPIRATION') ?? '3600s';
        return {
          secret: configService.get<string>('JWT_SECRET') ?? 'replace_me_with_strong_secret',
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
  providers: [AuthService, JwtStrategy, RolesGuard, IsOwnerGuard, IsInvestorGuard],
  exports: [AuthService, RolesGuard, IsOwnerGuard, IsInvestorGuard],
})
export class AuthModule {}
