import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { UserEntity } from './users/user.entity';
import { ProjectsModule } from './projects/projects.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      expandVariables: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST'),
        // TiDB Cloud mặc định dùng port 4000
        port: configService.get<number>('DB_PORT', 4000), 
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        entities: [UserEntity],
        autoLoadEntities: true,
        // synchronize: true giúp tự động tạo bảng users trên TiDB khi khởi chạy
        synchronize: true, 
        
        // --- PHẦN QUAN TRỌNG ĐỂ FIX LỖI SSL ---
        ssl: {
          rejectUnauthorized: true,
        },
        // --------------------------------------
        
        // Thêm option này để xử lý tốt hơn với mysql2 driver
        connectorPackage: 'mysql2',
      }),
    }),
    UsersModule,
    AuthModule,
    ProjectsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
