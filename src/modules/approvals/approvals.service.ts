import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ApprovalsRepository } from './approvals.repository';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ApprovalsService {
  constructor(
    private readonly approvalsRepository: ApprovalsRepository,
    private readonly prisma: PrismaService,
  ) {}

  async decide(
    requestId: string,
    approverId: string,
    role: string,
    data: { decision: 'APPROVED' | 'REJECTED'; note?: string },
  ) {
    if (role !== 'APPROVER') {
      throw new ForbiddenException('Only APPROVER can approve or reject');
    }
    const request = await this.prisma.request.findUnique({
      where: { id: requestId },
    });
    if (!request) {
      throw new NotFoundException('Request not found');
    }
    if (request.createdById === approverId) {
      throw new ForbiddenException('Cannot approve or reject your own request');
    }
    if (request.status !== 'PENDING') {
      throw new BadRequestException('Request is already decided');
    }
    const existing = await this.approvalsRepository.findExisting(requestId, approverId);
    if (existing) {
      throw new ConflictException('You have already decided this request');
    }
    const newStatus = data.decision === 'APPROVED' ? 'APPROVED' : 'REJECTED';
    await this.prisma.$transaction([
      this.prisma.approval.create({
        data: {
          requestId,
          approverId,
          decision: data.decision,
          note: data.note ?? undefined,
        },
      }),
      this.prisma.request.update({
        where: { id: requestId },
        data: { status: newStatus },
      }),
    ]);
    return { requestId, decision: data.decision, status: newStatus };
  }

  async findHistoryByRequestId(requestId: string, userId: string, role: string) {
    const request = await this.prisma.request.findUnique({
      where: { id: requestId },
    });
    if (!request) {
      throw new NotFoundException('Request not found');
    }
    if (role === 'CREATOR' && request.createdById !== userId) {
      throw new ForbiddenException('Forbidden');
    }
    return this.approvalsRepository.findManyByRequestId(requestId);
  }
}
