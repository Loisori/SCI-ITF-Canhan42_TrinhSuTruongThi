import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor(private configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get('CLOUDINARY_API_SECRET'),
    });
  }

  async uploadImage(
    file: Express.Multer.File,
    folder = 'investpro/general',
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'auto',
          // Tối ưu hóa ảnh ngay khi upload (Resize và Nén)
          transformation: [
            { width: 1200, height: 1200, crop: 'limit' }, // Giới hạn kích thước tối đa
            { quality: 'auto', fetch_format: 'auto' },     // Tự động nén và chọn định dạng tốt nhất
          ],
        },
        (error, result) => {
          if (error) {
            this.logger.error('Cloudinary upload failed:', error);
            return reject(error);
          }
          resolve(result!);
        },
      );

      // Tạo stream từ buffer của file
      const stream = new Readable();
      stream.push(file.buffer);
      stream.push(null);
      stream.pipe(upload);
    });
  }

  async deleteImage(publicId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(publicId, (error, result) => {
        if (error) return reject(error);
        resolve(result);
      });
    });
  }
}
