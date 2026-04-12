import { IsNotEmpty, IsNumber, IsPositive, IsString, Min } from 'class-validator';

export class DepositRequestDto {
  @IsNumber()
  @IsPositive()
  amount: number;
}

export class WithdrawRequestDto {
  @IsNumber()
  @Min(50000)
  amount: number;

  @IsString()
  @IsNotEmpty()
  bankName: string;

  @IsString()
  @IsNotEmpty()
  accountNumber: string;
}

export class RepayMilestoneDto {
  @IsNumber()
  scheduleId: number;
}
