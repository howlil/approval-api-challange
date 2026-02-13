import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateRequestDto {
  @IsString()
  @MinLength(1, { message: 'Title is required' })
  title: string;

  @IsOptional()
  @IsString()
  description?: string;
}
