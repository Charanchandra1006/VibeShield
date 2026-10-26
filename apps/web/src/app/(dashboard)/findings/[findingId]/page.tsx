"use client";

import { Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import { Terminal, Sparkles, Loader2, ArrowLeft, CheckCircle2, Copy, Check, AlertTriangle } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from "@/lib/api";
import Link from "next/link";

export default function FindingDetailPage() {
  return (
    <Suspense fallback={<FindingLoading />}>
      <FindingDetailInner />
    </Suspense>
  );
}

function FindingLoading() {
  return (
    <div className="flex items-center justify-center py-24 text-ink-muted text-xs font-mono">
      <Loader2 className="w-5 h-5 animate-spin mr-2 text-primary" /> reading vulnerability AST...
    </div>
  );
}

function FindingDetailInner() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const findingId = params?.findingId as string | undefined;

  const [activeTab, setActiveTab] = useState<'overview' | 'code' | 'impact' | 'fix' | 'verify'>('overview');
  const [copied, setCopied] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // 1. Fetch Real Finding Data
  const { data: finding, isLoading: isFindingLoading, isError } = useQuery({
    queryKey: ['findings', findingId],
    queryFn: () => apiFetch(`/findings/${findingId}`).then((res) => res.data),
    enabled: !!findingId,
  });

  // 2. Fetch AI Contextual Remediation
  const { data: aiExplanation, isLoading: isAILoading } = useQuery({
    queryKey: ['ai', 'explain', findingId],
    queryFn: () =>
      apiFetch('/ai/explain', {
        method: 'POST',
        body: JSON.stringify({ findingId }),
      }).then((res) => res.data),
    enabled: !!findingId,
  });

  // 3. Status Mutation (Resolve / False Positive / Reopen)
  const statusMutation = useMutation({
    mutationFn: ({ status, reason }: { status: string; reason?: string }) =>
      apiFetch(`/findings/${findingId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, reason }),
      }),
    onSuccess: (res, vars) => {
      queryClient.invalidateQueries({ queryKey: ['findings', findingId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setStatusMsg(`status updated: ${vars.status.toLowerCase()}`);
      setTimeout(() => setStatusMsg(null), 4000);
    },
  });

  const occurrence = finding?.occurrences?.[0] || {};
  const severity = occurrence.severity || 'HIGH';
  const filePath = occurrence.filePath || 'unknown';
  const startLine = occurrence.startLine || 1;
  const ruleId = occurrence.ruleId || 'Security Finding';
  const evidence = occurrence.evidence || '';

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'code', label: 'Affected Code' },
    { id: 'impact', label: 'Impact' },
    { id: 'fix', label: 'Remediation' },
    { id: 'verify', label: 'Verification' },
  ];

  if (isFindingLoading) {
    return <FindingLoading />;
  }

  if (isError || !finding) {
    return (
      <div className="py-16 text-center space-y-3 font-mono">
        <div className="text-xs text-destructive">fatal: finding not found or inaccessible</div>
        <Button variant="outline" size="sm" onClick={() => router.back()} className="text-xs font-mono">
          &lt; return
        </Button>
      </div>
    );
  }

  const nodeColor =
    severity === 'CRITICAL'
      ? 'bg-destructive'
      : severity === 'HIGH'
      ? 'bg-lane-0'
      : severity === 'MEDIUM'
      ? 'bg-lane-5'
      : 'bg-lane-3';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs font-mono text-ink-muted">
        <Link
          href={`/projects/${finding.projectId}/findings`}
          className="hover:text-ink transition-colors flex items-center gap-1"
        >
          <ArrowLeft className="w-3 h-3" /> findings
        </Link>
        <span>/</span>
        <span>{finding.project?.name}</span>
        <span>/</span>
        <span className="text-ink font-semibold">{finding.id.substring(0, 12)}</span>
      </div>

      {/* Notification Banner */}
      {statusMsg && (
        <div className="p-3 rounded-lg bg-lane-1/10 border border-lane-1/30 text-lane-1 text-xs font-mono flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Header Info */}
      <div className="space-y-3 border-b border-hairline pb-5">
        <div className="flex items-center gap-2.5 flex-wrap font-mono text-xs">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-hairline bg-surface text-ink font-semibold">
            <span className={`w-2.5 h-2.5 rounded-full border-2 border-surface ${nodeColor}`} />
            {severity}
          </span>

          <span className="text-ink-muted">rule: <strong className="text-ink font-mono">{ruleId}</strong></span>

          <span className={`px-2 py-0.5 rounded border ${
            finding.status === 'OPEN'
              ? 'text-primary bg-primary-soft border-primary/40'
              : finding.status === 'RESOLVED'
              ? 'text-lane-1 bg-lane-1/10 border-lane-1/30'
              : 'text-ink-muted bg-wash border-hairline'
          }`}>
            {finding.status.toLowerCase()}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-ink">
              {aiExplanation?.summary?.split('.')[0] || ruleId}
            </h1>
            <p className="text-xs font-mono text-ink-muted mt-1">
              {filePath}:{startLine}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {finding.status !== 'FALSE_POSITIVE' && (
              <Button
                variant="outline"
                size="sm"
                disabled={statusMutation.isPending}
                onClick={() => statusMutation.mutate({ status: 'FALSE_POSITIVE', reason: 'Marked false positive' })}
                className="text-xs font-mono"
              >
                false_positive
              </Button>
            )}

            {finding.status !== 'RESOLVED' ? (
              <Button
                size="sm"
                disabled={statusMutation.isPending}
                onClick={() => statusMutation.mutate({ status: 'RESOLVED', reason: 'Remediated by developer' })}
                className="text-xs font-mono"
              >
                resolve
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                disabled={statusMutation.isPending}
                onClick={() => statusMutation.mutate({ status: 'OPEN', reason: 'Reopened by developer' })}
                className="text-xs font-mono"
              >
                reopen
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Row (3px Commit Blue Underline for Active Tab) */}
      <div className="flex overflow-x-auto border-b border-hairline gap-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 text-xs font-medium font-mono whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
                isActive
                  ? 'border-primary text-primary font-semibold'
                  : 'border-transparent text-ink-muted hover:text-ink'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="pt-2">
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              <div className="border border-hairline rounded-lg bg-surface p-5 space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                  <Sparkles className="w-3.5 h-3.5 text-primary" /> Analysis & Context
                </div>
                {isAILoading ? (
                  <div className="flex items-center gap-2 py-4 text-xs font-mono text-ink-muted">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" /> running semantic explanation engine...
                  </div>
                ) : (
                  <div className="space-y-2 text-xs leading-relaxed">
                    <p className="font-semibold text-ink text-sm">{aiExplanation?.summary}</p>
                    <p className="text-ink-muted">{aiExplanation?.explanation}</p>
                  </div>
                )}
              </div>

              {severity === 'CRITICAL' && (
                <div className="border border-destructive/40 bg-destructive/5 rounded-lg p-4 flex gap-3 text-xs font-mono">
                  <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-semibold text-destructive">action_required: critical vulnerability</span>
                    <p className="text-ink-muted font-sans">
                      This finding represents an exploitable attack vector. Revoke exposed credentials or patch code prior to deployment.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar Details */}
            <div className="border border-hairline rounded-lg bg-surface p-4 space-y-3 text-xs font-mono">
              <div>
                <div className="text-ink-muted text-[11px] mb-1">FILE LOCATION</div>
                <div className="p-2 rounded bg-shell border border-hairline text-ink break-all">
                  {filePath}:{startLine}
                </div>
              </div>

              <div>
                <div className="text-ink-muted text-[11px] mb-1">RULE IDENTIFIER</div>
                <div className="text-ink break-all">{ruleId}</div>
              </div>

              <div>
                <div className="text-ink-muted text-[11px] mb-1">DISCOVERED</div>
                <div className="text-ink">{new Date(finding.createdAt || Date.now()).toISOString().substring(0, 10)}</div>
              </div>

              <div>
                <div className="text-ink-muted text-[11px] mb-1">FINGERPRINT</div>
                <div className="text-ink-muted text-[10px] truncate">{finding.fingerprint}</div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: AFFECTED CODE */}
        {activeTab === 'code' && (
          <div className="border border-hairline rounded-lg bg-surface overflow-hidden">
            <div className="px-4 py-2 border-b border-hairline flex items-center justify-between text-xs font-mono bg-wash/40">
              <span className="font-semibold text-ink">{filePath}</span>
              <span className="text-ink-muted">line {startLine}</span>
            </div>
            <div className="p-4 font-mono text-xs overflow-x-auto bg-[#0e0e10] text-[#ececec] space-y-1">
              <div className="text-gray-500 select-none">
                {Math.max(1, startLine - 1)} | // context
              </div>
              <div className="bg-destructive/15 text-destructive px-2 py-1 -mx-2 rounded flex items-center justify-between">
                <div>
                  <span className="text-destructive/80 mr-4 select-none font-bold">{startLine}</span>
                  <span className="font-semibold">{evidence || '// vulnerability location'}</span>
                </div>
                <span className="text-[10px] px-1 rounded bg-destructive text-white font-mono">
                  {ruleId}
                </span>
              </div>
              <div className="text-gray-500 select-none">
                {startLine + 1} | // end
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: IMPACT */}
        {activeTab === 'impact' && (
          <div className="grid md:grid-cols-2 gap-4">
            <div className="border border-hairline rounded-lg bg-surface p-5 space-y-2">
              <h3 className="text-sm font-semibold text-ink">Impact Assessment</h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                {aiExplanation?.businessImpact ||
                  'Exposure of private keys or untrusted user input can lead to remote data compromise and system breach.'}
              </p>
            </div>

            <div className="border border-hairline rounded-lg bg-surface p-5 space-y-2">
              <h3 className="text-sm font-semibold text-ink">Exploitation Scenario</h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                {aiExplanation?.attackScenario ||
                  'An adversary scans public commit logs or probes the endpoint to execute unauthorized requests.'}
              </p>
            </div>
          </div>
        )}

        {/* TAB 4: HOW TO FIX */}
        {activeTab === 'fix' && (
          <div className="space-y-4">
            <div className="border border-hairline rounded-lg bg-surface p-5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                <Sparkles className="w-3.5 h-3.5 text-primary" /> Step-by-Step Remediation Plan
              </div>
              {aiExplanation?.fixSteps && aiExplanation.fixSteps.length > 0 ? (
                <ol className="list-decimal pl-5 space-y-1.5 text-xs text-ink leading-relaxed">
                  {aiExplanation.fixSteps.map((step: string, idx: number) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ol>
              ) : (
                <p className="text-xs text-ink-muted">Follow standard secure coding patterns for this rule.</p>
              )}
            </div>

            {aiExplanation?.safeCodeExample && (
              <div className="border border-hairline rounded-lg bg-surface overflow-hidden">
                <div className="px-4 py-2 border-b border-hairline flex items-center justify-between text-xs font-mono bg-wash/40">
                  <span className="text-ink font-semibold">fix: secure drop-in replacement</span>
                  <button
                    type="button"
                    onClick={() => handleCopyCode(aiExplanation.safeCodeExample)}
                    className="flex items-center gap-1 text-[11px] text-ink-muted hover:text-ink cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-lane-1" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? "copied" : "copy"}
                  </button>
                </div>
                <pre className="p-4 font-mono text-xs overflow-x-auto bg-[#0e0e10] text-[#7ee787]">
                  {aiExplanation.safeCodeExample}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: VERIFICATION */}
        {activeTab === 'verify' && (
          <div className="border border-hairline rounded-lg bg-surface p-5 space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">
              <Terminal className="w-3.5 h-3.5 text-primary" /> Verification Steps
            </div>
            <p className="text-xs text-ink-muted leading-relaxed">
              Verify remediation locally using standard command-line security scanners or re-execute the automated pipeline:
            </p>
            <div className="p-3.5 rounded-lg bg-shell border border-hairline font-mono text-xs space-y-1.5 text-ink">
              <div className="text-ink-muted"># 1. Trigger remote scan via VibeShield UI</div>
              <div className="text-primary font-bold">rescan --project {finding.projectId}</div>
              <div className="text-ink-muted pt-2"># 2. Or verify locally via CLI</div>
              <div className="text-ink">semgrep scan --config auto .</div>
              <div className="text-ink">gitleaks detect --source . --no-git</div>
              <div className="text-ink">osv-scanner scan source -r .</div>
            </div>
            <p className="text-xs text-ink-muted">
              When resolved, click <strong className="text-ink">resolve</strong> above to record the triage state in the audit log.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
