import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    try {
      await this.$connect();
    } catch (err) {
      console.warn(
        '[Prisma] Could not connect to DATABASE_URL on boot. API will stay up, but DB-backed routes will fail until the database is reachable. ' +
          'Check .env DATABASE_URL and run `docker compose up -d postgres` or use a reachable Neon URL. Original error: ' +
          (err as Error)?.message,
      );
      // Don't rethrow — allow Nest to boot so health checks + frontend still work.
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
