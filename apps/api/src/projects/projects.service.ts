import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Prisma, Project } from '@prisma/client';
import crypto from 'crypto';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async create(workspaceId: string, name: string, framework: string | null, sourceType: string): Promise<Project> {
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + crypto.randomBytes(3).toString('hex');
    
    return this.prisma.project.create({
      data: {
        workspaceId,
        name,
        slug,
        framework,
        sourceType,
      },
    });
  }

  async findAll(workspaceId: string): Promise<Project[]> {
    return this.prisma.project.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      include: {
        scans: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });
  }

  async findById(id: string, workspaceId: string): Promise<Project> {
    const project = await this.prisma.project.findFirst({
      where: { id, workspaceId },
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }
}
