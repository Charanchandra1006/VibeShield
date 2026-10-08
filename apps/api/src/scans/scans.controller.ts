import { Controller, Post, Get, Param, Body, UseGuards, Req } from '@nestjs/common';
import { ScansService } from './scans.service.js';
import { AuthGuard } from '../auth/auth.guard.js';

@Controller('projects/:projectId/scans')
@UseGuards(AuthGuard)
export class ScansController {
  constructor(private readonly scansService: ScansService) {}

  @Post()
  async createScan(@Param('projectId') projectId: string, @Body('profile') profile: string, @Req() req: any) {
    const scan = await this.scansService.createScan(projectId, req.user.workspaceId, profile || 'default');
    return { success: true, data: scan };
  }

  @Get()
  async getScans(@Param('projectId') projectId: string, @Req() req: any) {
    const scans = await this.scansService.getScans(projectId, req.user.workspaceId);
    return { success: true, data: scans };
  }
}
