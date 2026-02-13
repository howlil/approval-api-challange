import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ApprovalsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findManyByRequestId(requestId: string) {
    return this.prisma.approval.findMany({
      where: { requestId },
      orderBy: { approvedAt: 'asc' },
      include: { approver: { select: { id: true, email: true, name: true } } },
    });
  }

  async findExisting(requestId: string, approverId: string) {
    return this.prisma.approval.findFirst({
      where: { requestId, approverId },
    });
  }
}
