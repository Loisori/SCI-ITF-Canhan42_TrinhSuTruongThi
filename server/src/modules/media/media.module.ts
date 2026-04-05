import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { CloudinaryService } from './cloudinary.service';
import { UserMediaEntity } from '../users/entities/user-media.entity';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserMediaEntity]),
    MulterModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        cloudinary.config({
          cloud_name: configService.get('CLOUDINARY_CLOUD_NAME'),
          api_key: configService.get('CLOUDINARY_API_KEY'),
          api_secret: configService.get('CLOUDINARY_API_SECRET'),
        });

        // Cấu hình lưu trữ lên Cloudinary
        const storage = new CloudinaryStorage({
          cloudinary: cloudinary,
          params: async (req, file) => {
            // Xác thực xem req.user có tồn tại không. 
            // FileInterceptor sẽ chạy sau JwtAuthGuard nếu ta đặt Guard đúng chỗ
            const userId = (req as any).user?.id || 'unknown';
            return {
              folder: `investpro/users/${userId}`,
              allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'webp', 'mp4'],
              // Bạn có thể xử lý nén nâng cao ở đây, nhưng Cloudinary có f_auto,q_auto khi query URL
            };
          },
        });

        return {
          storage,
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [MediaController],
  providers: [
    MediaService,
    CloudinaryService,
  ],
  exports: [MediaService, CloudinaryService],
})
export class MediaModule {}
