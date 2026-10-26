import { NormalizedFinding, ScannerAdapter } from './adapter.interface.js';
import { execFile } from 'child_process';
import { promisify } from 'util';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const execFileAsync = promisify(execFile);

export class SemgrepAdapter implements ScannerAdapter {
  readonly name = 'SEMGREP';

  async execute(scanContext: any): Promise<NormalizedFinding[]> {
    const reportPath = path.join(os.tmpdir(), `semgrep-${Date.now()}-${Math.random().toString(36).substring(7)}.json`);
    try {
      await execFileAsync('semgrep', [
        'scan',
        '--config',
        'auto',
        '--json',
        '--output',
        reportPath,
        scanContext.sourcePath,
      ], {
        maxBuffer: 20 * 1024 * 1024,
      });

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
          // ignore
        }
      }
      console.warn('[SemgrepAdapter] Semgrep execution error:', error.message);
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
      if (!data.results || !Array.isArray(data.results)) return [];

      return data.results.map((r: any) => {
        let cleanFile = r.path || 'unknown';
        if (cleanFile.startsWith(sourcePath)) {
          cleanFile = cleanFile.slice(sourcePath.length).replace(/^[/\\]+/, '');
        }

        const line = r.start?.line || 1;
        const fingerprint = crypto.createHash('sha256').update(`SEMGREP:${r.check_id}:${cleanFile}:${line}`).digest('hex');

        return {
          engine: this.name,
          ruleId: r.check_id,
          severity: this.mapSeverity(r.extra?.severity),
          title: r.extra?.message?.split('.')[0] || r.check_id,
          description: r.extra?.message || `Semgrep rule ${r.check_id} triggered.`,
          filePath: cleanFile,
          startLine: line,
          evidence: r.extra?.lines || undefined,
          fingerprint,
        };
      });
    } catch (e) {
      console.warn('[SemgrepAdapter] Failed to parse output:', e);
      return [];
    }
  }

  private mapSeverity(raw: string): NormalizedFinding['severity'] {
    if (!raw) return 'MEDIUM';
    const s = raw.toUpperCase();
    if (s === 'ERROR' || s === 'CRITICAL') return 'HIGH';
    if (s === 'WARNING') return 'MEDIUM';
    if (s === 'INFO') return 'LOW';
    return 'MEDIUM';
  }
}
