import { IsArray, IsNumber, IsOptional, IsString, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class SocialLinksDto {
  @IsString()
  @IsOptional()
  facebook?: string;

  @IsString()
  @IsOptional()
  linkedin?: string;

  @IsString()
  @IsOptional()
  twitter?: string;

  @IsString()
  @IsOptional()
  github?: string;
}

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  fullName?: string;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsString()
  @IsOptional()
  coverPhotoUrl?: string;

  @ValidateNested()
  @Type(() => SocialLinksDto)
  @IsOptional()
  socialLinks?: SocialLinksDto;

  @IsArray()
  @IsOptional()
  @IsNumber({}, { each: true })
  favoriteCategoryIds?: number[];

  @IsArray()
  @IsOptional()
  @IsNumber({}, { each: true })
  blacklistCategoryIds?: number[];
}
