import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ProjectsService } from '../projects/projects.service.js';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class ScansService {
  constructor(
    private prisma: PrismaService,
    private projectsService: ProjectsService,
    @InjectQueue('scan-jobs') private scanQueue: Queue
  ) {}

  async createScan(projectId: string, workspaceId: string, profile: string) {
    // Check project authorization
    const project = await this.projectsService.findById(projectId, workspaceId);
    
    // Validate snapshot availability
    const snapshot = await this.prisma.sourceSnapshot.findFirst({
      where: { projectId },
      orderBy: { createdAt: 'desc' }
    });

    if (!snapshot) {
      throw new BadRequestException('No source snapshot found. Please upload code first.');
    }

    // Prevent duplicate active scans
    const activeScan = await this.prisma.scan.findFirst({
      where: {
        projectId,
        status: { in: ['CREATED', 'QUEUED', 'PREPARING', 'SCANNING', 'NORMALIZING'] }
      }
    });

    if (activeScan) {
      throw new BadRequestException('A scan is already active for this project.');
    }

    // Create the scan record
    const scan = await this.prisma.scan.create({
      data: {
        projectId,
        snapshotId: snapshot.id,
        status: 'CREATED',
        coverage: 0,
        settings: { profile },
      }
    });

    // Enqueue the job
    await this.scanQueue.add('start-scan', {
      scanId: scan.id,
      projectId: scan.projectId,
      snapshotId: snapshot.id,
      workspaceId,
      profile
    }, {
      jobId: scan.id,
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 }
    });

    // Update state to QUEUED
    return this.prisma.scan.update({
      where: { id: scan.id },
      data: { status: 'QUEUED' }
    });
  }

  async getScans(projectId: string, workspaceId: string) {
    await this.projectsService.findById(projectId, workspaceId);
    return this.prisma.scan.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' }
    });
  }
}
