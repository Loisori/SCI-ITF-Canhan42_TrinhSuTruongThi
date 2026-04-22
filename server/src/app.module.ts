import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { InvestmentsModule } from './modules/investments/investments.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { PaymentModule } from './modules/payment/payment.module';
import { AdminDashboardModule } from './modules/admin-dashboard/admin-dashboard.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { MediaModule } from './modules/media/media.module';
import { AiChatModule } from './modules/ai-chat/ai-chat.module';
import { WalletsModule } from './modules/wallets/wallets.module';
import { createTypeOrmConfig } from './config/typeorm.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../.env'],
      expandVariables: true,
    }),
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        createTypeOrmConfig(configService),
    }),
    UsersModule,
    AuthModule,
    ProjectsModule,
    InvestmentsModule,
    TransactionsModule,
    PaymentModule,
    AdminDashboardModule,
    NotificationsModule,
    MediaModule,
    AiChatModule,
    WalletsModule,
  ],

  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
