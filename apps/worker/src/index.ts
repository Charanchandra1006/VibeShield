import { Worker, Job } from 'bullmq';
import { PrismaClient } from '@vibeshield/database';
import IORedis from 'ioredis';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { SemgrepAdapter } from './scanners/semgrep.adapter.js';
import { GitleaksAdapter } from './scanners/gitleaks.adapter.js';
import { OsvAdapter } from './scanners/osv.adapter.js';
import { ConfigAdapter } from './scanners/config.adapter.js';
import { ScanNormalizer } from './normalization/normalizer.js';
import { ScannerAdapter } from './scanners/adapter.interface.js';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

const connection = new IORedis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
});

const prisma = new PrismaClient();
const normalizer = new ScanNormalizer(prisma);

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'minioadmin',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'minioadmin',
  },
  forcePathStyle: true,
});

const allAdapters: Record<string, ScannerAdapter> = {
  gitleaks: new GitleaksAdapter(),
  semgrep: new SemgrepAdapter(),
  osv: new OsvAdapter(),
  config: new ConfigAdapter(),
};

const worker = new Worker('scan-jobs', async (job: Job) => {
  const { scanId, projectId, snapshotId, profile } = job.data;
  console.log(`[Worker] Started processing scan ${scanId} for project ${projectId} (Profile: ${profile})`);

  let tempZipPath: string | null = null;
  let extractDir: string | null = null;

  try {
    await prisma.scan.update({
      where: { id: scanId },
      data: { status: 'PREPARING', progress: 10, startedAt: new Date() },
    });

    // 1. Fetch SourceSnapshot record
    const snapshot = await prisma.sourceSnapshot.findUnique({
      where: { id: snapshotId },
    });

    if (!snapshot) {
      throw new Error(`Snapshot ${snapshotId} not found`);
    }

    // 2. Download ZIP from S3/MinIO
    tempZipPath = path.join(os.tmpdir(), `vibeshield-${scanId}.zip`);
    extractDir = path.join(os.tmpdir(), `vibeshield-scan-${scanId}`);
    fs.mkdirSync(extractDir, { recursive: true });

    try {
      const s3Res = await s3Client.send(new GetObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME || 'vibeshield-uploads',
        Key: snapshot.storageKey,
      }));

      const bodyBytes = await s3Res.Body?.transformToByteArray();
      if (!bodyBytes || bodyBytes.length === 0) {
        throw new Error('Downloaded snapshot is empty');
      }
      fs.writeFileSync(tempZipPath, Buffer.from(bodyBytes));
    } catch (s3Err) {
      console.warn(`[Worker] Could not download snapshot from S3: ${(s3Err as Error).message}. Initializing empty directory.`);
    }

    // 3. Extract ZIP archive
    if (tempZipPath && fs.existsSync(tempZipPath)) {
      try {
        await execFileAsync('unzip', ['-o', '-q', tempZipPath, '-d', extractDir]);
      } catch (unzipErr: any) {
        console.warn(`[Worker] Unzip warning: ${unzipErr.message}`);
      }
    }

    // Check if zip contains a single nested root directory (e.g. from GitHub repo zipballs)
    let sourcePath = extractDir;
    try {
      const entries = fs.readdirSync(extractDir);
      if (entries.length === 1) {
        const candidate = path.join(extractDir, entries[0]);
        if (fs.statSync(candidate).isDirectory()) {
          sourcePath = candidate;
        }
      }
    } catch {
      // keep extractDir
    }

    console.log(`[Worker] Code ready for analysis at ${sourcePath}`);
    await prisma.scan.update({ where: { id: scanId }, data: { status: 'SCANNING', progress: 20 } });

    // 4. Determine which adapters to run
    const selectedAdapters: ScannerAdapter[] = [];
    if (typeof profile === 'string' && profile.toLowerCase().includes('secret')) {
      selectedAdapters.push(allAdapters.gitleaks);
    } else {
      selectedAdapters.push(allAdapters.gitleaks, allAdapters.semgrep, allAdapters.osv, allAdapters.config);
    }

    const allFindings = [];
    const stepIncrement = Math.floor(60 / selectedAdapters.length);
    let currentProgress = 20;

    for (const adapter of selectedAdapters) {
      console.log(`[Worker] Running scanner engine: ${adapter.name}`);
      const startTime = Date.now();
      let findings: any[] = [];
      let status = 'SUCCESS';
      let errorCode: string | null = null;

      try {
        findings = await adapter.execute({ sourcePath });
      } catch (err: any) {
        console.error(`[Worker] Engine ${adapter.name} failed:`, err.message);
        status = 'ERROR';
        errorCode = err.message?.substring(0, 100);
      }

      const durationMs = Date.now() - startTime;
      allFindings.push(...findings);

      // Record execution metadata
      await prisma.scannerExecution.create({
        data: {
          scanId,
          engine: adapter.name,
          version: 'latest',
          status,
          findingsCount: findings.length,
          durationMs,
          errorCode,
        },
      });

      currentProgress += stepIncrement;
      await prisma.scan.update({
        where: { id: scanId },
        data: { progress: Math.min(currentProgress, 85) },
      }).catch(() => null);
    }

    // 5. Normalizing
    await prisma.scan.update({ where: { id: scanId }, data: { status: 'NORMALIZING', progress: 90 } });
    await normalizer.normalizeAndPersist(projectId, scanId, allFindings);

    // 6. Complete Scan
    await prisma.scan.update({
      where: { id: scanId },
      data: {
        status: 'COMPLETED',
        progress: 100,
        completedAt: new Date(),
      },
    });

    console.log(`[Worker] Successfully completed scan ${scanId} with ${allFindings.length} real findings.`);
    return { success: true, findingsCount: allFindings.length };
  } catch (error: any) {
    console.error(`[Worker] Error processing scan ${scanId}:`, error);
    await prisma.scan.update({
      where: { id: scanId },
      data: { status: 'FAILED' },
    }).catch(() => null);
    throw error;
  } finally {
    // 7. Cleanup temporary artifacts
    try {
      if (tempZipPath && fs.existsSync(tempZipPath)) {
        fs.unlinkSync(tempZipPath);
      }
      if (extractDir && fs.existsSync(extractDir)) {
        fs.rmSync(extractDir, { recursive: true, force: true });
      }
    } catch {
      // ignore cleanup errors
    }
  }
}, { connection, concurrency: 2 });

worker.on('ready', () => {
  console.log('[Worker] Scan Orchestrator is running and listening for jobs...');
});

worker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed:`, err.message);
});

process.on('SIGTERM', async () => {
  await worker.close();
  await prisma.$disconnect();
});
