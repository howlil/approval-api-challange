import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'user@contoh.id', description: 'Alamat email (unik)' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: 'Nama Pengguna', description: 'Nama tampilan (opsional)' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 'password123', description: 'Kata sandi (min. 8 karakter)', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password: string;

  @ApiProperty({ enum: ['CREATOR', 'APPROVER'], description: 'Role: CREATOR (buat/ubah permintaan) atau APPROVER (approve/reject)' })
  @IsEnum(['CREATOR', 'APPROVER'])
  role: 'CREATOR' | 'APPROVER';
}
