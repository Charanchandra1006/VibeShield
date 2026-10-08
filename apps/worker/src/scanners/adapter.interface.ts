export interface NormalizedFinding {
  engine: string;
  ruleId: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFORMATIONAL';
  title: string;
  description: string;
  filePath?: string;
  startLine?: number;
  evidence?: string;
  fingerprint: string;
}

export interface ScannerAdapter {
  readonly name: string;
  execute(scanContext: any): Promise<NormalizedFinding[]>;
}
