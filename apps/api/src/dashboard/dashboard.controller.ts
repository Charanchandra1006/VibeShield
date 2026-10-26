import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { DashboardService } from './dashboard.service.js';
import { AuthGuard } from '../auth/auth.guard.js';

@Controller('dashboard')
@UseGuards(AuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  async getOverview(@Req() req: any) {
    const data = await this.dashboardService.getOverview(req.user.workspaceId);
    return { success: true, data };
  }
}
