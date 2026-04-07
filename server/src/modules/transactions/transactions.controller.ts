import { Controller, Get, Post, Patch, Body, Query, UseGuards, Request, Param, ParseIntPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { TransactionsService } from './transactions.service';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  getMyTransactions(
    @GetUser('id') userId: number,
    @Query('type') type?: string,
    @Query('status') status?: string,
  ) {
    return this.transactionsService.getMyTransactions(userId, { type, status });
  }

  @UseGuards(JwtAuthGuard)
  @Post('withdraw')
  async requestWithdraw(
    @GetUser('id') userId: number,
    @Body('amount') amount: number,
  ) {
    console.log(`[TransactionsController] Withdrawal requested. UserId: ${userId}, Amount: ${amount}, Type: ${typeof amount}`);
    return this.transactionsService.createWithdrawRequest(userId, amount);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('admin/pending-withdrawals')
  async getPendingWithdrawals() {
    return this.transactionsService.getAllPendingWithdrawals();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch('admin/withdraw/:id/:action')
  async handleWithdraw(
    @GetUser('id') adminId: number,
    @Param('id', ParseIntPipe) id: number,
    @Param('action') action: 'approve' | 'reject',
  ) {
    return this.transactionsService.approveWithdraw(adminId, id, action);
  }
}
