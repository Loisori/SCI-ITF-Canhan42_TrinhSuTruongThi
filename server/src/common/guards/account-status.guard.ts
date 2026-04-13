import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UserEntity } from '../../modules/users/entities/user.entity';
import { KycStatus } from '../../modules/users/entities/kyc.entity';

@Injectable()
export class AccountStatusGuard implements CanActivate {
  constructor(private dataSource: DataSource) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.id) {
      return false;
    }

    const userRecord = await this.dataSource.getRepository(UserEntity).findOne({
      where: { id: user.id },
      relations: ['kyc'],
    });

    if (!userRecord) {
      throw new NotFoundException('Không tìm thấy thông tin người dùng.');
    }

    if (userRecord.isFrozen) {
      throw new ForbiddenException(
        'Tài khoản của bạn hiện đang bị đóng băng do tranh chấp hoặc vi phạm chính sách. Vui lòng liên hệ Admin.',
      );
    }

    if (!userRecord.kyc || userRecord.kyc.status !== KycStatus.APPROVED) {
      throw new ForbiddenException(
        'Yêu cầu xác thực KYC: Tài khoản của bạn cần hoàn tất xác thực danh tính và được Admin phê duyệt để thực hiện tính năng này.',
      );
    }

    return true;
  }
}
