import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export async function generateSampleZipBuffer(): Promise<Buffer> {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vibeshield-sample-'));
  const zipPath = path.join(os.tmpdir(), `sample-app-${Date.now()}.zip`);

  try {
    // 1. Write package.json and package-lock.json with vulnerable dependencies for OSV-Scanner
    const packageJson = {
      name: 'sample-vulnerable-app',
      version: '1.0.0',
      description: 'Sample application containing intentional vulnerabilities for testing VibeShield security orchestration',
      main: 'server.js',
      dependencies: {
        express: '^4.18.2',
        cors: '^2.8.5',
        lodash: '4.17.15',
      },
    };
    fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify(packageJson, null, 2));

    const packageLockJson = {
      name: 'sample-vulnerable-app',
      version: '1.0.0',
      lockfileVersion: 3,
      packages: {
        '': {
          name: 'sample-vulnerable-app',
          version: '1.0.0',
          dependencies: {
            lodash: '4.17.15',
          },
        },
        'node_modules/lodash': {
          version: '4.17.15',
          resolved: 'https://registry.npmjs.org/lodash/-/lodash-4.17.15.tgz',
        },
      },
    };
    fs.writeFileSync(path.join(tempDir, 'package-lock.json'), JSON.stringify(packageLockJson, null, 2));

    // 2. Write server.js with leaked credentials, insecure CORS, and SQL injection
    const serverJs = `const express = require('express');
const cors = require('cors');
const app = express();

// Insecure wildcard CORS configuration
app.use(cors({ origin: '*' }));

// Hardcoded cloud & payment API credentials (Gitleaks target)
const AWS_ACCESS_KEY_ID = "AKIAIOSFODNN7EXAMPLE";
const AWS_SECRET_ACCESS_KEY = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY";
const STRIPE_SECRET_KEY = "sk_test_51M0000000000000000000000000000000000000000";

app.get('/api/users', (req, res) => {
  const userId = req.query.id;
  // Raw string concatenation leading to SQL injection (Semgrep target)
  const sqlQuery = "SELECT * FROM users WHERE id = '" + userId + "' AND active = 1";
  res.json({ message: "Executing query", query: sqlQuery });
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
`;
    fs.writeFileSync(path.join(tempDir, 'server.js'), serverJs);

    // 3. Write React component with XSS (dangerouslySetInnerHTML)
    const compDir = path.join(tempDir, 'components');
    fs.mkdirSync(compDir, { recursive: true });
    const reactComponent = `import React from 'react';

export function UserBio({ bioHtml }) {
  // Direct innerHTML assignment without sanitization (Semgrep XSS target)
  return (
    <div className="user-bio-container">
      <h3>User Bio</h3>
      <div dangerouslySetInnerHTML={{ __html: bioHtml }} />
    </div>
  );
}
`;
    fs.writeFileSync(path.join(compDir, 'UserBio.jsx'), reactComponent);

    // 4. Create ZIP archive
    await execFileAsync('zip', ['-r', zipPath, '.'], { cwd: tempDir });
    const buffer = fs.readFileSync(zipPath);
    return buffer;
  } finally {
    // Clean up temporary directory & zip file
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
      if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
    } catch {
      // ignore cleanup errors
    }
  }
}
