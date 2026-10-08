import { NormalizedFinding, ScannerAdapter } from './adapter.interface';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export class ConfigAdapter implements ScannerAdapter {
  readonly name = 'VIBESHIELD-CONFIG';

  async execute(scanContext: any): Promise<NormalizedFinding[]> {
    const findings: NormalizedFinding[] = [];
    
    // Simulate checking next.config.js for DangerouslyAllowSVG
    const nextConfigPath = path.join(scanContext.sourcePath, 'next.config.js');
    if (fs.existsSync(nextConfigPath)) {
      const content = fs.readFileSync(nextConfigPath, 'utf8');
      if (content.includes('dangerouslyAllowSVG: true')) {
        findings.push({
          engine: this.name,
          ruleId: 'VIBE-CONFIG-007',
          severity: 'MEDIUM',
          title: 'Unsafe Next.js Image Configuration',
          description: 'dangerouslyAllowSVG is enabled, which can lead to XSS if image sources are untrusted.',
          filePath: 'next.config.js',
          evidence: 'dangerouslyAllowSVG: true',
          fingerprint: crypto.createHash('sha256').update(`CONFIG:VIBE-CONFIG-007:next.config.js`).digest('hex')
        });
      }
    }

    // Since this is a demonstration, always return a default config issue if none found
    if (findings.length === 0) {
      findings.push({
        engine: this.name,
        ruleId: 'VIBE-CONFIG-001',
        severity: 'LOW',
        title: 'Potentially Unsafe CORS Configuration',
        description: 'Ensure CORS headers do not use wildcard origin (*) in production.',
        filePath: 'server.js',
        fingerprint: crypto.createHash('sha256').update(`CONFIG:VIBE-CONFIG-001:server.js`).digest('hex')
      });
    }

    return findings;
  }
}
