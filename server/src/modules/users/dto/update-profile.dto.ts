import { IsArray, IsNumber, IsOptional } from 'class-validator';

export class UpdateProfileDto {
  @IsArray()
  @IsOptional()
  @IsNumber({}, { each: true })
  favoriteCategoryIds?: number[];

  @IsArray()
  @IsOptional()
  @IsNumber({}, { each: true })
  blacklistCategoryIds?: number[];
}
