import { IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateAiChatDto {
  @IsString()
  @MaxLength(4000)
  message: string;

  @IsOptional()
  @IsObject()
  projectContext?: Record<string, unknown>;
}
