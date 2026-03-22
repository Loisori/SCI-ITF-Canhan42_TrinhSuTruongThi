import { IsEnum } from 'class-validator';
import { UserRole } from '../../users/user.entity';

export class UpdateRoleDto {
  @IsEnum(UserRole)
  role: UserRole;
}