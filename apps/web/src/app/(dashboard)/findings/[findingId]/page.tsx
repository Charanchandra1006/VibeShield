"use client";

import { Suspense, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Terminal, AlertTriangle, Sparkles, Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from "@/lib/api";

export default function FindingDetailPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-16 text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin" /></div>}>
      <FindingDetailInner />
    </Suspense>
  );
}

function FindingDetailInner() {
  const params = useParams();
  const router = useRouter();
  const findingId = params?.findingId as string | undefined;
  const [activeTab, setActiveTab] = useState('overview');
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const { data: aiExplanation, isLoading: isAILoading } = useQuery({
    queryKey: ['ai', 'explain', findingId],
    queryFn: () => apiFetch('/ai/explain', {
      method: 'POST',
      body: JSON.stringify({ findingId })
    }).then((res) => res.data),
    enabled: !!findingId && (activeTab === 'fix' || activeTab === 'overview' || activeTab === 'impact'),
  });

  const handleAction = (msg: string) => {
    setActionMsg(msg);
    setTimeout(() => setActionMsg(null), 3000);
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'code', label: 'Affected Code' },
    { id: 'impact', label: 'Potential Impact' },
    { id: 'fix', label: 'How to Fix' },
    { id: 'verify', label: 'Verification' },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {actionMsg && (
        <div className="bg-primary/10 border border-primary/20 text-foreground rounded-lg px-4 py-3 text-sm">
          {actionMsg}
        </div>
      )}
      <div className="flex items-center gap-3 mb-2">
        <span className="flex items-center gap-1 text-destructive bg-destructive/10 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider">
          <ShieldAlert className="w-3.5 h-3.5" /> Critical
        </span>
        <span className="text-sm font-medium text-muted-foreground">ID: {findingId} • GITLEAKS</span>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Exposed AWS Access Token</h1>
        <div className="flex gap-2">
          <Button variant="outline" className="border-border" onClick={() => handleAction('Marked as false positive (local demo state). Backend review endpoint coming soon.')}>Mark False Positive</Button>
          <Button onClick={() => handleAction('Marked as resolved (local demo state). Push a fix and rescan to verify.')}>Resolve Issue</Button>
        </div>
      </div>

      <div className="flex overflow-x-auto border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === tab.id ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="pt-4"
      >
        {activeTab === 'overview' && (
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-lg">What was detected</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground leading-relaxed">
                  {isAILoading ? (
                    <div className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin"/> Generating AI summary...</div>
                  ) : aiExplanation ? (
                    <>
                      {aiExplanation.summary}
                      <br/><br/>
                      {aiExplanation.explanation}
                    </>
                  ) : (
                    "Could not load AI summary. Is the API running on port 3001?"
                  )}
                </CardContent>
              </Card>

              <Card className="border-border bg-orange-500/5 border-orange-500/20">
                <CardContent className="p-4 flex gap-4">
                  <AlertTriangle className="w-6 h-6 text-orange-500 shrink-0" />
                  <div>
                    <h4 className="font-semibold text-orange-500">Immediate Action Required</h4>
                    <p className="text-sm text-muted-foreground mt-1">Removing the secret from the file is not enough if it was committed to Git history. The credential must be revoked in the AWS Console immediately.</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="border-border">
                <CardContent className="p-4 space-y-4 text-sm">
                  <div>
                    <div className="text-muted-foreground mb-1">Location</div>
                    <div className="font-mono">config/aws.json</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground mb-1">Status</div>
                    <div className="font-medium text-primary">Open</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground mb-1">First Detected</div>
                    <div>Oct 8, 2026, 12:45 PM</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'code' && (
          <Card className="border-border overflow-hidden">
            <div className="bg-muted/50 px-4 py-2 border-b border-border flex items-center justify-between">
              <span className="font-mono text-xs text-muted-foreground">config/aws.json</span>
            </div>
            <div className="p-4 font-mono text-sm overflow-x-auto bg-[#0d1117] text-gray-300">
              <div className="text-gray-500">1 | {"{"}</div>
              <div className="text-gray-500">2 |   &quot;region&quot;: &quot;us-east-1&quot;,</div>
              <div className="bg-destructive/20 text-destructive-foreground px-2 -mx-2 flex">
                <span className="text-destructive/50 mr-4 select-none w-4 text-right">3</span>
                <span>  &quot;accessKeyId&quot;: &quot;[REDACTED_SECRET]&quot;,</span>
              </div>
              <div className="text-gray-500">4 |   &quot;secretAccessKey&quot;: &quot;[REDACTED_SECRET]&quot;</div>
              <div className="text-gray-500">5 | {"}"}</div>
            </div>
          </Card>
        )}

        {activeTab === 'impact' && (
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-lg">Business impact</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground leading-relaxed space-y-2">
                {isAILoading ? (
                  <div className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin"/> Loading impact analysis...</div>
                ) : (
                  <>
                    <p>An exposed cloud credential can lead to unauthorized infrastructure access, data exfiltration, crypto-mining abuse, and unexpected billing charges.</p>
                    <p>CVSS-like severity: Critical when the key has broad IAM permissions or is present in public git history.</p>
                    {aiExplanation?.explanation ? <p>{aiExplanation.explanation}</p> : null}
                  </>
                )}
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-lg">Attack scenario</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground leading-relaxed">
                <ol className="list-decimal pl-5 space-y-2">
                  <li>Attacker scrapes GitHub or leaked artifacts for AWS key patterns.</li>
                  <li>Attacker calls STS GetCallerIdentity to validate the key.</li>
                  <li>Attacker enumerates S3, EC2, and IAM permissions for privilege escalation.</li>
                  <li>Attacker persists via new IAM users or exfiltrates data.</li>
                </ol>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'fix' && (
          <div className="space-y-6">
            <Card className="border-primary/20 bg-primary/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Sparkles className="w-24 h-24 text-primary" />
              </div>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  AI Remediation Assistant
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 relative z-10">
                <p className="text-muted-foreground">To resolve this safely, follow these steps:</p>
                {isAILoading ? (
                  <div className="flex items-center gap-2 p-4 text-sm"><Loader2 className="w-4 h-4 animate-spin"/> Generating remediation plan...</div>
                ) : aiExplanation ? (
                  <>
                    <ol className="list-decimal pl-5 space-y-2 text-sm text-foreground">
                      {aiExplanation.fixSteps.map((step: string, i: number) => (
                        <li key={i} dangerouslySetInnerHTML={{ __html: step }} />
                      ))}
                    </ol>
                    {aiExplanation.safeCodeExample && (
                      <div className="mt-4 p-4 rounded-md bg-black/40 font-mono text-xs border border-border overflow-x-auto whitespace-pre">
                        {aiExplanation.safeCodeExample}
                      </div>
                    )}
                  </>
                ) : (
                  <p>Failed to load remediation plan. Is the API running?</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'verify' && (
          <Card className="border-border">
            <CardContent className="p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto">
                <Terminal className="w-6 h-6 text-muted-foreground" />
              </div>
              <h3 className="font-medium">Verification Pending</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Push your changes to the repository and trigger a new scan to verify that this vulnerability has been fully resolved.
              </p>
              <div className="flex items-center justify-center gap-2">
                <Button variant="outline" className="mt-2" onClick={() => router.push('/projects/new')}>Trigger Rescan</Button>
                <Button variant="ghost" className="mt-2" onClick={() => router.back()}>Back</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  );
}
