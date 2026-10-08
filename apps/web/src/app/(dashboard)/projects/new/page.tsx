"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Github, UploadCloud, CheckCircle2, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

export default function NewProjectPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [sourceType, setSourceType] = useState<"GITHUB" | "ZIP" | null>(null);
  const [loading, setLoading] = useState(false);
  const [projectName, setProjectName] = useState('vibeshield-demo-app');

  const handleNext = async () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      setLoading(true);
      try {
        // Create project
        const projRes = await apiFetch('/projects', {
          method: 'POST',
          body: JSON.stringify({
            name: projectName,
            sourceType,
            framework: 'Next.js'
          })
        });

        // Mock upload zip file (using a blob instead of actual file for MVP demo)
        const formData = new FormData();
        formData.append('file', new Blob(['mock-zip-content'], { type: 'application/zip' }), 'source.zip');
        
        await apiFetch(`/projects/${projRes.data.id}/uploads`, {
          method: 'POST',
          body: formData,
        });

        // Start scan
        await apiFetch(`/projects/${projRes.data.id}/scans`, {
          method: 'POST',
          body: JSON.stringify({ profile: 'Comprehensive' })
        });

        router.push(`/projects`);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 mt-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Onboard New Project</h1>
        <p className="text-muted-foreground">Select your source code to begin security analysis.</p>
      </div>

      <div className="flex items-center justify-center gap-4 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${step >= s ? 'bg-primary text-primary-foreground shadow-[0_0_15px_rgba(124,58,237,0.5)]' : 'bg-muted text-muted-foreground'}`}>
              {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
            </div>
            {s !== 3 && <div className={`w-16 h-px ${step > s ? 'bg-primary' : 'bg-border'}`} />}
          </div>
        ))}
      </div>

      <motion.div
        key={step}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="glass border-border">
          {step === 1 && (
            <>
              <CardHeader>
                <CardTitle>Select Input Source</CardTitle>
                <CardDescription>How would you like to import your code?</CardDescription>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-2 gap-4">
                <button
                  onClick={() => setSourceType("GITHUB")}
                  className={`flex flex-col items-center justify-center p-8 border-2 rounded-xl transition-all ${sourceType === "GITHUB" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 bg-background/50"}`}
                >
                  <Github className={`w-12 h-12 mb-4 ${sourceType === "GITHUB" ? "text-primary" : "text-muted-foreground"}`} />
                  <h3 className="font-semibold">Import from GitHub</h3>
                  <p className="text-sm text-muted-foreground mt-2 text-center">Connect your repository directly</p>
                </button>
                <button
                  onClick={() => setSourceType("ZIP")}
                  className={`flex flex-col items-center justify-center p-8 border-2 rounded-xl transition-all ${sourceType === "ZIP" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 bg-background/50"}`}
                >
                  <UploadCloud className={`w-12 h-12 mb-4 ${sourceType === "ZIP" ? "text-primary" : "text-muted-foreground"}`} />
                  <h3 className="font-semibold">Upload ZIP Archive</h3>
                  <p className="text-sm text-muted-foreground mt-2 text-center">Manually upload source code</p>
                </button>
              </CardContent>
            </>
          )}

          {step === 2 && (
            <>
              <CardHeader>
                <CardTitle>Configure Project</CardTitle>
                <CardDescription>We detected your framework. Please confirm details.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Project Name</label>
                  <Input value={projectName} onChange={e => setProjectName(e.target.value)} className="bg-background/50" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Detected Framework</label>
                  <div className="p-3 bg-muted/30 border border-border rounded-lg text-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    Next.js (React)
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Scan Profile</label>
                  <select className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                    <option>Comprehensive (SAST, SCA, Secrets, Config)</option>
                    <option>Fast Check (Secrets only)</option>
                  </select>
                </div>
              </CardContent>
            </>
          )}

          {step === 3 && (
            <>
              <CardHeader>
                <CardTitle>Review & Start Scan</CardTitle>
                <CardDescription>Review your setup before orchestrating the scan pipeline.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 rounded-lg bg-muted/20 border border-border space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Source</span>
                    <span className="font-medium">ZIP Archive (4.2 MB)</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Engines</span>
                    <span className="font-medium">Semgrep, Gitleaks, OSV-Scanner</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Privacy</span>
                    <span className="font-medium">Private (Your Workspace Only)</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  By starting the scan, you confirm you are authorized to analyze this source code.
                </p>
              </CardContent>
            </>
          )}

          <CardFooter className="flex justify-between border-t border-border pt-6">
            <Button variant="ghost" onClick={() => setStep(step - 1)} disabled={step === 1 || loading}>
              Back
            </Button>
            <Button onClick={handleNext} disabled={(step === 1 && !sourceType) || loading} className="gap-2">
              {loading ? "Starting..." : step === 3 ? "Start Security Scan" : "Continue"} <ArrowRight className="w-4 h-4" />
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
