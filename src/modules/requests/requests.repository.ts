import { Injectable } from '@nestjs/common';
import type { RequestStatus } from '../../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RequestsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(params: {
    where?: { createdById?: string; status?: RequestStatus };
    skip: number;
    take: number;
    orderBy?: { createdAt?: 'asc' | 'desc' };
  }) {
    return this.prisma.request.findMany({
      where: params.where,
      skip: params.skip,
      take: params.take,
      orderBy: params.orderBy ?? { createdAt: 'desc' },
      include: { creator: { select: { id: true, email: true, name: true, role: true } } },
    });
  }

  async count(where?: { createdById?: string; status?: RequestStatus }): Promise<number> {
    return this.prisma.request.count({ where });
  }

  async findById(id: string) {
    return this.prisma.request.findUnique({
      where: { id },
      include: { creator: { select: { id: true, email: true, name: true, role: true } } },
    });
  }

  async create(data: { title: string; description?: string | null; createdById: string }) {
    return this.prisma.request.create({
      data: {
        title: data.title,
        description: data.description ?? undefined,
        createdById: data.createdById,
      },
    });
  }

  async update(
    id: string,
    data: { title?: string; description?: string | null; status?: RequestStatus },
  ) {
    return this.prisma.request.update({
      where: { id },
      data,
    });
  }
}
