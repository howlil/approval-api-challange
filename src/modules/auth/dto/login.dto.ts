import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'creator@dot-id.local', description: 'Alamat email pengguna' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'creator123', description: 'Kata sandi', minLength: 1 })
  @IsString()
  @MinLength(1, { message: 'Password is required' })
  password: string;
}
