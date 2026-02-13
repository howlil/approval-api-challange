import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { DecideApprovalDto } from './dto/decide-approval.dto';
import { ApprovalsService } from './approvals.service';

type JwtUser = { sub: string; email: string; role: string };

@ApiTags('Persetujuan')
@ApiBearerAuth('JWT')
@Controller('requests')
@UseGuards(JwtAuthGuard)
export class ApprovalsController {
  constructor(private readonly approvalsService: ApprovalsService) {}

  @Post(':id/decide')
  @UseGuards(RolesGuard)
  @Roles(['APPROVER'])
  @ApiOperation({ summary: 'Putuskan permintaan', description: 'Hanya APPROVER. Menyetujui atau menolak permintaan. Tidak boleh memutus permintaan sendiri. Permintaan harus status PENDING.' })
  @ApiParam({ name: 'id', description: 'UUID permintaan' })
  @ApiBody({ type: DecideApprovalDto })
  @ApiResponse({ status: 201, description: 'Keputusan berhasil disimpan. Status permintaan berubah (APPROVED/REJECTED).' })
  @ApiResponse({ status: 400, description: 'Permintaan sudah diputus atau validasi gagal.' })
  @ApiResponse({ status: 401, description: 'Token tidak valid.' })
  @ApiResponse({ status: 403, description: 'Bukan APPROVER, atau approver memutus permintaan sendiri.' })
  @ApiResponse({ status: 404, description: 'Permintaan tidak ditemukan.' })
  @ApiResponse({ status: 409, description: 'Approver sudah pernah memutus permintaan ini.' })
  async decide(
    @Req() req: Request & { user: JwtUser },
    @Param('id') id: string,
    @Body() body: DecideApprovalDto,
  ) {
    return this.approvalsService.decide(id, req.user.sub, req.user.role, {
      decision: body.decision,
      note: body.note,
    });
  }

  @Get(':id/approvals')
  @ApiOperation({ summary: 'Riwayat persetujuan', description: 'Daftar keputusan (approve/reject) untuk suatu permintaan. CREATOR hanya untuk permintaan sendiri; APPROVER untuk semua.' })
  @ApiParam({ name: 'id', description: 'UUID permintaan' })
  @ApiResponse({ status: 200, description: 'Daftar riwayat persetujuan (approver, decision, note, approvedAt).' })
  @ApiResponse({ status: 401, description: 'Token tidak valid.' })
  @ApiResponse({ status: 403, description: 'CREATOR mengakses permintaan orang lain.' })
  @ApiResponse({ status: 404, description: 'Permintaan tidak ditemukan.' })
  async findHistory(
    @Req() req: Request & { user: JwtUser },
    @Param('id') id: string,
  ) {
    return this.approvalsService.findHistoryByRequestId(id, req.user.sub, req.user.role);
  }
}
