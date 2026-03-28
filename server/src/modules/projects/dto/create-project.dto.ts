import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @MaxLength(255)
  title: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  interestRate: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 0 })
  @Min(1)
  durationMonths: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  targetCapital: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  categoryId: number;

  @IsString()
  @MaxLength(255)
  @Matches(/^[a-zA-Z0-9-_]+$/)
  contentSlug: string;

  @IsOptional()
  @IsString()
  shortDescription?: string;

  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  additional_images?: string[];
}
