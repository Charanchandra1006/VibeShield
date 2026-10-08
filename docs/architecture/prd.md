# VibeShield Product Requirements Document (PRD)

## Project Overview
VibeShield is a full-stack SaaS application security platform targeting developers to identify and remediate security weaknesses.

## Supported Project Types
- **Frameworks**: React, Next.js, Express, NestJS
- **Languages**: JavaScript, TypeScript
- **Dependency Managers**: npm, pnpm, Yarn (via lockfiles)
- **Inputs**: ZIP uploads

## Scan Types
1. **Quick Scan**: Gitleaks (Secrets) + Configuration checks. Use case: Fast first assessment.
2. **Standard Scan**: Quick + Semgrep (SAST) + OSV (SCA). Use case: Complete MVP scan.
3. **Recheck Scan**: Standard, compared against an earlier scan. Use case: Fix verification.

## Finding Model
- **Categories**: CODE, SECRET, DEPENDENCY, CONFIGURATION, RUNTIME
- **Severity**: CRITICAL, HIGH, MEDIUM, LOW, INFO
- **Actions**: View, Review (Confirm, False Positive, Accept Risk), Request AI Remediation

## Unsupported Cases
- Binary-only applications
- Compiled languages not listed above (e.g., C++, Java, Go, Rust)
- Non-web architectures in MVP

## Operational Limits (MVP)
- ZIP upload size: 25 MB
- Extracted source size: 150 MB
- Maximum extracted files: 20,000
- Individual source file: 2 MB for text analysis
- Scanner execution timeout: 180 seconds per engine
- Maximum concurrent scans: 2
- Queued scans per workspace: 3
- Original upload retention: 24 hours after analysis
- Report retention: 30 days
