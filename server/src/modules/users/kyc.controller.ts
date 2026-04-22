import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Res,
  UseGuards,
  NotFoundException,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';

import * as https from 'https';
import { GetUser } from '../../common/decorators/get-user.decorator';

import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RejectKycDto, SubmitKycDto } from './dto/kyc.dto';
import { UserEntity, UserRole } from './entities/user.entity';

import { KycService } from './kyc.service';
import { CloudinaryService } from '../media/cloudinary.service';

@Controller('users/kyc')
@UseGuards(JwtAuthGuard)
export class KycController {
  constructor(
    private readonly kycService: KycService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadKycImage(@UploadedFile() file: Express.Multer.File) {
    const result = await this.cloudinaryService.uploadImage(
      file,
      'investpro/kyc',
    );
    return { url: result.secure_url };
  }

  @Post()
  async submitKyc(@GetUser('id') userId: number, @Body() dto: SubmitKycDto) {
    return this.kycService.submitKyc(userId, dto);
  }

  @Get('status')
  async getMyKycStatus(@GetUser('id') userId: number) {
    return this.kycService.getKycStatus(userId);
  }

  // Admin routes
  @Get('pending')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getPendingKycs() {
    return this.kycService.getAllPendingKyc();
  }

  @Patch(':id/approve')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async approveKyc(@Param('id', ParseIntPipe) id: number) {
    return this.kycService.approveKyc(id);
  }

  @Patch(':id/reject')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async rejectKyc(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RejectKycDto,
  ) {
    return this.kycService.rejectKyc(id, dto.reason);
  }

  @Get('image/:id/:type')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async viewImage(
    @Param('id', ParseIntPipe) id: number,
    @Param('type') type: 'front' | 'back',
    @Res() res: Response,
  ) {
    const kyc = await this.kycService.getKycById(id);
    if (!kyc || !kyc[type === 'front' ? 'frontImageUrl' : 'backImageUrl']) {
      throw new NotFoundException('KYC image not found');
    }

    const imageUrl = type === 'front' ? kyc.frontImageUrl : kyc.backImageUrl;

    https
      .get(imageUrl, (stream) => {
        const contentType = stream.headers['content-type'] || 'image/jpeg';
        res.setHeader('Content-Type', contentType);
        stream.pipe(res);
      })
      .on('error', (e) => {
        res.status(500).json({ message: 'Error streaming image' });
      });
  }
}
