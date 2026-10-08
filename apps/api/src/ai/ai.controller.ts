import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AIService, AIRequest } from './ai.service.js';
import { AuthGuard } from '../auth/auth.guard.js';

@Controller('ai')
@UseGuards(AuthGuard)
export class AIController {
  constructor(private readonly aiService: AIService) {}

  @Post('explain')
  async explain(@Body() body: AIRequest) {
    const explanation = await this.aiService.explainFinding(body);
    return { success: true, data: explanation };
  }
}
