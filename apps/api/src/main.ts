import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load root .env (monorepo) + local .env for DATABASE_URL, REDIS_*, S3_* etc.
try {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  // dist/*.js -> ../../../.env = repo root; src/*.ts -> ../../.env = repo root
  dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
  dotenv.config({ path: path.resolve(__dirname, '../../.env') });
  dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
  dotenv.config();
} catch {
  dotenv.config();
}

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 3001);
}
await bootstrap();
