import { Worker, Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import IORedis from 'ioredis';
import { SemgrepAdapter } from './scanners/semgrep.adapter';
import { GitleaksAdapter } from './scanners/gitleaks.adapter';
import { OsvAdapter } from './scanners/osv.adapter';
import { ConfigAdapter } from './scanners/config.adapter';
import { ScanNormalizer } from './normalization/normalizer';
import { ScannerAdapter } from './scanners/adapter.interface';

const connection = new IORedis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
});

const prisma = new PrismaClient();
const normalizer = new ScanNormalizer(prisma);

const adapters: ScannerAdapter[] = [
  new SemgrepAdapter(),
  new GitleaksAdapter(),
  new OsvAdapter(),
  new ConfigAdapter(),
];

const worker = new Worker('scan-jobs', async (job: Job) => {
  const { scanId, projectId, snapshotId, profile } = job.data;
  console.log(`[Worker] Started processing scan ${scanId} for project ${projectId}`);

  try {
    await prisma.scan.update({ where: { id: scanId }, data: { status: 'PREPARING', progress: 10 } });

    // Mock extracting source code snapshot to a temporary directory
    const sourcePath = '/tmp/vibeshield-scan-' + scanId;
    console.log(`[Worker] Snapshot extracted to ${sourcePath}`);
    
    await prisma.scan.update({ where: { id: scanId }, data: { status: 'SCANNING', progress: 30 } });

    // Execute all scanners
    const allFindings = [];
    for (const adapter of adapters) {
      console.log(`[Worker] Running engine: ${adapter.name}`);
      
      const startTime = Date.now();
      const findings = await adapter.execute({ sourcePath });
      const durationMs = Date.now() - startTime;
      
      allFindings.push(...findings);

      // Record execution metadata
      await prisma.scannerExecution.create({
        data: {
          scanId,
          engine: adapter.name,
          version: 'latest',
          status: 'SUCCESS',
          findingsCount: findings.length,
          durationMs,
        }
      });
    }

    await prisma.scan.update({ where: { id: scanId }, data: { status: 'NORMALIZING', progress: 80 } });

    // Normalize and persist findings
    await normalizer.normalizeAndPersist(projectId, scanId, allFindings);

    // Finalize scan
    await prisma.scan.update({
      where: { id: scanId },
      data: { 
        status: 'COMPLETED', 
        progress: 100,
        coverage: 100, 
      }
    });

    console.log(`[Worker] Completed processing scan ${scanId} with ${allFindings.length} findings.`);
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
