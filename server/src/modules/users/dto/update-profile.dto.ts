import { IsArray, IsNumber, IsOptional, IsString, IsObject } from 'class-validator';

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

  @IsObject()
  @IsOptional()
  socialLinks?: {
    facebook?: string;
    linkedin?: string;
    twitter?: string;
    github?: string;
  };

  @IsArray()
  @IsOptional()
  @IsNumber({}, { each: true })
  favoriteCategoryIds?: number[];

  @IsArray()
  @IsOptional()
  @IsNumber({}, { each: true })
  blacklistCategoryIds?: number[];
}
