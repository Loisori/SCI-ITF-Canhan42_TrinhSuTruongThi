import { Body, Controller, Get, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import type { Response, Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { PaymentService } from './payment.service';
import { CreatePaymentUrlDto } from './dto/create-payment-url.dto';
import { ConfigService } from '@nestjs/config';

@Controller('payment')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly configService: ConfigService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('create-url')
  async createPaymentUrl(
    @GetUser('id') userId: number,
    @Body() dto: CreatePaymentUrlDto,
    @Req() req: Request,
  ) {
    const forwardedIp = req.headers['x-forwarded-for'];
    const clientIp = Array.isArray(forwardedIp)
      ? forwardedIp[0]
      : forwardedIp?.split(',')[0] || req.ip || '127.0.0.1';

    return this.paymentService.createVnpayUrl(userId, dto.amount, clientIp);
  }

  @Get('vnpay-return')
  async vnpayReturn(
    @Query() query: Record<string, string | string[] | undefined>,
    @Res() res: Response,
  ) {
    const result = await this.paymentService.handleVnpayReturn(query);

    const clientBaseUrl =
      this.configService.get<string>('CLIENT_URL') || 'http://localhost:3000';

    const targetUrl = result.success
      ? `${clientBaseUrl}/dashboard?payment=success&amount=${encodeURIComponent(String(result.amount ?? '0'))}`
      : `${clientBaseUrl}/dashboard?payment=failed&code=${encodeURIComponent(result.code ?? 'unknown')}`;

    return res.redirect(targetUrl);
  }

  @Get('vnpay-ipn')
  async vnpayIpn(
    @Query() query: Record<string, string | string[] | undefined>,
  ) {
    return this.paymentService.handleVnpayIpn(query);
  }
}
