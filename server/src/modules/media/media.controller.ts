import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { MediaService } from './media.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { FileInterceptor } from '@nestjs/platform-express';

@UseGuards(JwtAuthGuard)
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadMedia(
    @GetUser('id') userId: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.mediaService.saveMediaRecord(userId, file);
  }

  @Get()
  getUserMedia(@GetUser('id') userId: number) {
    return this.mediaService.getUserMedia(userId);
  }

  @Delete(':id')
  deleteMedia(
    @GetUser('id') userId: number,
    @Param('id', ParseIntPipe) mediaId: number,
  ) {
    return this.mediaService.deleteUserMedia(userId, mediaId);
  }
}
