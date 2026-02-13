import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RequestsRepository } from './requests.repository';

@Injectable()
export class RequestsService {
  constructor(private readonly requestsRepository: RequestsRepository) {}

  async create(
    userId: string,
    data: { title: string; description?: string | null },
  ) {
    return this.requestsRepository.create({
      title: data.title,
      description: data.description ?? null,
      createdById: userId,
    });
  }

  async findMany(
    userId: string,
    role: string,
    params: { page: number; limit: number; status?: 'PENDING' | 'APPROVED' | 'REJECTED' },
  ) {
    const where =
      role === 'CREATOR' ? { createdById: userId, ...(params.status && { status: params.status }) } : params.status ? { status: params.status } : {};
    const [items, total] = await Promise.all([
      this.requestsRepository.findMany({
        where,
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      this.requestsRepository.count(where),
    ]);
    return { items, total, page: params.page, limit: params.limit };
  }

  async findById(id: string, userId: string, role: string) {
    const request = await this.requestsRepository.findById(id);
    if (!request) {
      throw new NotFoundException('Request not found');
    }
    if (role === 'CREATOR' && request.createdById !== userId) {
      throw new ForbiddenException('Forbidden');
    }
    return request;
  }

  async update(
    id: string,
    userId: string,
    role: string,
    data: { title?: string; description?: string | null },
  ) {
    if (role !== 'CREATOR') {
      throw new ForbiddenException('Only creator can update request');
    }
    const request = await this.requestsRepository.findById(id);
    if (!request) {
      throw new NotFoundException('Request not found');
    }
    if (request.createdById !== userId) {
      throw new ForbiddenException('Forbidden');
    }
    if (request.status !== 'PENDING') {
      throw new BadRequestException('Only PENDING request can be updated');
    }
    return this.requestsRepository.update(id, data);
  }
}
