import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { BlogStatus } from '../blog.entity';

export class CreateBlogDto {
  @IsString()
  @MaxLength(255)
  title: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @IsString()
  @MaxLength(120)
  category: string;

  @IsOptional()
  @IsEnum(BlogStatus)
  status?: BlogStatus;
}
