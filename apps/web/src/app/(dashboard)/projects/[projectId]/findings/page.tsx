"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, ShieldAlert, Shield, ShieldCheck, ChevronRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useParams } from "next/navigation";
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from "@/lib/api";

export default function FindingsListPage() {
  const params = useParams();

  const { data: findings, isLoading } = useQuery({
    queryKey: ['projects', params.projectId, 'findings'],
    queryFn: () => apiFetch(`/projects/${params.projectId}/findings`).then(res => res.data),
  });

  const getSeverityCounts = () => {
    if (!findings) return { Critical: 0, High: 0, Medium: 0, Low: 0 };
    return findings.reduce((acc: any, curr: any) => {
      const sev = curr.occurrences?.[0]?.severity || 'Low';
      acc[sev] = (acc[sev] || 0) + 1;
      return acc;
    }, { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 });
  };
  const counts = getSeverityCounts();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="text-sm text-muted-foreground mb-1">Project / {params.projectId}</div>
          <h1 className="text-3xl font-bold tracking-tight">Security Findings</h1>
        </div>
        <Button variant="outline" className="shrink-0 gap-2">
          <Filter className="w-4 h-4" /> Filter
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        {[
          { label: 'Critical', val: counts.CRITICAL },
          { label: 'High', val: counts.HIGH },
          { label: 'Medium', val: counts.MEDIUM },
          { label: 'Low', val: counts.LOW }
        ].map((sev, i) => (
          <Card key={sev.label} className="border-border bg-card/30">
            <CardContent className="p-4 flex items-center justify-between">
              <span className="font-medium text-sm text-muted-foreground">{sev.label}</span>
              <span className="text-2xl font-bold">{sev.val}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border bg-card/30 backdrop-blur-sm">
        <CardHeader className="p-4 border-b border-border">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input type="search" placeholder="Search vulnerabilities..." className="pl-9 bg-background/50" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground bg-muted/20 uppercase border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-medium">Severity</th>
                  <th className="px-6 py-4 font-medium">Vulnerability</th>
                  <th className="px-6 py-4 font-medium">Category</th>
                  <th className="px-6 py-4 font-medium">Location</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : findings?.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                      No security findings discovered yet! Keep up the good work.
                    </td>
                  </tr>
                ) : findings?.map((finding: any, i: number) => {
                  const occurrence = finding.occurrences?.[0] || {};
                  return (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={finding.id} 
                    className="hover:bg-muted/10 transition-colors group cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      {occurrence.severity === 'CRITICAL' && <span className="flex items-center gap-1.5 text-destructive font-bold text-xs"><ShieldAlert className="w-4 h-4" /> CRITICAL</span>}
                      {occurrence.severity === 'HIGH' && <span className="flex items-center gap-1.5 text-orange-500 font-bold text-xs"><ShieldAlert className="w-4 h-4" /> HIGH</span>}
                      {occurrence.severity === 'MEDIUM' && <span className="flex items-center gap-1.5 text-yellow-500 font-bold text-xs"><Shield className="w-4 h-4" /> MEDIUM</span>}
                      {occurrence.severity === 'LOW' && <span className="flex items-center gap-1.5 text-blue-500 font-bold text-xs"><Shield className="w-4 h-4" /> LOW</span>}
                    </td>
                    <td className="px-6 py-4 font-medium text-foreground">{finding.fingerprint.substring(0, 12)}...</td>
                    <td className="px-6 py-4 text-muted-foreground">{occurrence.ruleId}</td>
                    <td className="px-6 py-4 font-mono text-xs text-muted-foreground">{occurrence.filePath}:{occurrence.startLine}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-xs font-medium ${finding.status === 'OPEN' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                        {finding.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/findings/${finding.id}`}>
                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    </td>
                  </motion.tr>
                )})}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
