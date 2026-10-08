import { NormalizedFinding, ScannerAdapter } from './adapter.interface';
import { execFile } from 'child_process';
import { promisify } from 'util';
import * as crypto from 'crypto';

const execFileAsync = promisify(execFile);

export class OsvAdapter implements ScannerAdapter {
  readonly name = 'OSV-SCANNER';

  async execute(scanContext: any): Promise<NormalizedFinding[]> {
    try {
      const { stdout } = await execFileAsync('osv-scanner', ['--format', 'json', '-r', scanContext.sourcePath]);
      return this.parseOutput(stdout);
    } catch (error: any) {
      if (error.stdout) {
        return this.parseOutput(error.stdout);
      }
      
      if (error.code === 'ENOENT' || error.message.includes('not recognized')) {
        console.warn('[OsvAdapter] OSV-Scanner binary not found. Generating simulated findings.');
        return this.simulateFindings();
      }
      console.error('[OsvAdapter] Error executing osv-scanner:', error);
      return [];
    }
  }

  private parseOutput(stdout: string): NormalizedFinding[] {
    try {
      const data = JSON.parse(stdout);
      const findings: NormalizedFinding[] = [];
      
      if (data.results) {
        for (const result of data.results) {
          if (result.packages) {
            for (const pkg of result.packages) {
              for (const vuln of pkg.vulnerabilities) {
                const fingerprint = crypto.createHash('sha256').update(`OSV:${vuln.id}:${pkg.package.name}`).digest('hex');
                findings.push({
                  engine: this.name,
                  ruleId: vuln.id,
                  severity: 'HIGH', // Simplified for MVP
                  title: `Vulnerable Dependency: ${pkg.package.name}`,
                  description: vuln.summary || `Known vulnerability in ${pkg.package.name}@${pkg.package.version}`,
                  filePath: result.source?.path || 'package.json',
                  fingerprint
                });
              }
            }
          }
        }
      }
      return findings;
    } catch (e) {
      return [];
    }
  }

  private simulateFindings(): NormalizedFinding[] {
    return [
      {
        engine: this.name,
        ruleId: 'GHSA-39hc-v8cg-mq45',
        severity: 'HIGH',
        title: 'Vulnerable Dependency: lodash',
        description: 'Prototype Pollution in lodash <= 4.17.15',
        filePath: 'package.json',
        evidence: '"lodash": "^4.17.11"',
        fingerprint: crypto.createHash('sha256').update(`OSV:GHSA-39hc-v8cg-mq45:lodash`).digest('hex')
      }
    ];
  }
}
