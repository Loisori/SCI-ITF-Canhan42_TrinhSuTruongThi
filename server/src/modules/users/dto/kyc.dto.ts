import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SubmitKycDto {
  @IsString()
  @IsNotEmpty()
  idCardNumber: string;

  @IsString()
  @IsNotEmpty()
  frontImageUrl: string;

  @IsString()
  @IsNotEmpty()
  backImageUrl: string;
}

export class RejectKycDto {
  @IsString()
  @IsNotEmpty()
  reason: string;
}
