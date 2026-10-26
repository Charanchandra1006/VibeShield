"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GitBranch, Plus, Loader2, Sparkles, AlertTriangle, ArrowRight, GitCommit, CheckCircle2, ShieldAlert, Activity, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [sampleLoading, setSampleLoading] = useState(false);
  const [sampleError, setSampleError] = useState<string | null>(null);

  const { data: overview, isLoading, refetch } = useQuery({
    queryKey: ['dashboard', 'overview'],
    queryFn: () => apiFetch('/dashboard/overview').then((res) => res.data),
    refetchInterval: 5000,
  });

  const handleRunSampleScan = async () => {
    try {
      setSampleLoading(true);
      setSampleError(null);
      const res = await apiFetch('/projects/sample', { method: 'POST' });
      const projectId = res.data.project.id;

      await apiFetch(`/projects/${projectId}/scans`, {
        method: 'POST',
        body: JSON.stringify({ profile: 'Comprehensive' }),
      });

      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      router.push(`/projects/${projectId}/findings`);
    } catch (err: any) {
      setSampleError(err.message || 'Failed to start sample scan');
    } finally {
      setSampleLoading(false);
    }
  };

  const stats = overview?.stats || {
    totalScans: 0,
    totalProjects: 0,
    totalOpenFindings: 0,
    criticalIssues: 0,
    highIssues: 0,
    mediumIssues: 0,
    lowIssues: 0,
  };

  const recentProjects = overview?.recentProjects || [];
  const recentScans = overview?.recentScans || [];
  const totalIssues = stats.criticalIssues + stats.highIssues + stats.mediumIssues + stats.lowIssues;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-hairline pb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Security Log
          </h1>
          <p className="text-sm text-ink-muted mt-0.5">
            Continuous vulnerability orchestration across repository commits.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRunSampleScan}
            disabled={sampleLoading}
            className="gap-2 font-mono text-xs"
          >
            {sampleLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-primary" />}
            sample-repo --scan
          </Button>
          <Link href="/projects/new">
            <Button size="sm" className="gap-1.5 text-xs">
              <Plus className="w-3.5 h-3.5" /> New Scan
            </Button>
          </Link>
        </div>
      </div>

      {sampleError && (
        <div className="bg-destructive/10 border border-destructive text-destructive rounded-md p-3 text-xs font-mono flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>fatal: {sampleError}</span>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <StatsTile
          label="scans.total"
          value={isLoading ? '-' : String(stats.totalScans)}
          detail="Pipelines executed"
          lane="bg-lane-3"
        />
        <StatsTile
          label="vulns.critical"
          value={isLoading ? '-' : String(stats.criticalIssues)}
          detail={stats.criticalIssues > 0 ? "Immediate fix required" : "Zero critical leaks"}
          lane={stats.criticalIssues > 0 ? "bg-destructive" : "bg-lane-1"}
          isCritical={stats.criticalIssues > 0}
        />
        <StatsTile
          label="vulns.high"
          value={isLoading ? '-' : String(stats.highIssues)}
          detail={stats.highIssues > 0 ? "High severity risk" : "Clean dependencies"}
          lane={stats.highIssues > 0 ? "bg-lane-0" : "bg-lane-1"}
        />
        <StatsTile
          label="projects.active"
          value={isLoading ? '-' : String(stats.totalProjects)}
          detail="Connected codebases"
          lane="bg-primary"
        />
      </div>

      {/* Main Grid: Projects Graph Rail + Severity Panel */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Monitored Repositories drawn along Graph Rail (2 cols) */}
        <div className="lg:col-span-2 border border-hairline rounded-lg bg-surface">
          <div className="px-5 py-3.5 border-b border-hairline flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-ink">Monitored Repositories</h2>
              <p className="text-xs text-ink-muted">Codebase posture and latest scan health</p>
            </div>
            <Link href="/projects" className="text-xs text-primary hover:underline font-mono flex items-center gap-1">
              git status --all ({stats.totalProjects}) <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="p-5">
            {isLoading ? (
              <div className="flex items-center justify-center py-12 text-ink-muted text-xs font-mono">
                <Loader2 className="w-4 h-4 animate-spin mr-2" /> reading repository state...
              </div>
            ) : recentProjects.length === 0 ? (
              <div className="py-12 text-center space-y-3 font-mono">
                <div className="text-xs text-ink-muted">
                  fatal: no repositories tracked yet.
                </div>
                <p className="text-xs text-ink-muted max-w-sm mx-auto font-sans">
                  Upload a ZIP archive or run the 1-click sample repository to observe multi-engine security scanning.
                </p>
                <div className="pt-2">
                  <Button size="sm" onClick={handleRunSampleScan} disabled={sampleLoading} className="font-mono text-xs">
                    run sample-repo
                  </Button>
                </div>
              </div>
            ) : (
              /* The Commit Graph Rail */
              <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-rail">
                {recentProjects.map((p: any, idx: number) => {
                  const laneColors = ["bg-lane-0", "bg-lane-1", "bg-lane-2", "bg-lane-3", "bg-lane-4", "bg-lane-5"];
                  const nodeLane = p.issues > 0 ? (p.criticalIssues > 0 ? "bg-destructive" : "bg-lane-0") : "bg-lane-1";
                  return (
                    <div key={p.id} className="relative group">
                      {/* Graph Node */}
                      <span
                        className={`absolute -left-6 top-3 w-3 h-3 rounded-full border-2 border-surface ${nodeLane} ring-2 ring-shell`}
                        title={p.issues > 0 ? `${p.issues} vulnerabilities` : 'Clean'}
                      />

                      <div className="p-3.5 rounded-md border border-hairline bg-shell/50 hover:bg-wash transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/projects/${p.id}/findings`}
                              className="font-medium text-sm text-ink hover:text-primary transition-colors flex items-center gap-1.5"
                            >
                              <span>{p.name}</span>
                            </Link>
                            <span className="font-mono text-[11px] text-ink-muted px-1.5 py-0.5 rounded bg-surface border border-hairline">
                              {p.framework}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs font-mono text-ink-muted">
                            <span>src:{p.sourceType.toLowerCase()}</span>
                            <span>•</span>
                            <span>
                              {p.lastScan ? `scanned ${new Date(p.lastScan.createdAt).toLocaleDateString()}` : 'never scanned'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="font-mono text-xs">
                            {p.issues === 0 ? (
                              <span className="text-lane-1 font-medium inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> 0 issues
                              </span>
                            ) : (
                              <span className={p.criticalIssues > 0 ? "text-destructive font-medium" : "text-lane-0 font-medium"}>
                                {p.issues} {p.issues === 1 ? 'finding' : 'findings'}
                              </span>
                            )}
                          </div>
                          <Link href={`/projects/${p.id}/findings`}>
                            <Button variant="outline" size="sm" className="h-7 text-xs font-mono">
                              inspect
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Severity Matrix & Engine Status */}
        <div className="space-y-6">
          <div className="border border-hairline rounded-lg bg-surface">
            <div className="px-5 py-3.5 border-b border-hairline">
              <h2 className="text-sm font-semibold text-ink">Severity Classification</h2>
              <p className="text-xs text-ink-muted">Open CVEs & findings by CVSS tier</p>
            </div>
            <div className="p-5 space-y-4">
              {/* Stacked Rail Visual */}
              {totalIssues > 0 ? (
                <div className="h-2 w-full bg-wash rounded-full overflow-hidden flex border border-hairline">
                  {stats.criticalIssues > 0 && (
                    <div
                      style={{ width: `${(stats.criticalIssues / totalIssues) * 100}%` }}
                      className="bg-destructive"
                      title={`Critical: ${stats.criticalIssues}`}
                    />
                  )}
                  {stats.highIssues > 0 && (
                    <div
                      style={{ width: `${(stats.highIssues / totalIssues) * 100}%` }}
                      className="bg-lane-0"
                      title={`High: ${stats.highIssues}`}
                    />
                  )}
                  {stats.mediumIssues > 0 && (
                    <div
                      style={{ width: `${(stats.mediumIssues / totalIssues) * 100}%` }}
                      className="bg-lane-5"
                      title={`Medium: ${stats.mediumIssues}`}
                    />
                  )}
                  {stats.lowIssues > 0 && (
                    <div
                      style={{ width: `${(stats.lowIssues / totalIssues) * 100}%` }}
                      className="bg-lane-3"
                      title={`Low: ${stats.lowIssues}`}
                    />
                  )}
                </div>
              ) : (
                <div className="text-xs font-mono text-ink-muted py-1">
                  0 active issues in working tree.
                </div>
              )}

              <div className="space-y-2 pt-1 font-mono text-xs">
                <SeverityItem label="CRITICAL" count={stats.criticalIssues} node="bg-destructive" />
                <SeverityItem label="HIGH" count={stats.highIssues} node="bg-lane-0" />
                <SeverityItem label="MEDIUM" count={stats.mediumIssues} node="bg-lane-5" />
                <SeverityItem label="LOW" count={stats.lowIssues} node="bg-lane-3" />
              </div>
            </div>
          </div>

          {/* Engine Status Panel */}
          <div className="border border-hairline rounded-lg bg-surface p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-ink uppercase tracking-wider">Engines Running</span>
              <span className="text-[11px] font-mono text-ink-muted">4/4 active</span>
            </div>
            <div className="space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between p-2 rounded bg-shell border border-hairline">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-lane-1" />
                  <span>Semgrep OSS (SAST)</span>
                </div>
                <span className="text-[11px] text-ink-muted">v1.182</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-shell border border-hairline">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-lane-1" />
                  <span>Gitleaks (Secrets)</span>
                </div>
                <span className="text-[11px] text-ink-muted">v8.30</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-shell border border-hairline">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-lane-1" />
                  <span>OSV-Scanner (SCA)</span>
                </div>
                <span className="text-[11px] text-ink-muted">v2.7</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-shell border border-hairline">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-lane-1" />
                  <span>Config Engine (IaC)</span>
                </div>
                <span className="text-[11px] text-ink-muted">v1.0</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Scans Execution Log */}
      {recentScans.length > 0 && (
        <div className="border border-hairline rounded-lg bg-surface">
          <div className="px-5 py-3.5 border-b border-hairline flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-ink">Recent Scan Pipelines</h2>
              <p className="text-xs text-ink-muted">Execution log and BullMQ worker events</p>
            </div>
            <span className="text-xs font-mono text-ink-muted">tail -n {recentScans.length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono text-left">
              <thead className="text-ink-muted bg-wash/50 border-b border-hairline uppercase text-[11px]">
                <tr>
                  <th className="px-5 py-2.5 font-medium">Repository</th>
                  <th className="px-5 py-2.5 font-medium">Status</th>
                  <th className="px-5 py-2.5 font-medium">Engines Executed</th>
                  <th className="px-5 py-2.5 font-medium">Timestamp</th>
                  <th className="px-5 py-2.5 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {recentScans.map((scan: any) => (
                  <tr key={scan.id} className="hover:bg-wash/60 transition-colors">
                    <td className="px-5 py-3 font-sans font-medium text-ink">
                      {scan.project?.name || 'unknown'}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono ${
                          scan.status === 'COMPLETED'
                            ? 'text-lane-1 bg-lane-1/10 border border-lane-1/20'
                            : scan.status === 'FAILED'
                            ? 'text-destructive bg-destructive/10 border border-destructive/20'
                            : 'text-primary bg-primary-soft border border-primary/30'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          scan.status === 'COMPLETED' ? 'bg-lane-1' : scan.status === 'FAILED' ? 'bg-destructive' : 'bg-primary animate-pulse'
                        }`} />
                        {scan.status}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {scan.executions && scan.executions.length > 0 ? (
                          scan.executions.map((e: any) => (
                            <span
                              key={e.engine}
                              className="text-[11px] px-1.5 py-0.5 rounded bg-shell border border-hairline text-ink-muted"
                            >
                              {e.engine}:{e.findingsCount}
                            </span>
                          ))
                        ) : (
                          <span className="text-ink-muted">queued</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-ink-muted">
                      {new Date(scan.createdAt).toISOString().replace('T', ' ').substring(0, 19)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link href={`/projects/${scan.projectId}/findings`}>
                        <Button variant="ghost" size="sm" className="h-6 text-xs font-mono text-primary hover:text-primary-hover">
                          inspect &gt;
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function StatsTile({
  label,
  value,
  detail,
  lane,
  isCritical,
}: {
  label: string;
  value: string;
  detail: string;
  lane: string;
  isCritical?: boolean;
}) {
  return (
    <div className="p-4 rounded-lg border border-hairline bg-surface flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs text-ink-muted">{label}</span>
        <span className={`w-2 h-2 rounded-full ${lane}`} />
      </div>
      <div className="mt-2">
        <div className={`text-2xl font-semibold tracking-tight font-mono ${isCritical ? 'text-destructive' : 'text-ink'}`}>
          {value}
        </div>
        <p className="text-xs text-ink-muted mt-1 truncate">{detail}</p>
      </div>
    </div>
  );
}

function SeverityItem({ label, count, node }: { label: string; count: number; node: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${node}`} />
        <span className="text-ink">{label}</span>
      </div>
      <span className={count > 0 ? "font-bold text-ink" : "text-ink-muted"}>
        {count}
      </span>
    </div>
  );
}
