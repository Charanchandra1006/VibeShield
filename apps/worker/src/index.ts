import { Worker, Job } from 'bullmq';
import { PrismaClient } from '@vibeshield/database';
import IORedis from 'ioredis';
import * as dotenv from 'dotenv';

dotenv.config();

const connection = new IORedis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
});

const prisma = new PrismaClient();

const worker = new Worker('scan-jobs', async (job: Job) => {
  const { scanId, projectId, snapshotId, profile } = job.data;
  console.log(`[Worker] Started processing scan ${scanId} for project ${projectId} with profile ${profile}`);

  try {
    // 1. Update status to PREPARING
    await prisma.scan.update({
      where: { id: scanId },
      data: { status: 'PREPARING', progress: 10 }
    });

    // 2. Mock pulling snapshot & extracting (In MVP this would hit S3)
    console.log(`[Worker] Snapshot ${snapshotId} retrieved. Environment prepared.`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 3. Update status to SCANNING
    await prisma.scan.update({
      where: { id: scanId },
      data: { status: 'SCANNING', progress: 30 }
    });

    // 4. Mock Semgrep & Gitleaks scanning
    console.log(`[Worker] Running Semgrep & Gitleaks on source...`);
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 5. Update status to NORMALIZING
    await prisma.scan.update({
      where: { id: scanId },
      data: { status: 'NORMALIZING', progress: 80 }
    });

    // 6. Finalize scan status
    await prisma.scan.update({
      where: { id: scanId },
      data: { 
        status: 'COMPLETED', 
        progress: 100,
        coverage: 100, // 100% of files scanned successfully
      }
    });

    console.log(`[Worker] Completed processing scan ${scanId}`);
    return { success: true };
  } catch (error) {
    console.error(`[Worker] Error processing scan ${scanId}:`, error);
    await prisma.scan.update({
      where: { id: scanId },
      data: { status: 'FAILED' }
    });
    throw error;
  }
}, { connection, concurrency: 2 });

worker.on('ready', () => {
  console.log('[Worker] Scan Orchestrator is running and listening for jobs...');
});

worker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed:`, err.message);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await worker.close();
  await prisma.$disconnect();
  process.exit(0);
});
