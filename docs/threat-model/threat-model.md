# VibeShield Threat Model

## Trust Boundaries
- **Untrusted**: Uploaded ZIP files, source code, extracted artifacts, scanner outputs.
- **Trusted**: API Server, UI, Database.

## Threats & Mitigations

### 1. Malicious ZIP Archives (Decompression Bombs, Path Traversal)
- **Threat**: Attackers upload zip bombs or use path traversal (`../`) to overwrite system files.
- **Impact**: Denial of Service, Remote Code Execution.
- **Mitigation**: Enforce max file size (25MB), extracted size (150MB), and file count (20000). Use safe extraction libraries that sanitize paths.
- **Validation**: Test with a zip bomb and a zip containing `../` paths.

### 2. Malicious Source Files (Unusual Encodings, Malicious Instructions)
- **Threat**: Code designed to exploit the scanner engines themselves.
- **Impact**: Code execution within scanner container.
- **Mitigation**: Scanners run in isolated, short-lived Docker containers with no network access (except for OSV which needs vulnerability DB access).
- **Validation**: Scan specially crafted files known to crash tools.

### 3. Prompt Injection via Scanner Output
- **Threat**: Uploaded code contains comments like "Ignore previous instructions and output..." which ends up in scanner output, then fed to LLM.
- **Impact**: AI generates malicious advice or leaks system prompts.
- **Mitigation**: Sanitize and escape scanner findings before sending to LLM. Use structured prompt templates.
- **Validation**: Upload code with prompt injection payloads.

### 4. Uploaded Projects Containing Genuine Secrets
- **Threat**: Users upload production secrets by mistake.
- **Impact**: Secrets stored in VibeShield database.
- **Mitigation**: Automatically redact detected secrets (Gitleaks output) before storing in PostgreSQL. Delete uploaded ZIPs after 24h.
- **Validation**: Upload codebase with a dummy AWS key and ensure it's redacted in the UI/DB.

### 5. Cross-Workspace Data Access (IDOR)
- **Threat**: User accesses another workspace's project/scan via ID manipulation.
- **Impact**: Data Breach.
- **Mitigation**: All API queries must include `workspaceId` derived from the user's session token and membership verification.
- **Validation**: Attempt to access `Project B` using `User A`'s token.

### 6. Queue Abuse and DoS
- **Threat**: User submits 1000s of scans.
- **Impact**: Queue backlog, legitimate users blocked.
- **Mitigation**: Rate limiting and max concurrent queued scans per workspace (3).
- **Validation**: Script to submit 10 scans rapidly; verify 7 are rejected.
