import { Controller, Get, Patch, Param, Body, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { FindingsService } from './findings.service.js';
import { AuthGuard } from '../auth/auth.guard.js';

@Controller('findings')
@UseGuards(AuthGuard)
export class FindingsController {
  constructor(private readonly findingsService: FindingsService) {}

  @Get(':id')
  async getFinding(@Param('id') id: string, @Req() req: any) {
    const finding = await this.findingsService.findById(id, req.user.workspaceId);
    return { success: true, data: finding };
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Body('reason') reason: string,
    @Req() req: any,
  ) {
    if (!status) throw new BadRequestException('Status is required');
    const updated = await this.findingsService.updateStatus(
      id,
      status,
      req.user.id,
      req.user.workspaceId,
      reason,
    );
    return { success: true, data: updated };
  }
}
