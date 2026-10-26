"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Github, UploadCloud, CheckCircle2, ArrowRight, Sparkles, FileArchive, AlertCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";

export default function NewProjectPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(1);
  const [sourceType, setSourceType] = useState<"ZIP" | "SAMPLE" | "GITHUB">("ZIP");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [projectName, setProjectName] = useState("");
  const [framework, setFramework] = useState("Node.js / Express");
  const [profile, setProfile] = useState("Comprehensive");
  const [githubUrl, setGithubUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.name.endsWith('.zip')) {
        setError('Please select a valid .zip archive file.');
        return;
      }
      setSelectedFile(file);
      setError(null);
      const baseName = file.name.replace(/\.zip$/i, '').toLowerCase().replace(/[^a-z0-9-_]/g, '-');
      if (!projectName) {
        setProjectName(baseName);
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (!file.name.endsWith('.zip')) {
        setError('Please drop a valid .zip archive.');
        return;
      }
      setSelectedFile(file);
      setError(null);
      const baseName = file.name.replace(/\.zip$/i, '').toLowerCase().replace(/[^a-z0-9-_]/g, '-');
      if (!projectName) {
        setProjectName(baseName);
      }
    }
  };

  const handleNext = async () => {
    if (step === 1) {
      if (sourceType === 'ZIP' && !selectedFile) {
        setError('Please upload a .zip archive before continuing.');
        return;
      }
      if (sourceType === 'SAMPLE') {
        setProjectName('vulnerable-web-app-sample');
      }
      setError(null);
      setStep(2);
      return;
    }

    if (step === 2) {
      if (!projectName.trim()) {
        setError('Please enter a project name.');
        return;
      }
      setError(null);
      setStep(3);
      return;
    }

    // Step 3: Execute creation & scan launch
    setLoading(true);
    setError(null);

    try {
      if (sourceType === 'SAMPLE') {
        const sampleRes = await apiFetch('/projects/sample', { method: 'POST' });
        const projectId = sampleRes.data.project.id;

        await apiFetch(`/projects/${projectId}/scans`, {
          method: 'POST',
          body: JSON.stringify({ profile }),
        });

        queryClient.invalidateQueries({ queryKey: ['projects'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        router.push(`/projects/${projectId}/findings`);
        return;
      }

      // Real ZIP upload flow
      const projRes = await apiFetch('/projects', {
        method: 'POST',
        body: JSON.stringify({
          name: projectName,
          sourceType: 'ZIP',
          framework,
        }),
      });

      const projectId = projRes.data.id;

      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile, selectedFile.name);
        await apiFetch(`/projects/${projectId}/uploads`, {
          method: 'POST',
          body: formData,
        });
      }

      await apiFetch(`/projects/${projectId}/scans`, {
        method: 'POST',
        body: JSON.stringify({ profile }),
      });

      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      router.push(`/projects/${projectId}/findings`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to start project scan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-b border-hairline pb-4">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Initialize Project</h1>
        <p className="text-xs font-mono text-ink-muted mt-1">
          Stage source code for vulnerability scanning across SAST, SCA, and secrets.
        </p>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive text-destructive rounded-md p-3 text-xs font-mono flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>fatal: {error}</span>
        </div>
      )}

      {/* Progress Stepper with Git Rail */}
      <div className="flex items-center justify-between font-mono text-xs border border-hairline rounded-lg p-3 bg-surface">
        {[
          { num: 1, label: "source.stage" },
          { num: 2, label: "config.profile" },
          { num: 3, label: "commit.scan" },
        ].map((s, idx) => (
          <div key={s.num} className="flex items-center gap-2">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                step === s.num
                  ? "bg-primary text-primary-ink"
                  : step > s.num
                  ? "bg-lane-1 text-white"
                  : "bg-wash text-ink-muted border border-hairline"
              }`}
            >
              {step > s.num ? "✓" : s.num}
            </span>
            <span className={step >= s.num ? "text-ink font-semibold" : "text-ink-muted"}>
              {s.label}
            </span>
            {idx < 2 && <span className="text-rail mx-2 hidden sm:inline">---</span>}
          </div>
        ))}
      </div>

      {/* Main Surface Card */}
      <div className="border border-hairline rounded-lg bg-surface">
        {/* STEP 1: SELECT SOURCE */}
        {step === 1 && (
          <div className="p-6 space-y-6">
            <div>
              <h2 className="text-base font-semibold text-ink">1. Select Codebase Source</h2>
              <p className="text-xs font-mono text-ink-muted">Choose source archive or sample repository</p>
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              {/* Option A: ZIP Upload */}
              <button
                type="button"
                onClick={() => setSourceType("ZIP")}
                className={`p-4 rounded-md border text-left transition-colors cursor-pointer ${
                  sourceType === "ZIP"
                    ? "border-primary bg-primary-soft"
                    : "border-hairline bg-shell hover:bg-wash"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <UploadCloud className={`w-5 h-5 ${sourceType === "ZIP" ? "text-primary" : "text-ink-muted"}`} />
                  <span className={`w-2 h-2 rounded-full ${sourceType === "ZIP" ? "bg-primary" : "bg-rail"}`} />
                </div>
                <div className="font-semibold text-sm text-ink">ZIP Archive</div>
                <div className="text-xs text-ink-muted mt-1 font-mono">upload local folder</div>
              </button>

              {/* Option B: Sample Vulnerable Project */}
              <button
                type="button"
                onClick={() => {
                  setSourceType("SAMPLE");
                  setSelectedFile(null);
                  setProjectName("vulnerable-web-app-sample");
                }}
                className={`p-4 rounded-md border text-left transition-colors cursor-pointer relative ${
                  sourceType === "SAMPLE"
                    ? "border-primary bg-primary-soft"
                    : "border-hairline bg-shell hover:bg-wash"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Sparkles className={`w-5 h-5 ${sourceType === "SAMPLE" ? "text-primary" : "text-ink-muted"}`} />
                  <span className={`w-2 h-2 rounded-full ${sourceType === "SAMPLE" ? "bg-primary" : "bg-rail"}`} />
                </div>
                <div className="font-semibold text-sm text-ink">Sample App</div>
                <div className="text-xs text-ink-muted mt-1 font-mono">1-click test suite</div>
              </button>

              {/* Option C: GitHub */}
              <button
                type="button"
                onClick={() => setSourceType("GITHUB")}
                className={`p-4 rounded-md border text-left transition-colors cursor-pointer ${
                  sourceType === "GITHUB"
                    ? "border-primary bg-primary-soft"
                    : "border-hairline bg-shell hover:bg-wash"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Github className={`w-5 h-5 ${sourceType === "GITHUB" ? "text-primary" : "text-ink-muted"}`} />
                  <span className={`w-2 h-2 rounded-full ${sourceType === "GITHUB" ? "bg-primary" : "bg-rail"}`} />
                </div>
                <div className="font-semibold text-sm text-ink">Git URL</div>
                <div className="text-xs text-ink-muted mt-1 font-mono">clone repository</div>
              </button>
            </div>

            {/* ZIP Drag & Drop Box */}
            {sourceType === "ZIP" && (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-rail hover:border-primary rounded-md p-8 text-center cursor-pointer transition-colors bg-shell/50 space-y-2"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".zip,application/zip"
                  className="hidden"
                  onChange={handleFileChange}
                />
                {selectedFile ? (
                  <div className="space-y-1 font-mono text-xs">
                    <div className="w-10 h-10 rounded-full bg-lane-1/10 text-lane-1 flex items-center justify-center mx-auto mb-2">
                      <FileArchive className="w-5 h-5" />
                    </div>
                    <p className="font-semibold text-sm text-ink">{selectedFile.name}</p>
                    <p className="text-ink-muted">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • staged
                    </p>
                    <div className="pt-2">
                      <Button variant="outline" size="sm" className="text-xs font-mono">
                        change archive
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <UploadCloud className="w-8 h-8 mx-auto text-ink-muted" />
                    <p className="text-sm font-semibold text-ink">Drop .zip archive here or click to browse</p>
                    <p className="text-xs text-ink-muted font-mono">supports archives up to 50MB</p>
                  </>
                )}
              </div>
            )}

            {/* Sample App Explanation */}
            {sourceType === "SAMPLE" && (
              <div className="p-4 rounded-md bg-wash border border-hairline font-mono text-xs space-y-2 text-ink">
                <div className="font-semibold text-primary flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> vulnerable-web-app-sample
                </div>
                <p className="text-ink-muted leading-relaxed font-sans text-xs">
                  Includes real vulnerabilities: hardcoded API secrets (detected by Gitleaks), raw SQL string concatenations (detected by Semgrep), vulnerable JSON packages (detected by OSV-Scanner), and open CORS (detected by Config Engine).
                </p>
              </div>
            )}

            {/* GitHub URL */}
            {sourceType === "GITHUB" && (
              <div className="space-y-2">
                <label className="text-xs font-mono text-ink-muted uppercase">Repository URL</label>
                <Input
                  placeholder="https://github.com/owner/repository"
                  value={githubUrl}
                  onChange={(e) => {
                    setGithubUrl(e.target.value);
                    const parts = e.target.value.split('/');
                    const repo = parts[parts.length - 1];
                    if (repo && !projectName) setProjectName(repo);
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* STEP 2: CONFIGURE DETAILS */}
        {step === 2 && (
          <div className="p-6 space-y-4">
            <div>
              <h2 className="text-base font-semibold text-ink">2. Configure Scan Profile</h2>
              <p className="text-xs font-mono text-ink-muted">Verify repository label and engines to invoke</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono text-ink-muted uppercase">Project Identifier</label>
              <Input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="my-service-backend"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono text-ink-muted uppercase">Framework Environment</label>
              <select
                value={framework}
                onChange={(e) => setFramework(e.target.value)}
                className="flex h-[36px] w-full rounded-md border border-rail bg-surface px-3 py-1.5 text-xs font-mono text-ink focus:border-primary outline-none"
              >
                <option value="Next.js">Next.js (React)</option>
                <option value="Node.js / Express">Node.js / Express</option>
                <option value="React">React SPA</option>
                <option value="Python / FastAPI">Python / FastAPI / Django</option>
                <option value="Go">Go / Golang</option>
                <option value="General Repository">General Codebase</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono text-ink-muted uppercase">Scan Engine Profile</label>
              <select
                value={profile}
                onChange={(e) => setProfile(e.target.value)}
                className="flex h-[36px] w-full rounded-md border border-rail bg-surface px-3 py-1.5 text-xs font-mono text-ink focus:border-primary outline-none"
              >
                <option value="Comprehensive">Comprehensive (Semgrep + Gitleaks + OSV + Config)</option>
                <option value="Fast Check (Secrets only)">Fast Check (Gitleaks Secrets only)</option>
              </select>
            </div>
          </div>
        )}

        {/* STEP 3: REVIEW & LAUNCH */}
        {step === 3 && (
          <div className="p-6 space-y-4">
            <div>
              <h2 className="text-base font-semibold text-ink">3. Review & Execute Scan</h2>
              <p className="text-xs font-mono text-ink-muted">Ready to dispatch job to BullMQ worker queue</p>
            </div>

            <div className="p-4 rounded-md bg-wash border border-hairline font-mono text-xs space-y-2.5">
              <div className="flex justify-between">
                <span className="text-ink-muted">project:</span>
                <span className="text-ink font-semibold">{projectName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">source:</span>
                <span className="text-ink font-semibold">
                  {sourceType === "SAMPLE"
                    ? "vulnerable-web-app-sample"
                    : selectedFile
                    ? `${selectedFile.name}`
                    : githubUrl || "ZIP archive"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">framework:</span>
                <span className="text-ink font-semibold">{framework}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">engines:</span>
                <span className="text-primary font-semibold">
                  {profile.includes("Secrets") ? "Gitleaks" : "Semgrep, Gitleaks, OSV-Scanner, Config"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="px-6 py-4 border-t border-hairline flex items-center justify-between bg-wash/30">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStep(step - 1)}
            disabled={step === 1 || loading}
            className="text-xs font-mono"
          >
            &lt; back
          </Button>

          <Button
            size="sm"
            onClick={handleNext}
            disabled={loading}
            className="gap-2 text-xs font-mono"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> dispatching job...
              </>
            ) : step === 3 ? (
              <>
                git commit scan <ArrowRight className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                continue &gt;
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
