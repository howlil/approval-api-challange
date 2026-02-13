import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UsersService } from './users.service';

@ApiTags('Pengguna')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrasi', description: 'Mendaftarkan pengguna baru (CREATOR atau APPROVER). Email harus unik.' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, description: 'Pengguna berhasil dibuat. Data pengguna dikembalikan tanpa kata sandi.' })
  @ApiResponse({ status: 400, description: 'Validasi gagal (email/password/role tidak valid).' })
  @ApiResponse({ status: 409, description: 'Email sudah terdaftar.' })
  async register(@Body() body: CreateUserDto) {
    const user = await this.usersService.create({
      email: body.email,
      name: body.name,
      password: body.password,
      role: body.role,
    });
    const { password: _, ...rest } = user;
    return rest;
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Profil saya', description: 'Mengambil data pengguna yang sedang login (memerlukan token JWT).' })
  @ApiResponse({ status: 200, description: 'Data pengguna (id, email, name, role).' })
  @ApiResponse({ status: 401, description: 'Token tidak ada atau tidak valid.' })
  async me(@Req() req: Request & { user: { sub: string } }) {
    const user = await this.usersService.findById(req.user.sub);
    if (!user) {
      return null;
    }
    const { password: _, ...rest } = user;
    return rest;
  }
}