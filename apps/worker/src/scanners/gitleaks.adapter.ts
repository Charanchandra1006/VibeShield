import { NormalizedFinding, ScannerAdapter } from './adapter.interface.js';
import { execFile } from 'child_process';
import { promisify } from 'util';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const execFileAsync = promisify(execFile);

export class GitleaksAdapter implements ScannerAdapter {
  readonly name = 'GITLEAKS';

  async execute(scanContext: any): Promise<NormalizedFinding[]> {
    const reportPath = path.join(os.tmpdir(), `gitleaks-${Date.now()}-${Math.random().toString(36).substring(7)}.json`);
    try {
      // --exit-code 0 ensures gitleaks exits with 0 even when leaks are found
      await execFileAsync('gitleaks', [
        'detect',
        '--no-git',
        '--source',
        scanContext.sourcePath,
        '--report-format',
        'json',
        '--report-path',
        reportPath,
        '--exit-code',
        '0',
      ]);

      if (fs.existsSync(reportPath)) {
        const rawContent = fs.readFileSync(reportPath, 'utf8');
        return this.parseOutput(rawContent, scanContext.sourcePath);
      }
      return [];
    } catch (error: any) {
      if (fs.existsSync(reportPath)) {
        try {
          const rawContent = fs.readFileSync(reportPath, 'utf8');
          return this.parseOutput(rawContent, scanContext.sourcePath);
        } catch {
          // fallback
        }
      }
      console.error('[GitleaksAdapter] Error executing gitleaks:', error.message);
      return [];
    } finally {
      if (fs.existsSync(reportPath)) {
        try {
          fs.unlinkSync(reportPath);
        } catch {
          // ignore
        }
      }
    }
  }

  private parseOutput(stdout: string, sourcePath: string): NormalizedFinding[] {
    try {
      if (!stdout || stdout.trim() === '') return [];
      const data = JSON.parse(stdout);
      if (!Array.isArray(data)) return [];

      return data.map((r: any) => {
        let cleanFile = r.File || 'unknown';
        if (cleanFile.startsWith(sourcePath)) {
          cleanFile = cleanFile.slice(sourcePath.length).replace(/^[/\\]+/, '');
        }

        const line = typeof r.StartLine === 'number' ? r.StartLine : 1;
        const fingerprint = crypto.createHash('sha256').update(`GITLEAKS:${r.RuleID}:${cleanFile}:${line}`).digest('hex');
        
        let evidence = r.Match || r.Secret || '[REDACTED_SECRET]';
        if (evidence && evidence.length > 20) {
          evidence = evidence.substring(0, 8) + '...' + evidence.substring(evidence.length - 4);
        }

        return {
          engine: this.name,
          ruleId: r.RuleID || 'generic-secret',
          severity: 'CRITICAL',
          title: `Exposed ${r.RuleID || 'Secret Credential'}`,
          description: r.Description || `A hardcoded credential (${r.RuleID}) was detected in ${cleanFile}.`,
          filePath: cleanFile,
          startLine: line,
          evidence,
          fingerprint,
        };
      });
    } catch (e) {
      console.warn('[GitleaksAdapter] Failed to parse gitleaks output:', e);
      return [];
    }
  }
}
