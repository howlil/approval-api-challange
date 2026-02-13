import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { TransformResponseInterceptor } from './common/interceptors/transform-response.interceptor';
import {APP_INTERCEPTOR} from '@nestjs/core';

@Module({
  imports: [PrismaModule],
  controllers: [],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: TransformResponseInterceptor },
  ],
})
export class AppModule {}