import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getOverview(workspaceId: string) {
    // 1. Projects belonging to workspace
    const projects = await this.prisma.project.findMany({
      where: { workspaceId },
      include: {
        scans: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        findings: {
          select: {
            id: true,
            status: true,
            occurrences: {
              select: {
                severity: true,
              },
              take: 1,
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const projectIds = projects.map((p) => p.id);

    // 2. Total scans count
    const totalScans = await this.prisma.scan.count({
      where: {
        projectId: { in: projectIds },
      },
    });

    // 3. Count issues by severity across open findings
    const severityCounts = {
      CRITICAL: 0,
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0,
    };

    let totalOpenFindings = 0;

    for (const proj of projects) {
      for (const finding of proj.findings) {
        if (finding.status === 'OPEN') {
          totalOpenFindings++;
          const sev = finding.occurrences[0]?.severity?.toUpperCase() || 'LOW';
          if (sev in severityCounts) {
            severityCounts[sev as keyof typeof severityCounts]++;
          }
        }
      }
    }

    // 4. Formatted Recent Projects
    const recentProjects = projects.slice(0, 5).map((p) => {
      const openIssuesCount = p.findings.filter((f) => f.status === 'OPEN').length;
      const latestScan = p.scans[0] || null;
      let status: 'success' | 'warning' | 'critical' = 'success';
      const critCount = p.findings.filter((f) => f.status === 'OPEN' && f.occurrences[0]?.severity === 'CRITICAL').length;
      const highCount = p.findings.filter((f) => f.status === 'OPEN' && f.occurrences[0]?.severity === 'HIGH').length;

      if (critCount > 0) {
        status = 'critical';
      } else if (highCount > 0 || openIssuesCount > 0) {
        status = 'warning';
      }

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        framework: p.framework || 'Node.js',
        sourceType: p.sourceType,
        issues: openIssuesCount,
        criticalIssues: critCount,
        highIssues: highCount,
        status,
        lastScan: latestScan ? {
          id: latestScan.id,
          status: latestScan.status,
          progress: latestScan.progress,
          createdAt: latestScan.createdAt,
          completedAt: latestScan.completedAt,
        } : null,
      };
    });

    // 5. Recent Scans
    const recentScans = await this.prisma.scan.findMany({
      where: {
        projectId: { in: projectIds },
      },
      orderBy: { createdAt: 'desc' },
      take: 6,
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        executions: {
          select: {
            engine: true,
            status: true,
            findingsCount: true,
            durationMs: true,
          },
        },
      },
    });

    return {
      stats: {
        totalScans,
        totalProjects: projects.length,
        totalOpenFindings,
        criticalIssues: severityCounts.CRITICAL,
        highIssues: severityCounts.HIGH,
        mediumIssues: severityCounts.MEDIUM,
        lowIssues: severityCounts.LOW,
      },
      recentProjects,
      recentScans,
    };
  }
}
