import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KycEntity, KycStatus } from './entities/kyc.entity';
import { SubmitKycDto } from './dto/kyc.dto';

@Injectable()
export class KycService {
  constructor(
    @InjectRepository(KycEntity)
    private readonly kycRepository: Repository<KycEntity>,
  ) {}

  async submitKyc(userId: number, dto: SubmitKycDto) {
    const existing = await this.kycRepository.findOne({ where: { userId } });
    if (existing && existing.status === KycStatus.APPROVED) {
      throw new ConflictException('Tài khoản đã hoàn tất xác thực KYC.');
    }

    if (existing) {
      // Re-submit
      existing.idCardNumber = dto.idCardNumber;
      existing.frontImageUrl = dto.frontImageUrl;
      existing.backImageUrl = dto.backImageUrl;
      existing.status = KycStatus.PENDING;
      existing.rejectionReason = null;
      return this.kycRepository.save(existing);
    }

    const kyc = this.kycRepository.create({
      userId,
      ...dto,
      status: KycStatus.PENDING,
    });
    return this.kycRepository.save(kyc);
  }

  async getKycStatus(userId: number) {
    return this.kycRepository.findOne({
      where: { userId },
      relations: ['user'],
    });
  }


  async getAllPendingKyc() {
    return this.kycRepository.find({
      where: { status: KycStatus.PENDING },
      relations: ['user'],
    });
  }

  async getKycById(kycId: number) {
    return this.kycRepository.findOne({
      where: { id: kycId },
      relations: ['user'],
    });
  }

  async approveKyc(kycId: number) {

    const kyc = await this.kycRepository.findOne({ where: { id: kycId } });
    if (!kyc) throw new NotFoundException('Yêu cầu KYC không tồn tại.');
    
    kyc.status = KycStatus.APPROVED;
    kyc.rejectionReason = null;
    return this.kycRepository.save(kyc);
  }

  async rejectKyc(kycId: number, reason: string) {
    const kyc = await this.kycRepository.findOne({ where: { id: kycId } });
    if (!kyc) throw new NotFoundException('Yêu cầu KYC không tồn tại.');

    kyc.status = KycStatus.REJECTED;
    kyc.rejectionReason = reason;
    return this.kycRepository.save(kyc);
  }
}
