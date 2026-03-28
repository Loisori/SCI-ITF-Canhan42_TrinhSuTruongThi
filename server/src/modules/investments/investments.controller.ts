import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { InvestmentsService } from './investments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { IsInvestorGuard } from '../../common/guards/is-investor.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { CreateInvestmentDto } from './dto/create-investment.dto';

@Controller('api/investments')
export class InvestmentsController {
  constructor(private readonly investmentsService: InvestmentsService) {}

  @UseGuards(JwtAuthGuard)
  @Get('my-investments')
  getMyInvestments(@GetUser('id') userId: number) {
    return this.investmentsService.getMyInvestments(userId);
  }

  @UseGuards(JwtAuthGuard, IsInvestorGuard)
  @Post()
  invest(
    @GetUser('id') userId: number,
    @Body() dto: CreateInvestmentDto,
  ) {
    return this.investmentsService.invest(userId, dto);
  }
}
