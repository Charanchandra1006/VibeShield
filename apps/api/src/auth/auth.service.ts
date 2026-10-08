import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { UsersService } from '../users/users.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';

export interface AuthSession {
  userId: string;
  sessionId: string;
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private prisma: PrismaService,
  ) {}

  async register(email: string, passwordRaw: string, name: string) {
    const existing = await this.usersService.findByEmail(email);
    if (existing) {
      throw new BadRequestException('Email already in use');
    }

    const passwordHash = await argon2.hash(passwordRaw, { type: argon2.argon2id });
    const user = await this.usersService.create({
      email,
      passwordHash,
      name,
    });

    // Create default workspace for user
    await this.prisma.workspace.create({
      data: {
        name: `${name}'s Workspace`,
        slug: name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + crypto.randomBytes(3).toString('hex'),
        ownerId: user.id,
        members: {
          create: {
            userId: user.id,
            role: 'Owner'
          }
        }
      }
    });

    return this.createSession(user.id);
  }

  async login(email: string, passwordRaw: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await argon2.verify(user.passwordHash, passwordRaw);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.createSession(user.id);
  }

  async logout(sessionId: string) {
    await this.prisma.session.delete({
      where: { id: sessionId }
    }).catch(() => null);
  }

  async validateSession(token: string): Promise<AuthSession | null> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const session = await this.prisma.session.findUnique({
      where: { tokenHash }
    });

    if (!session || session.expiresAt < new Date()) {
      return null;
    }
    
    return {
      userId: session.userId,
      sessionId: session.id,
    };
  }

  private async createSession(userId: string) {
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days session

    const session = await this.prisma.session.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      }
    });

    return { token, session };
  }
}
