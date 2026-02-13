import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { DecideApprovalDto } from './dto/decide-approval.dto';
import { ApprovalsService } from './approvals.service';

type JwtUser = { sub: string; email: string; role: string };

@Controller('requests')
@UseGuards(JwtAuthGuard)
export class ApprovalsController {
  constructor(private readonly approvalsService: ApprovalsService) {}

  @Post(':id/decide')
  @UseGuards(RolesGuard)
  @Roles(['APPROVER'])
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
  async findHistory(
    @Req() req: Request & { user: JwtUser },
    @Param('id') id: string,
  ) {
    return this.approvalsService.findHistoryByRequestId(id, req.user.sub, req.user.role);
  }
}
