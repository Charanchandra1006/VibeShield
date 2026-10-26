"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, GitBranch, GitCommit, Shield, Terminal } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-shell text-ink">
      {/* Header */}
      <header className="px-6 py-3 flex items-center justify-between border-b border-hairline bg-surface sticky top-0 z-50">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full border-2 border-primary bg-primary-soft flex items-center justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-primary" />
          </div>
          <span className="font-semibold text-base tracking-tight text-ink">VibeShield</span>
        </div>
        <nav className="hidden md:flex gap-6 text-xs font-mono text-ink-muted">
          <a href="#engines" className="hover:text-ink transition-colors">engines:4</a>
          <a href="#architecture" className="hover:text-ink transition-colors">pipeline.v2</a>
          <a href="#matrix" className="hover:text-ink transition-colors">matrix</a>
        </nav>
        <div className="flex items-center gap-2 font-mono text-xs">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="text-xs font-mono">
              sign in
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button size="sm" className="text-xs font-mono">
              open console &gt;
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-[1264px] mx-auto w-full px-4 sm:px-6 py-16 sm:py-24 space-y-16">
        <div className="max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-wash border border-hairline text-xs font-mono text-ink-muted">
            <span className="w-2 h-2 rounded-full bg-lane-1" />
            <span>git log --graph --security</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-semibold tracking-[-0.04em] text-ink leading-none">
            Continuous AppSec. <br />
            Drawn as a commit graph.
          </h1>

          <p className="text-base sm:text-lg text-ink-muted font-normal leading-relaxed max-w-2xl">
            Orchestrating Semgrep (SAST), Gitleaks (Secrets), OSV-Scanner (SCA), and Config engines into a unified security timeline. Zero noise. Contextual AI remediation diffs.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2 font-mono text-xs">
            <Link href="/dashboard">
              <Button size="lg" className="gap-2 text-xs font-mono h-10 px-5">
                git init / launch console <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
            <Link href="/projects/new">
              <Button size="lg" variant="outline" className="text-xs font-mono h-10 px-5">
                scan sample-repo
              </Button>
            </Link>
          </div>
        </div>

        {/* Git Graph Visual Block */}
        <div className="border border-hairline rounded-lg bg-surface p-6 font-mono text-xs space-y-4">
          <div className="flex items-center justify-between border-b border-hairline pb-3">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-primary" />
              <span className="text-ink font-semibold">pipeline: scan execution graph</span>
            </div>
            <span className="text-ink-muted">status: ok</span>
          </div>

          <div className="relative pl-6 space-y-3 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-rail">
            <div className="relative">
              <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full border-2 border-surface bg-lane-1 ring-1 ring-shell" />
              <div className="text-ink">
                <span className="text-lane-1 font-semibold">commit 7a3f89e</span> <span className="text-ink-muted">|</span> <span className="text-ink">stage: source unpacked into isolated BullMQ worker</span>
              </div>
            </div>

            <div className="relative">
              <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full border-2 border-surface bg-lane-0 ring-1 ring-shell" />
              <div className="text-ink">
                <span className="text-lane-0 font-semibold">scan:gitleaks</span> <span className="text-ink-muted">|</span> <span>detected API credential in server.js:14 (high)</span>
              </div>
            </div>

            <div className="relative">
              <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full border-2 border-surface bg-destructive ring-1 ring-shell" />
              <div className="text-ink">
                <span className="text-destructive font-semibold">scan:semgrep</span> <span className="text-ink-muted">|</span> <span>detected raw SQL concatenation in query.ts:28 (critical)</span>
              </div>
            </div>

            <div className="relative">
              <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full border-2 border-surface bg-lane-3 ring-1 ring-shell" />
              <div className="text-ink">
                <span className="text-lane-3 font-semibold">scan:osv</span> <span className="text-ink-muted">|</span> <span>identified 6 vulnerable lockfile dependencies</span>
              </div>
            </div>

            <div className="relative">
              <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full border-2 border-surface bg-primary ring-1 ring-shell" />
              <div className="text-ink">
                <span className="text-primary font-semibold">ai:remediate</span> <span className="text-ink-muted">|</span> <span>generated parametrized query drop-in fix</span>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <div id="architecture" className="grid sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-lg border border-hairline bg-surface space-y-2">
            <div className="flex items-center gap-2 font-mono text-xs text-primary font-semibold">
              <span className="w-2 h-2 rounded-full bg-lane-0" />
              <span>Multi-Engine Ingestion</span>
            </div>
            <p className="text-xs text-ink-muted leading-relaxed font-sans">
              Parallel scanning with native SAST rules, secret entropy detection, and CVE vulnerability databases.
            </p>
          </div>

          <div className="p-5 rounded-lg border border-hairline bg-surface space-y-2">
            <div className="flex items-center gap-2 font-mono text-xs text-primary font-semibold">
              <span className="w-2 h-2 rounded-full bg-lane-1" />
              <span>Contextual Explanations</span>
            </div>
            <p className="text-xs text-ink-muted leading-relaxed font-sans">
              Detailed breakdown of attacker exploits, business impact, and copy-paste secure code solutions.
            </p>
          </div>

          <div className="p-5 rounded-lg border border-hairline bg-surface space-y-2">
            <div className="flex items-center gap-2 font-mono text-xs text-primary font-semibold">
              <span className="w-2 h-2 rounded-full bg-lane-3" />
              <span>Triage & Audit Trail</span>
            </div>
            <p className="text-xs text-ink-muted leading-relaxed font-sans">
              Manage false positives, track verified fixes, and execute re-scans with persistent audit history.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-hairline py-4 px-6 text-xs text-ink-muted bg-surface font-mono">
        <div className="max-w-[1264px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>VibeShield Security Platform</span>
          <span className="text-ink-muted">v2.4.0 • git-log-aesthetic</span>
        </div>
      </footer>
    </div>
  );
}
