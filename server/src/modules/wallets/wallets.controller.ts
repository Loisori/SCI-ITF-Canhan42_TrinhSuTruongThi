import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AccountStatusGuard } from '../../common/guards/account-status.guard';
import { UserEntity, UserRole } from '../users/entities/user.entity';

import {
  DepositRequestDto,
  RepayDebtDto,
  RepayMilestoneDto,
  WithdrawRequestDto,
} from './dto/wallet.dto';
import { WalletsService } from './wallets.service';

@Controller('wallets')
@UseGuards(JwtAuthGuard)
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @UseGuards(AccountStatusGuard)
  @Post('deposit')

  async requestDeposit(
    @GetUser('id') userId: number,
    @Body() dto: DepositRequestDto,
  ) {
    return this.walletsService.requestDeposit(userId, dto.amount);
  }

  @UseGuards(AccountStatusGuard)
  @Post('withdraw')

  async requestWithdraw(
    @GetUser('id') userId: number,
    @Body() dto: WithdrawRequestDto,
  ) {
    return this.walletsService.requestWithdrawal(userId, dto.amount, dto.bankName, dto.accountNumber);
  }


  @Get('history')
  async getHistory(@GetUser('id') userId: number) {
    return this.walletsService.getTransactionHistory(userId);
  }

  @Get('repayments/schedules')
  @Roles(UserRole.OWNER)
  @UseGuards(RolesGuard)
  async getOwnerSchedules(@GetUser('id') ownerId: number) {
    return this.walletsService.getOwnerRepaymentSchedules(ownerId);
  }

  @Post('repay')
  @Roles(UserRole.OWNER)
  @UseGuards(RolesGuard, AccountStatusGuard)
  async repayDebt(
    @GetUser('id') ownerId: number,
    @Body() dto: RepayDebtDto,
  ) {
    return this.walletsService.repayProjectDebt(ownerId, dto.projectId, dto.amount);
  }

  @Post('repay-milestone-interest')
  @Roles(UserRole.OWNER)
  @UseGuards(RolesGuard, AccountStatusGuard)
  async repayMilestoneInterest(
    @GetUser('id') ownerId: number,
    @Body() dto: RepayMilestoneDto,
  ) {
    return this.walletsService.repayMilestoneInterest(ownerId, dto.scheduleId);
  }

  // Admin routes
  @Get('admin/pending-transactions')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  async getPendingTransactions() {
    return this.walletsService.getPendingTransactions();
  }

  @Post('admin/approve-transaction/:id')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  async approveTransaction(@Param('id', ParseIntPipe) id: number) {
    return this.walletsService.adminApproveTransaction(id);
  }

  @Post('admin/reject-transaction/:id')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  async rejectTransaction(
    @Param('id', ParseIntPipe) id: number,
    @Body('reason') reason: string,
  ) {
    return this.walletsService.adminRejectTransaction(id, reason);
  }
}

