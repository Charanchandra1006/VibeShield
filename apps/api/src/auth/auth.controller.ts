import { Controller, Post, Body, Res, Req, Get, HttpCode, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import type { Response, Request } from 'express';
import { z } from 'zod';
import { UsersService } from '../users/users.service.js';

const LoginDto = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const RegisterDto = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
});

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService
  ) {}

  @Post('register')
  async register(@Body() body: any, @Res({ passthrough: true }) res: Response) {
    const parsed = RegisterDto.parse(body);
    const { token } = await this.authService.register(parsed.email, parsed.password, parsed.name);
    this.setCookie(res, token);
    return { success: true };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: any, @Res({ passthrough: true }) res: Response) {
    const parsed = LoginDto.parse(body);
    const { token } = await this.authService.login(parsed.email, parsed.password);
    this.setCookie(res, token);
    return { success: true };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies['session_token'];
    if (token) {
      const session = await this.authService.validateSession(token);
      if (session) {
        await this.authService.logout(session.sessionId);
      }
    }
    res.clearCookie('session_token');
    return { success: true };
  }

  @Get('me')
  async me(@Req() req: Request) {
    const token = req.cookies['session_token'];
    if (!token) throw new UnauthorizedException('No session');
    
    const session = await this.authService.validateSession(token);
    if (!session) throw new UnauthorizedException('Invalid session');
    
    const user = await this.usersService.findById(session.userId);
    if (!user) throw new UnauthorizedException('User not found');
    
    return { 
      success: true, 
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl
      }
    };
  }

  private setCookie(res: Response, token: string) {
    res.cookie('session_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });
  }
}
