import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.cookies['session_token'];
    
    if (!token) {
      throw new UnauthorizedException();
    }
    
    const session = await this.authService.validateSession(token);
    if (!session) {
      throw new UnauthorizedException();
    }
    
    // Find user's default workspace for MVP
    const workspaceMember = await this.prisma.workspaceMember.findFirst({
      where: { userId: session.userId }
    });

    request.user = { id: session.userId, workspaceId: workspaceMember?.workspaceId };
    return true;
  }
}
