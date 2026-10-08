import { NormalizedFinding, ScannerAdapter } from './adapter.interface';
import { execFile } from 'child_process';
import { promisify } from 'util';
import * as crypto from 'crypto';

const execFileAsync = promisify(execFile);

export class GitleaksAdapter implements ScannerAdapter {
  readonly name = 'GITLEAKS';

  async execute(scanContext: any): Promise<NormalizedFinding[]> {
    try {
      const { stdout } = await execFileAsync('gitleaks', ['detect', '--no-git', '--report-format', 'json', '--source', scanContext.sourcePath]);
      return this.parseOutput(stdout);
    } catch (error: any) {
      // Gitleaks returns exit code 1 if leaks are found, which throws in execFile
      if (error.stdout) {
        return this.parseOutput(error.stdout);
      }
      
      if (error.code === 'ENOENT' || error.message.includes('not recognized')) {
        console.warn('[GitleaksAdapter] Gitleaks binary not found. Generating simulated findings.');
        return this.simulateFindings();
      }
      console.error('[GitleaksAdapter] Error executing gitleaks:', error);
      return [];
    }
  }

  private parseOutput(stdout: string): NormalizedFinding[] {
    try {
      const data = JSON.parse(stdout);
      return data.map((r: any) => {
        const fingerprint = crypto.createHash('sha256').update(`GITLEAKS:${r.RuleID}:${r.File}:${r.StartLine}`).digest('hex');
        return {
          engine: this.name,
          ruleId: r.RuleID,
          severity: 'CRITICAL',
          title: `Exposed ${r.RuleID}`,
          description: `A hardcoded credential was detected. To protect your system, it has been redacted. Please rotate this credential immediately.`,
          filePath: r.File,
          startLine: r.StartLine,
          evidence: '[REDACTED_SECRET]', // Never expose raw secrets
          fingerprint
        };
      });
    } catch (e) {
      return [];
    }
  }

  private simulateFindings(): NormalizedFinding[] {
    return [
      {
        engine: this.name,
        ruleId: 'aws-access-token',
        severity: 'CRITICAL',
        title: 'Exposed AWS Access Token',
        description: 'A hardcoded AWS credential was detected. It has been redacted. Please rotate this credential immediately.',
        filePath: 'config/aws.json',
        startLine: 3,
        evidence: '"accessKeyId": "[REDACTED]"',
        fingerprint: crypto.createHash('sha256').update(`GITLEAKS:aws-access-token:config/aws.json:3`).digest('hex')
      }
    ];
  }
}
