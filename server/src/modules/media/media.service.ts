import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserMediaEntity } from '../users/entities/user-media.entity';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class MediaService {
  constructor(
    @InjectRepository(UserMediaEntity)
    private readonly userMediaRepo: Repository<UserMediaEntity>,
  ) {}

  async saveMediaRecord(userId: number, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const { path, filename, size, originalname } = file as any; // Multer-storage-cloudinary adds properties like path and filename

    // Append auto compress to Cloudinary URL
    // e.g., https://res.cloudinary.com/cloud/image/upload/v1234/folder/file.jpg -> https://res.cloudinary.com/cloud/image/upload/f_auto,q_auto/v1234/folder/file.jpg
    let optimizedUrl = path;
    if (optimizedUrl.includes('/upload/')) {
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
      throw new NotFoundException('Media not found or you do not have permission');
    }

    try {
      if (media.publicId) {
        await cloudinary.uploader.destroy(media.publicId);
      }
    } catch (err) {
      console.warn(`Failed to delete media ${media.publicId} from Cloudinary:`, err);
      // Even if it fails on cloudinary, we delete from DB.
    }

    await this.userMediaRepo.remove(media);
    return { message: 'Image deleted successfully' };
  }
}
