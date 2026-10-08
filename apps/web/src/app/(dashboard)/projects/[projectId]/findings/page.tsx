"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, ShieldAlert, Shield, ShieldCheck, ChevronRight } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useParams } from "next/navigation";

const mockFindings = [
  { id: "1", title: "Potential SQL Injection", category: "Code", severity: "High", file: "src/db/query.js:42", status: "Open", date: "2 mins ago" },
  { id: "2", title: "Hardcoded AWS Access Token", category: "Secret", severity: "Critical", file: "config/aws.json:3", status: "Open", date: "2 mins ago" },
  { id: "3", title: "Prototype Pollution in lodash", category: "Dependency", severity: "High", file: "package.json", status: "Open", date: "2 mins ago" },
  { id: "4", title: "DangerouslyAllowSVG Enabled", category: "Config", severity: "Medium", file: "next.config.js", status: "Reviewed", date: "1 day ago" },
];

export default function FindingsListPage() {
  const params = useParams();

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
        {['Critical', 'High', 'Medium', 'Low'].map((sev, i) => (
          <Card key={sev} className="border-border bg-card/30">
            <CardContent className="p-4 flex items-center justify-between">
              <span className="font-medium text-sm text-muted-foreground">{sev}</span>
              <span className="text-2xl font-bold">{i === 0 ? 1 : i === 1 ? 2 : i === 2 ? 1 : 0}</span>
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
                {mockFindings.map((finding, i) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={finding.id} 
                    className="hover:bg-muted/10 transition-colors group cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      {finding.severity === 'Critical' && <span className="flex items-center gap-1.5 text-destructive font-bold text-xs"><ShieldAlert className="w-4 h-4" /> CRITICAL</span>}
                      {finding.severity === 'High' && <span className="flex items-center gap-1.5 text-orange-500 font-bold text-xs"><ShieldAlert className="w-4 h-4" /> HIGH</span>}
                      {finding.severity === 'Medium' && <span className="flex items-center gap-1.5 text-yellow-500 font-bold text-xs"><Shield className="w-4 h-4" /> MEDIUM</span>}
                    </td>
                    <td className="px-6 py-4 font-medium text-foreground">{finding.title}</td>
                    <td className="px-6 py-4 text-muted-foreground">{finding.category}</td>
                    <td className="px-6 py-4 font-mono text-xs text-muted-foreground">{finding.file}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-xs font-medium ${finding.status === 'Open' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
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
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
