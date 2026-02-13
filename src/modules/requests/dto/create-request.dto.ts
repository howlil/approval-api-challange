import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateRequestDto {
  @ApiProperty({ example: 'Permintaan akses sistem X', description: 'Judul permintaan (wajib)' })
  @IsString()
  @MinLength(1, { message: 'Title is required' })
  title: string;

  @ApiPropertyOptional({ example: 'Detail penjelasan permintaan.', description: 'Deskripsi (opsional)' })
  @IsOptional()
  @IsString()
  description?: string;
}
