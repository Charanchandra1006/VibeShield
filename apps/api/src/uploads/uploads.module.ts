import { Module } from '@nestjs/common';
import { UploadsService } from './uploads.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  providers: [UploadsService],
  exports: [UploadsService],
})
export class UploadsModule {}
