import { Type } from 'class-transformer';
import { IsInt, IsNumber, Min } from 'class-validator';

export class CreateInvestmentDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  projectId: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;
}
