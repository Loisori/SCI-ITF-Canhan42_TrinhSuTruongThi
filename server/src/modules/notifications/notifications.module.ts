import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationEntity } from './entities/notification.entity';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsGateway } from './notifications.gateway';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { InvestmentEntity } from '../investments/entities/investment.entity';
import { NotificationsListener } from './notifications.listener';

@Module({
  imports: [
    TypeOrmModule.forFeature([NotificationEntity, InvestmentEntity]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') ?? 'replace_me_with_strong_secret',
      }),
    }),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsGateway, NotificationsListener],
  exports: [NotificationsService],
})
export class NotificationsModule {}
