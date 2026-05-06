import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { BlogStatus } from '../blog.entity';

export class UpdateBlogDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  category?: string;

  @IsOptional()
  @IsEnum(BlogStatus)
  status?: BlogStatus;
}
