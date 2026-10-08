"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Terminal, AlertTriangle, Sparkles, CheckCircle2 } from "lucide-react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";

export default function FindingDetailPage() {
  const params = useParams();
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'code', label: 'Affected Code' },
    { id: 'impact', label: 'Potential Impact' },
    { id: 'fix', label: 'How to Fix' },
    { id: 'verify', label: 'Verification' },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <span className="flex items-center gap-1 text-destructive bg-destructive/10 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider">
          <ShieldAlert className="w-3.5 h-3.5" /> Critical
        </span>
        <span className="text-sm font-medium text-muted-foreground">ID: {params.findingId} • GITLEAKS</span>
      </div>
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Exposed AWS Access Token</h1>
        <div className="flex gap-2">
          <Button variant="outline" className="border-border">Mark False Positive</Button>
          <Button>Resolve Issue</Button>
        </div>
      </div>

      <div className="flex overflow-x-auto border-b border-border hide-scrollbar">
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
                  A hardcoded AWS Access Token was found in your repository. This credential can be used by an attacker to authenticate to AWS APIs, potentially allowing them to access, modify, or delete your cloud infrastructure and data. 
                  <br/><br/>
                  To protect your system, the credential value has been redacted from our logs and databases.
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
              <div className="text-gray-500">2 |   "region": "us-east-1",</div>
              <div className="bg-destructive/20 text-destructive-foreground px-2 -mx-2 flex">
                <span className="text-destructive/50 mr-4 select-none w-4 text-right">3</span>
                <span>  "accessKeyId": "[REDACTED_SECRET]",</span>
              </div>
              <div className="text-gray-500">4 |   "secretAccessKey": "[REDACTED_SECRET]"</div>
              <div className="text-gray-500">5 | {"}"}</div>
            </div>
          </Card>
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
                <ol className="list-decimal pl-5 space-y-2 text-sm text-foreground">
                  <li><strong>Revoke</strong> the exposed key in AWS IAM immediately.</li>
                  <li><strong>Replace</strong> the hardcoded values with environment variables in your code.</li>
                  <li><strong>Remove</strong> the secret from your git history using tools like BFG Repo-Cleaner or git filter-repo if necessary.</li>
                </ol>
                <div className="mt-4 p-4 rounded-md bg-black/40 font-mono text-xs border border-border">
                  <span className="text-gray-500">{"// Updated config/aws.json or config.js"}</span><br/>
                  {"{"}<br/>
                  &nbsp;&nbsp;"region": process.env.AWS_REGION,<br/>
                  &nbsp;&nbsp;"accessKeyId": process.env.AWS_ACCESS_KEY_ID,<br/>
                  &nbsp;&nbsp;"secretAccessKey": process.env.AWS_SECRET_ACCESS_KEY<br/>
                  {"}"}
                </div>
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
              <Button variant="outline" className="mt-2">Trigger Rescan</Button>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  );
}
