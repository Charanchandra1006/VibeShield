import { NormalizedFinding, ScannerAdapter } from './adapter.interface.js';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export class ConfigAdapter implements ScannerAdapter {
  readonly name = 'VIBESHIELD-CONFIG';

  async execute(scanContext: any): Promise<NormalizedFinding[]> {
    const findings: NormalizedFinding[] = [];
    const sourceDir = scanContext.sourcePath;

    if (!fs.existsSync(sourceDir)) {
      return findings;
    }

    const checkFile = (filePath: string) => {
      const relPath = path.relative(sourceDir, filePath);
      const content = fs.readFileSync(filePath, 'utf8');

      // 1. Next.js dangerouslyAllowSVG
      if (relPath.includes('next.config') && content.includes('dangerouslyAllowSVG: true')) {
        findings.push({
          engine: this.name,
          ruleId: 'VIBE-CONFIG-001',
          severity: 'MEDIUM',
          title: 'Unsafe Next.js SVG Image Configuration',
          description: 'dangerouslyAllowSVG is enabled, which can permit Cross-Site Scripting (XSS) if SVG images from untrusted users are displayed.',
          filePath: relPath,
          startLine: this.getLineNumber(content, 'dangerouslyAllowSVG: true'),
          evidence: 'dangerouslyAllowSVG: true',
          fingerprint: crypto.createHash('sha256').update(`CONFIG:VIBE-CONFIG-001:${relPath}`).digest('hex'),
        });
      }

      // 2. Wildcard CORS
      if (
        (content.includes("origin: '*'") ||
          content.includes('origin: "*"') ||
          content.includes("origin: true") ||
          content.includes("'Access-Control-Allow-Origin', '*'") ||
          content.includes('"Access-Control-Allow-Origin", "*"')) &&
        (relPath.endsWith('.js') || relPath.endsWith('.ts') || relPath.endsWith('.mjs'))
      ) {
        findings.push({
          engine: this.name,
          ruleId: 'VIBE-CONFIG-002',
          severity: 'LOW',
          title: 'Permissive Wildcard CORS Configuration',
          description: 'Wildcard CORS (*) allows any domain to query this service, risking cross-origin data exposure if authenticated cookies or headers are sent.',
          filePath: relPath,
          startLine: this.getLineNumber(content, 'origin:'),
          evidence: "origin: '*'",
          fingerprint: crypto.createHash('sha256').update(`CONFIG:VIBE-CONFIG-002:${relPath}`).digest('hex'),
        });
      }

      // 3. Checked-in production environment file
      if (relPath === '.env' || relPath === '.env.production' || relPath === '.env.local') {
        findings.push({
          engine: this.name,
          ruleId: 'VIBE-CONFIG-003',
          severity: 'HIGH',
          title: 'Environment File Committed to Repository',
          description: 'Environment (.env) files often contain confidential credentials, tokens, and database connection strings. They should be added to .gitignore.',
          filePath: relPath,
          startLine: 1,
          evidence: 'Checked-in environment configuration file: ' + relPath,
          fingerprint: crypto.createHash('sha256').update(`CONFIG:VIBE-CONFIG-003:${relPath}`).digest('hex'),
        });
      }
    };

    const walk = (dir: string) => {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        if (file === 'node_modules' || file === '.git' || file === '.next' || file === 'dist') continue;
        const fullPath = path.join(dir, file);
        try {
          const stat = fs.statSync(fullPath);
          if (stat.isDirectory()) {
            walk(fullPath);
          } else if (stat.isFile()) {
            checkFile(fullPath);
          }
        } catch {
          // ignore inaccessible files
        }
      }
    };

    try {
      walk(sourceDir);
    } catch (e) {
      console.warn('[ConfigAdapter] Error walking directory:', e);
    }

    return findings;
  }

  private getLineNumber(content: string, substring: string): number {
    const idx = content.indexOf(substring);
    if (idx === -1) return 1;
    return content.substring(0, idx).split('\n').length;
  }
}
