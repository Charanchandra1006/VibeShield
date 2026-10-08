import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

export interface AIRequest {
  findingId: string;
}

export interface AIExplanationResponse {
  summary: string;
  explanation: string;
  fixSteps: string[];
  safeCodeExample?: string;
}

@Injectable()
export class AIService {
  constructor(private prisma: PrismaService) {}

  async explainFinding(request: AIRequest): Promise<AIExplanationResponse> {
    const finding = await this.prisma.finding.findUnique({
      where: { id: request.findingId },
      include: {
        occurrences: true
      }
    });

    if (!finding) {
      throw new InternalServerErrorException('Finding not found for AI analysis');
    }

    // In a production environment, this would call Google Gemini API with the finding's evidence
    // For MVP, we provide a sophisticated contextual response based on the ruleId
    const rule = finding.occurrences[0]?.ruleId || 'unknown';

    if (rule.includes('aws-access-token')) {
      return {
        summary: 'A hardcoded AWS Access Token was found in your repository.',
        explanation: 'This credential can be used by an attacker to authenticate to AWS APIs, potentially allowing them to access, modify, or delete your cloud infrastructure and data. It was discovered in plaintext in your configuration files.',
        fixSteps: [
          'Revoke the exposed key in AWS IAM immediately.',
          'Replace the hardcoded values with environment variables in your code.',
          'Remove the secret from your git history using tools like BFG Repo-Cleaner if necessary.'
        ],
        safeCodeExample: `// Use environment variables instead\nconst awsConfig = {\n  region: process.env.AWS_REGION,\n  accessKeyId: process.env.AWS_ACCESS_KEY_ID,\n  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY\n};`
      };
    }

    // Default AI Response for others
    return {
      summary: `A potential security vulnerability (${rule}) was detected.`,
      explanation: 'Static analysis flagged this code as potentially unsafe. Depending on context, this could allow an attacker to bypass security controls or access unauthorized data.',
      fixSteps: [
        'Review the code for missing input validation or output encoding.',
        'Ensure you are using safe framework built-in methods.',
        'Add proper unit tests for malicious payloads.'
      ]
    };
  }
}
