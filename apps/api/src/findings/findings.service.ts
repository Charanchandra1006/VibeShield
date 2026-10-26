import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class FindingsService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string, workspaceId: string) {
    const finding = await this.prisma.finding.findUnique({
      where: { id },
      include: {
        occurrences: {
          orderBy: { startLine: 'asc' },
        },
        project: {
          select: {
            id: true,
            name: true,
            slug: true,
            framework: true,
            sourceType: true,
            workspaceId: true,
          },
        },
        remediations: {
          orderBy: { generatedAt: 'desc' },
          take: 1,
        },
        reviews: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!finding || finding.project.workspaceId !== workspaceId) {
      throw new NotFoundException('Finding not found');
    }

    return finding;
  }

  async updateStatus(id: string, status: string, userId: string, workspaceId: string, reason?: string) {
    const allowed = ['OPEN', 'RESOLVED', 'FALSE_POSITIVE'];
    if (!allowed.includes(status)) {
      throw new BadRequestException(`Status must be one of: ${allowed.join(', ')}`);
    }

    // Verify access
    const finding = await this.findById(id, workspaceId);

    // Update status
    const updated = await this.prisma.finding.update({
      where: { id },
      data: { status },
      include: {
        occurrences: true,
        project: true,
      },
    });

    // Record review decision
    await this.prisma.findingReview.create({
      data: {
        findingId: id,
        reviewerId: userId,
        decision: status,
        reason: reason || `Status marked as ${status} by user`,
      },
    });

    return updated;
  }
}
