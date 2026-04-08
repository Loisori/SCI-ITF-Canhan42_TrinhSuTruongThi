import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
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
import { createTypeOrmConfig } from './config/typeorm.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../.env'],
      expandVariables: true,
    }),
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
