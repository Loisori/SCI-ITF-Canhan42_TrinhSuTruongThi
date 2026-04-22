import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserMediaEntity } from '../users/entities/user-media.entity';
import { CloudinaryService } from './cloudinary.service';

@Injectable()
export class MediaService {
  constructor(
    @InjectRepository(UserMediaEntity)
    private readonly userMediaRepo: Repository<UserMediaEntity>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async saveMediaRecord(userId: number, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const { path, filename, size, originalname } = file as any; // Multer-storage-cloudinary adds properties like path and filename

    // Mặc định Multer-storage-cloudinary đã upload rồi, chúng ta chỉ lưu URL đã được format đẹp
    let optimizedUrl = path;
    if (optimizedUrl && optimizedUrl.includes('/upload/')) {
      optimizedUrl = optimizedUrl.replace('/upload/', '/upload/f_auto,q_auto/');
    }

    const media = this.userMediaRepo.create({
      userId,
      url: optimizedUrl,
      publicId: filename, // filename is the public_id in cloudinary storage
      fileName: originalname || 'image',
      fileSize: size || 0,
    });

    await this.userMediaRepo.save(media);
    return media;
  }

  async getUserMedia(userId: number) {
    return this.userMediaRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async deleteUserMedia(userId: number, mediaId: number) {
    const media = await this.userMediaRepo.findOne({
      where: { id: mediaId, userId },
    });

    if (!media) {
      throw new NotFoundException(
        'Media not found or you do not have permission',
      );
    }

    try {
      if (media.publicId) {
        await this.cloudinaryService.deleteImage(media.publicId);
      }
    } catch (err) {
      console.warn(
        `Failed to delete media ${media.publicId} from Cloudinary:`,
        err,
      );
    }

    await this.userMediaRepo.remove(media);
    return { message: 'Image deleted successfully' };
  }
}
