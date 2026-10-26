"use client";

import { Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ChevronRight, Loader2, ArrowLeft, RefreshCw, CheckCircle2, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from "@/lib/api";

export default function FindingsListPage() {
  return (
    <Suspense fallback={<FindingsLoading />}>
      <FindingsListInner />
    </Suspense>
  );
}

function FindingsLoading() {
  return (
    <div className="flex items-center justify-center py-24 text-ink-muted text-xs font-mono">
      <Loader2 className="w-5 h-5 animate-spin mr-2 text-primary" /> reading repository findings...
    </div>
  );
}

function FindingsListInner() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const projectId = params?.projectId as string | undefined;

  const [search, setSearch] = useState("");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [rescanLoading, setRescanLoading] = useState(false);

  // Fetch project details
  const { data: project } = useQuery({
    queryKey: ['projects', projectId],
    queryFn: () => apiFetch(`/projects/${projectId}`).then((res) => res.data),
    enabled: !!projectId,
  });

  // Fetch project findings
  const { data: findings, isLoading, isError, refetch } = useQuery({
    queryKey: ['projects', projectId, 'findings'],
    queryFn: () => apiFetch(`/projects/${projectId}/findings`).then((res) => res.data),
    enabled: !!projectId,
    refetchInterval: 5000,
  });

  // Fetch recent scans
  const { data: scans } = useQuery({
    queryKey: ['projects', projectId, 'scans'],
    queryFn: () => apiFetch(`/projects/${projectId}/scans`).then((res) => res.data),
    enabled: !!projectId,
    refetchInterval: 4000,
  });

  const latestScan = scans?.[0];
  const isScanActive = latestScan && ['CREATED', 'QUEUED', 'PREPARING', 'SCANNING', 'NORMALIZING'].includes(latestScan.status);

  const handleRescan = async () => {
    if (!projectId) return;
    try {
      setRescanLoading(true);
      await apiFetch(`/projects/${projectId}/scans`, {
        method: 'POST',
        body: JSON.stringify({ profile: 'Comprehensive' }),
      });
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
    } catch (err: any) {
      console.error('Failed to trigger scan:', err.message);
    } finally {
      setRescanLoading(false);
    }
  };

  const getSeverityCounts = () => {
    if (!findings) return { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
    return findings.reduce(
      (acc: Record<string, number>, curr: any) => {
        const sev = curr.occurrences?.[0]?.severity || 'LOW';
        acc[sev] = (acc[sev] || 0) + 1;
        return acc;
      },
      { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 }
    );
  };

  const counts = getSeverityCounts();

  const filtered = (findings ?? []).filter((f: any) => {
    const occ = f.occurrences?.[0] || {};
    const sev = occ.severity || 'LOW';

    if (selectedSeverity !== 'ALL' && sev !== selectedSeverity) return false;
    if (selectedStatus !== 'ALL' && f.status !== selectedStatus) return false;

    if (!search) return true;
    const q = search.toLowerCase();
    return (
      f.fingerprint?.toLowerCase().includes(q) ||
      occ.ruleId?.toLowerCase().includes(q) ||
      occ.filePath?.toLowerCase().includes(q) ||
      occ.evidence?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs font-mono text-ink-muted">
        <Link href="/projects" className="hover:text-ink transition-colors flex items-center gap-1">
          <ArrowLeft className="w-3 h-3" /> projects
        </Link>
        <span>/</span>
        <span className="text-ink font-semibold">{project?.name || projectId}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-hairline pb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            {project?.name || "Security Findings"}
          </h1>
          <p className="text-xs font-mono text-ink-muted mt-1">
            {findings?.length ?? 0} vulnerabilities detected across {findings ? new Set(findings.map((f: any) => f.occurrences?.[0]?.filePath)).size : 0} files.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRescan}
            disabled={rescanLoading || isScanActive}
            className="gap-2 font-mono text-xs"
          >
            {rescanLoading || isScanActive ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            {isScanActive ? `scanning (${latestScan?.progress ?? 0}%)` : "rescan --all"}
          </Button>
        </div>
      </div>

      {/* Active Scan Progress Notification */}
      {isScanActive && (
        <div className="p-3.5 rounded-lg bg-primary-soft border border-primary text-primary flex items-center justify-between gap-4 font-mono text-xs">
          <div className="flex items-center gap-2.5">
            <Loader2 className="w-4 h-4 text-primary animate-spin" />
            <div>
              <span className="font-semibold">scan:{latestScan.status.toLowerCase()}</span>
              <span className="text-ink-muted ml-2">running semgrep, gitleaks, osv-scanner...</span>
            </div>
          </div>
          <span className="font-bold">{latestScan.progress}%</span>
        </div>
      )}

      {/* Severity Filter Tiles (Git Graph styling) */}
      <div className="grid gap-2.5 grid-cols-2 sm:grid-cols-4 font-mono">
        {[
          { label: 'CRITICAL', key: 'CRITICAL', val: counts.CRITICAL, node: 'bg-destructive' },
          { label: 'HIGH', key: 'HIGH', val: counts.HIGH, node: 'bg-lane-0' },
          { label: 'MEDIUM', key: 'MEDIUM', val: counts.MEDIUM, node: 'bg-lane-5' },
          { label: 'LOW', key: 'LOW', val: counts.LOW, node: 'bg-lane-3' }
        ].map((sev) => {
          const isSelected = selectedSeverity === sev.key;
          return (
            <button
              key={sev.key}
              type="button"
              onClick={() => setSelectedSeverity(isSelected ? 'ALL' : sev.key)}
              className={`p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-primary-soft border-primary'
                  : 'bg-surface border-hairline hover:bg-wash'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-ink-muted text-[11px]">{sev.label}</span>
                <span className={`w-2 h-2 rounded-full ${sev.node}`} />
              </div>
              <div className="text-xl font-bold text-ink">{sev.val}</div>
            </button>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-ink-muted" />
          <Input
            type="search"
            placeholder="filter by rule, file path, or evidence..."
            className="pl-9 h-9 text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-[36px] rounded-md border border-rail bg-surface px-2.5 text-xs font-mono text-ink focus:outline-none focus:border-primary"
          >
            <option value="ALL">status: all</option>
            <option value="OPEN">status: open</option>
            <option value="RESOLVED">status: resolved</option>
            <option value="FALSE_POSITIVE">status: false_positive</option>
          </select>

          {(selectedSeverity !== 'ALL' || selectedStatus !== 'ALL' || search) && (
            <Button
              variant="outline"
              size="sm"
              className="text-xs font-mono"
              onClick={() => {
                setSelectedSeverity('ALL');
                setSelectedStatus('ALL');
                setSearch('');
              }}
            >
              reset
            </Button>
          )}
        </div>
      </div>

      {/* Findings Table on Surface */}
      <div className="border border-hairline rounded-lg bg-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-[11px] font-mono text-ink-muted bg-wash/50 uppercase border-b border-hairline">
              <tr>
                <th className="px-5 py-3 font-medium">Severity</th>
                <th className="px-5 py-3 font-medium">Vulnerability / Rule</th>
                <th className="px-5 py-3 font-medium">Location</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-ink-muted font-mono">
                    <Loader2 className="w-4 h-4 animate-spin mx-auto mb-2 text-primary" />
                    reading security findings...
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-destructive font-mono">
                    fatal: failed to fetch findings from api
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center space-y-2 font-mono">
                    <div className="text-xs text-ink-muted">
                      {search || selectedSeverity !== 'ALL'
                        ? `null: no findings match current filter criteria`
                        : "clean: zero vulnerabilities detected in working tree"}
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((finding: any) => {
                  const occurrence = finding.occurrences?.[0] || {};
                  const sev = occurrence.severity || 'LOW';

                  const nodeColor =
                    sev === 'CRITICAL'
                      ? 'bg-destructive'
                      : sev === 'HIGH'
                      ? 'bg-lane-0'
                      : sev === 'MEDIUM'
                      ? 'bg-lane-5'
                      : 'bg-lane-3';

                  return (
                    <tr
                      key={finding.id}
                      className="hover:bg-wash transition-colors group cursor-pointer"
                      onClick={() => router.push(`/findings/${finding.id}`)}
                    >
                      {/* Severity with ringed node */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-2 font-mono text-[11px] font-semibold text-ink">
                          <span className={`w-2.5 h-2.5 rounded-full border-2 border-surface ${nodeColor} ring-1 ring-shell`} />
                          {sev}
                        </span>
                      </td>

                      {/* Rule & Evidence */}
                      <td className="px-5 py-3.5 max-w-md">
                        <div className="font-mono text-xs font-semibold text-ink group-hover:text-primary transition-colors">
                          {occurrence.ruleId || 'Security Finding'}
                        </div>
                        {occurrence.evidence && (
                          <div className="text-[11px] text-ink-muted font-mono mt-0.5 truncate">
                            {occurrence.evidence}
                          </div>
                        )}
                      </td>

                      {/* File Path & Line */}
                      <td className="px-5 py-3.5 font-mono whitespace-nowrap">
                        <div className="text-ink text-xs">
                          {occurrence.filePath || 'unknown'}
                        </div>
                        <div className="text-[11px] text-ink-muted">
                          L{occurrence.startLine || 1}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5 whitespace-nowrap font-mono text-[11px]">
                        <span
                          className={`px-1.5 py-0.5 rounded border ${
                            finding.status === 'OPEN'
                              ? 'text-primary bg-primary-soft border-primary/40'
                              : finding.status === 'RESOLVED'
                              ? 'text-lane-1 bg-lane-1/10 border-lane-1/30'
                              : 'text-ink-muted bg-wash border-hairline'
                          }`}
                        >
                          {finding.status.toLowerCase()}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <Link href={`/findings/${finding.id}`} onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm" className="h-7 text-xs font-mono text-primary hover:text-primary-hover">
                            inspect &gt;
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
