import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@ApiTags('Autentikasi')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login', description: 'Masuk dengan email dan kata sandi. Mengembalikan token JWT untuk dipakai di header Authorization.' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Berhasil. Response berisi access_token.' })
  @ApiResponse({ status: 400, description: 'Validasi gagal (email/kata sandi tidak valid).' })
  @ApiResponse({ status: 401, description: 'Email atau kata sandi salah.' })
  async login(@Body() body: LoginDto) {
    return this.authService.login(body.email, body.password);
  }
}