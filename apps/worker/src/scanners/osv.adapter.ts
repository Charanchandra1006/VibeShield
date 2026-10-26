import { NormalizedFinding, ScannerAdapter } from './adapter.interface.js';
import { execFile } from 'child_process';
import { promisify } from 'util';
import * as crypto from 'crypto';

const execFileAsync = promisify(execFile);

export class OsvAdapter implements ScannerAdapter {
  readonly name = 'OSV-SCANNER';

  async execute(scanContext: any): Promise<NormalizedFinding[]> {
    try {
      const { stdout } = await execFileAsync('osv-scanner', [
        'scan',
        'source',
        '-r',
        scanContext.sourcePath,
        '--format',
        'json',
      ], {
        maxBuffer: 20 * 1024 * 1024,
      });
      return this.parseOutput(stdout, scanContext.sourcePath);
    } catch (error: any) {
      if (error.stdout) {
        return this.parseOutput(error.stdout, scanContext.sourcePath);
      }
      console.warn('[OsvAdapter] OSV-Scanner execution error:', error.message);
      return [];
    }
  }

  private parseOutput(stdout: string, sourcePath: string): NormalizedFinding[] {
    try {
      if (!stdout || stdout.trim() === '') return [];
      
      // Some versions output logs before JSON; locate first '{'
      const jsonStart = stdout.indexOf('{');
      if (jsonStart === -1) return [];
      const jsonStr = stdout.slice(jsonStart);

      const data = JSON.parse(jsonStr);
      const findings: NormalizedFinding[] = [];

      if (data.results && Array.isArray(data.results)) {
        for (const result of data.results) {
          let cleanFile = result.source?.path || 'package.json';
          if (cleanFile.startsWith(sourcePath)) {
            cleanFile = cleanFile.slice(sourcePath.length).replace(/^[/\\]+/, '');
          }

          if (result.packages && Array.isArray(result.packages)) {
            for (const pkg of result.packages) {
              const pkgName = pkg.package?.name || 'unknown-package';
              const pkgVersion = pkg.package?.version || '';
              const vulns = pkg.vulnerabilities || [];

              for (const vuln of vulns) {
                const vulnId = vuln.id || 'CVE-UNKNOWN';
                const fingerprint = crypto.createHash('sha256').update(`OSV:${vulnId}:${pkgName}:${cleanFile}`).digest('hex');

                let severity: NormalizedFinding['severity'] = 'HIGH';
                const dbSev = vuln.database_specific?.severity?.toUpperCase();
                if (dbSev === 'CRITICAL') severity = 'CRITICAL';
                else if (dbSev === 'HIGH') severity = 'HIGH';
                else if (dbSev === 'MODERATE' || dbSev === 'MEDIUM') severity = 'MEDIUM';
                else if (dbSev === 'LOW') severity = 'LOW';

                findings.push({
                  engine: this.name,
                  ruleId: vulnId,
                  severity,
                  title: `Vulnerable Dependency: ${pkgName}${pkgVersion ? '@' + pkgVersion : ''}`,
                  description: vuln.summary || vuln.details || `Known vulnerability (${vulnId}) in package ${pkgName}`,
                  filePath: cleanFile,
                  startLine: 1,
                  evidence: `Dependency: "${pkgName}": "${pkgVersion || 'latest'}" (${vulnId})`,
                  fingerprint,
                });
              }
            }
          }
        }
      }
      return findings;
    } catch (e) {
      console.warn('[OsvAdapter] Failed to parse output:', e);
      return [];
    }
  }
}
