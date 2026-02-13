import { Module } from '@nestjs/common';
import { RequestsController } from './requests.controller';
import { RequestsRepository } from './requests.repository';
import { RequestsService } from './requests.service';

@Module({
  controllers: [RequestsController],
  providers: [RequestsRepository, RequestsService],
  exports: [RequestsService],
})
export class RequestsModule {}
