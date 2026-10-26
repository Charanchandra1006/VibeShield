"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, GitBranch, Trash2, Loader2, Sparkles, AlertTriangle, ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from "@/lib/api";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ProjectsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [sampleLoading, setSampleLoading] = useState(false);

  const { data: projects, isLoading, refetch } = useQuery({
    queryKey: ['projects'],
    queryFn: () => apiFetch('/projects').then(res => res.data),
    refetchInterval: 5000,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/projects/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setDeleteId(null);
    },
  });

  const handleRunSampleScan = async () => {
    try {
      setSampleLoading(true);
      const res = await apiFetch('/projects/sample', { method: 'POST' });
      const projectId = res.data.project.id;

      await apiFetch(`/projects/${projectId}/scans`, {
        method: 'POST',
        body: JSON.stringify({ profile: 'Comprehensive' }),
      });

      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      router.push(`/projects/${projectId}/findings`);
    } catch (err: any) {
      console.error('Failed to create sample project', err);
    } finally {
      setSampleLoading(false);
    }
  };

  const filtered = (projects || []).filter((p: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return p.name?.toLowerCase().includes(q) || p.framework?.toLowerCase().includes(q) || p.sourceType?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-hairline pb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Projects</h1>
          <p className="text-sm text-ink-muted mt-0.5">Tracked repositories and active codebases.</p>
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
              <Plus className="w-3.5 h-3.5" /> Add Project
            </Button>
          </Link>
        </div>
      </div>

      {/* Delete Confirmation Banner */}
      {deleteId && (
        <div className="bg-destructive/10 border border-destructive text-ink rounded-md p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
            <div className="text-xs font-mono">
              <span className="font-semibold text-destructive">rm -rf:</span> Confirm deletion of project and its scan tree?
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteId(null)}
              className="h-7 text-xs font-mono"
            >
              cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate(deleteId)}
              className="h-7 text-xs font-mono"
            >
              {deleteMutation.isPending ? 'removing...' : 'rm --force'}
            </Button>
          </div>
        </div>
      )}

      {/* Search and Filter Row */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-ink-muted" />
          <Input
            placeholder="filter repositories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>
        <span className="text-xs font-mono text-ink-muted hidden sm:inline-block">
          {filtered.length} {filtered.length === 1 ? 'repo' : 'repos'}
        </span>
      </div>

      {/* Projects List along Git Rail */}
      <div className="border border-hairline rounded-lg bg-surface">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-xs font-mono text-ink-muted">
            <Loader2 className="w-4 h-4 animate-spin mr-2" /> reading repository refs...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center space-y-3 font-mono">
            <div className="text-xs text-ink-muted">
              {search ? `fatal: no matches found for '${search}'` : 'fatal: no repositories initialized'}
            </div>
            <p className="text-xs text-ink-muted max-w-md mx-auto font-sans">
              Add your application source code as a ZIP archive or run a sample scan.
            </p>
            <div className="pt-2 flex justify-center gap-2">
              <Button size="sm" onClick={handleRunSampleScan} disabled={sampleLoading} className="font-mono text-xs">
                run sample-repo
              </Button>
              <Link href="/projects/new">
                <Button variant="outline" size="sm" className="font-mono text-xs">
                  git init / new
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-hairline">
            {filtered.map((project: any) => {
              const nodeLane = project.issues > 0 ? (project.criticalIssues > 0 ? "bg-destructive" : "bg-lane-0") : "bg-lane-1";
              return (
                <div
                  key={project.id}
                  className="p-4 sm:p-5 hover:bg-wash transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    {/* Ringed node indicator */}
                    <div className="pt-1">
                      <span className={`block w-3 h-3 rounded-full border-2 border-surface ${nodeLane} ring-2 ring-shell`} />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={`/projects/${project.id}/findings`}
                          className="font-medium text-sm text-ink hover:text-primary transition-colors"
                        >
                          {project.name}
                        </Link>
                        <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-shell border border-hairline text-ink-muted">
                          {project.framework}
                        </span>
                        <span className="font-mono text-[11px] text-ink-muted">
                          src:{project.sourceType.toLowerCase()}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs font-mono text-ink-muted">
                        <span>
                          {project.lastScan ? `last scan: ${new Date(project.lastScan.createdAt).toLocaleDateString()}` : 'no scans yet'}
                        </span>
                        <span>•</span>
                        <span>created {new Date(project.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <div className="font-mono text-xs">
                      {project.issues === 0 ? (
                        <span className="text-lane-1 font-medium inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> 0 issues
                        </span>
                      ) : (
                        <span className={project.criticalIssues > 0 ? "text-destructive font-medium" : "text-lane-0 font-medium"}>
                          {project.issues} {project.issues === 1 ? 'vulnerability' : 'vulnerabilities'}
                        </span>
                      )}
                    </div>

                    <Link href={`/projects/${project.id}/findings`}>
                      <Button variant="outline" size="sm" className="h-7 text-xs font-mono">
                        inspect
                      </Button>
                    </Link>

                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-ink-muted hover:text-destructive hover:bg-wash"
                      onClick={() => setDeleteId(project.id)}
                      title="Delete project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
