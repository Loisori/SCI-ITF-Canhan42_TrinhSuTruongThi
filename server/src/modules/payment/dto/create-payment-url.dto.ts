import { Type } from 'class-transformer';
import { IsNumber, Min } from 'class-validator';

export class CreatePaymentUrlDto {
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1000)
  amount: number;
}
