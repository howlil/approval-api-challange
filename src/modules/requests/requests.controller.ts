import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';
import { ListRequestsQueryDto } from './dto/list-requests-query.dto';
import { RequestsService } from './requests.service';

type JwtUser = { sub: string; email: string; role: string };

@ApiTags('Permintaan')
@ApiBearerAuth('JWT')
@Controller('requests')
@UseGuards(JwtAuthGuard)
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(['CREATOR'])
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Buat permintaan', description: 'Hanya role CREATOR. Membuat permintaan baru dengan status PENDING.' })
  @ApiBody({ type: CreateRequestDto })
  @ApiResponse({ status: 201, description: 'Permintaan berhasil dibuat.' })
  @ApiResponse({ status: 400, description: 'Validasi gagal (judul kosong, dll).' })
  @ApiResponse({ status: 401, description: 'Token tidak valid.' })
  @ApiResponse({ status: 403, description: 'Hanya CREATOR yang boleh membuat permintaan.' })
  async create(
    @Req() req: Request & { user: JwtUser },
    @Body() body: CreateRequestDto,
  ) {
    return this.requestsService.create(req.user.sub, {
      title: body.title,
      description: body.description,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Daftar permintaan', description: 'CREATOR: hanya permintaan sendiri. APPROVER: semua permintaan. Bisa filter status dan paginasi.' })
  @ApiQuery({ name: 'page', required: false, description: 'Halaman' })
  @ApiQuery({ name: 'limit', required: false, description: 'Limit per halaman' })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'APPROVED', 'REJECTED'] })
  @ApiResponse({ status: 200, description: 'Daftar permintaan (items, total, page, limit).' })
  @ApiResponse({ status: 401, description: 'Token tidak valid.' })
  async findMany(
    @Req() req: Request & { user: JwtUser },
    @Query() query: ListRequestsQueryDto,
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const status = query.status;
    return this.requestsService.findMany(req.user.sub, req.user.role, {
      page,
      limit,
      status,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail permintaan', description: 'CREATOR: hanya permintaan sendiri. APPROVER: semua permintaan.' })
  @ApiParam({ name: 'id', description: 'UUID permintaan' })
  @ApiResponse({ status: 200, description: 'Detail permintaan beserta data creator.' })
  @ApiResponse({ status: 401, description: 'Token tidak valid.' })
  @ApiResponse({ status: 403, description: 'CREATOR mengakses permintaan orang lain.' })
  @ApiResponse({ status: 404, description: 'Permintaan tidak ditemukan.' })
  async findOne(
    @Req() req: Request & { user: JwtUser },
    @Param('id') id: string,
  ) {
    return this.requestsService.findById(id, req.user.sub, req.user.role);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(['CREATOR'])
  @ApiOperation({ summary: 'Ubah permintaan', description: 'Hanya CREATOR pemilik permintaan. Hanya permintaan dengan status PENDING yang bisa diubah.' })
  @ApiParam({ name: 'id', description: 'UUID permintaan' })
  @ApiBody({ type: UpdateRequestDto })
  @ApiResponse({ status: 200, description: 'Permintaan berhasil diubah.' })
  @ApiResponse({ status: 400, description: 'Permintaan sudah diputus (bukan PENDING) atau validasi gagal.' })
  @ApiResponse({ status: 401, description: 'Token tidak valid.' })
  @ApiResponse({ status: 403, description: 'Bukan pemilik atau bukan role CREATOR.' })
  @ApiResponse({ status: 404, description: 'Permintaan tidak ditemukan.' })
  async update(
    @Req() req: Request & { user: JwtUser },
    @Param('id') id: string,
    @Body() body: UpdateRequestDto,
  ) {
    return this.requestsService.update(id, req.user.sub, req.user.role, {
      title: body.title,
      description: body.description,
    });
  }
}
