import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateRequestDto {
  @ApiPropertyOptional({ example: 'Judul permintaan (diubah)', description: 'Judul baru (opsional)' })
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Title cannot be empty' })
  title?: string;

  @ApiPropertyOptional({ example: 'Deskripsi baru', description: 'Deskripsi baru (opsional)' })
  @IsOptional()
  @IsString()
  description?: string;
}
