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
import type { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';
import { ListRequestsQueryDto } from './dto/list-requests-query.dto';
import { RequestsService } from './requests.service';

type JwtUser = { sub: string; email: string; role: string };

@Controller('requests')
@UseGuards(JwtAuthGuard)
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(['CREATOR'])
  @HttpCode(HttpStatus.CREATED)
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
  async findOne(
    @Req() req: Request & { user: JwtUser },
    @Param('id') id: string,
  ) {
    return this.requestsService.findById(id, req.user.sub, req.user.role);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(['CREATOR'])
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
