import {
  BadRequestException,
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { AdminDashboardService } from './admin-dashboard.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/dashboard')
export class AdminDashboardController {
  constructor(private readonly adminDashboardService: AdminDashboardService) {}

  @Get('overview')
  getOverview() {
    return this.adminDashboardService.getOverview();
  }

  @Get('users')
  async getUsersForDashboard(
    @Query('role') role?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const normalizedRole = (role ?? '').toString().toLowerCase();
    if (!['owner', 'investor'].includes(normalizedRole)) {
      throw new BadRequestException('role must be one of: owner, investor');
    }

    const normalizedPage = page ? Number(page) : 1;
    const normalizedPageSize = pageSize ? Number(pageSize) : 10;

    if (!Number.isFinite(normalizedPage) || normalizedPage < 1) {
      throw new BadRequestException('page is invalid');
    }
    if (
      !Number.isFinite(normalizedPageSize) ||
      normalizedPageSize < 1 ||
      normalizedPageSize > 50
    ) {
      throw new BadRequestException('pageSize is invalid');
    }

    return this.adminDashboardService.getUsersForDashboard(
      normalizedRole as 'owner' | 'investor',
      normalizedPage,
      normalizedPageSize,
    );
  }
}
