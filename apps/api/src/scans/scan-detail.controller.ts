import { Controller, Get, Param, UseGuards, Req } from '@nestjs/common';
import { ScansService } from './scans.service.js';
import { AuthGuard } from '../auth/auth.guard.js';

@Controller('scans')
@UseGuards(AuthGuard)
export class ScanDetailController {
  constructor(private readonly scansService: ScansService) {}

  @Get(':scanId')
  async getScanById(@Param('scanId') scanId: string, @Req() req: any) {
    const scan = await this.scansService.getScanById(scanId, req.user.workspaceId);
    return { success: true, data: scan };
  }
}
