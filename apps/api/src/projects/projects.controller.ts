import { Controller, Post, Get, Body, Param, UseGuards, Req, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProjectsService } from './projects.service.js';
import { UploadsService } from '../uploads/uploads.service.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { Request } from 'express';
import { z } from 'zod';

const CreateProjectDto = z.object({
  name: z.string().min(1),
  framework: z.string().nullable().optional(),
  sourceType: z.enum(['ZIP', 'GITHUB']).default('ZIP'),
});

@Controller('projects')
@UseGuards(AuthGuard)
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly uploadsService: UploadsService,
  ) {}

  @Post()
  async create(@Body() body: any, @Req() req: any) {
    const parsed = CreateProjectDto.parse(body);
    const workspaceId = req.user.workspaceId;
    if (!workspaceId) throw new BadRequestException('No workspace found');

    const project = await this.projectsService.create(workspaceId, parsed.name, parsed.framework ?? null, parsed.sourceType);
    return { success: true, data: project };
  }

  @Get()
  async findAll(@Req() req: any) {
    const projects = await this.projectsService.findAll(req.user.workspaceId);
    return { success: true, data: projects };
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: any) {
    const project = await this.projectsService.findById(id, req.user.workspaceId);
    return { success: true, data: project };
  }

  @Get(':id/findings')
  async getFindings(@Param('id') id: string, @Req() req: any) {
    const findings = await this.projectsService.getFindings(id, req.user.workspaceId);
    return { success: true, data: findings };
  }

  @Post(':id/uploads')
  @UseInterceptors(FileInterceptor('file'))
  async uploadSnapshot(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    if (file.mimetype !== 'application/zip' && file.mimetype !== 'application/x-zip-compressed') {
      throw new BadRequestException('Only ZIP files are supported');
    }
    
    // Validate project access
    await this.projectsService.findById(id, req.user.workspaceId);

    const snapshot = await this.uploadsService.uploadSnapshot(id, file.buffer, file.size);
    return { success: true, data: snapshot };
  }
}
