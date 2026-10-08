import { PrismaClient } from '@vibeshield/database';
import { NormalizedFinding } from '../scanners/adapter.interface';

export class ScanNormalizer {
  constructor(private prisma: PrismaClient) {}

  async normalizeAndPersist(projectId: string, scanId: string, findings: NormalizedFinding[]) {
    console.log(`[Normalizer] Processing ${findings.length} findings for scan ${scanId}`);

    for (const raw of findings) {
      // Upsert the logical Finding based on fingerprint
      const finding = await this.prisma.finding.upsert({
        where: {
          projectId_fingerprint: {
            projectId,
            fingerprint: raw.fingerprint
          }
        },
        create: {
          projectId,
          fingerprint: raw.fingerprint,
          firstSeenScanId: scanId,
          lastSeenScanId: scanId,
          status: 'OPEN',
        },
        update: {
          lastSeenScanId: scanId,
          status: 'OPEN' // Re-open if it was fixed but detected again
        }
      });

      // Create the occurrence for this specific scan
      await this.prisma.findingOccurrence.create({
        data: {
          findingId: finding.id,
          scanId,
          ruleId: raw.ruleId,
          severity: raw.severity,
          filePath: raw.filePath,
          startLine: raw.startLine,
          evidence: raw.evidence,
        }
      });
    }

    // Task 6.4: Update Scan Score/Coverage here if needed
    console.log(`[Normalizer] Persisted findings to database.`);
  }
}
