import { Module } from '@nestjs/common';
import { ScansController } from './scans.controller.js';
import { ScansService } from './scans.service.js';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from '../prisma/prisma.module.js';
import { ProjectsModule } from '../projects/projects.module.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [
    PrismaModule,
    ProjectsModule,
    AuthModule,
    BullModule.registerQueue({
      name: 'scan-jobs',
    })
  ],
  controllers: [ScansController],
  providers: [ScansService],
})
export class ScansModule {}
