"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, GitBranch, ShieldAlert, ShieldCheck, MoreVertical } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

const mockProjects = [
  { id: "1", name: "vibeshield-api", framework: "NestJS", type: "GitHub", lastScan: "2 hours ago", status: "Critical", criticalCount: 2, highCount: 5 },
  { id: "2", name: "frontend-client", framework: "Next.js", type: "GitHub", lastScan: "1 day ago", status: "Clear", criticalCount: 0, highCount: 0 },
  { id: "3", name: "legacy-payment-service", framework: "Express", type: "ZIP", lastScan: "3 days ago", status: "Warning", criticalCount: 0, highCount: 8 },
];

export default function ProjectsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground mt-1">Manage and monitor your connected codebases.</p>
        </div>
        <Link href="/projects/new">
          <Button className="shrink-0 gap-2">
            <Plus className="w-4 h-4" /> Add Project
          </Button>
        </Link>
      </div>

      <Card className="border-border bg-card/30 backdrop-blur-sm">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input type="search" placeholder="Search projects..." className="pl-9 bg-background/50" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground bg-muted/20 uppercase border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-medium">Project</th>
                  <th className="px-6 py-4 font-medium">Source</th>
                  <th className="px-6 py-4 font-medium">Last Scan</th>
                  <th className="px-6 py-4 font-medium">Vulnerabilities</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {mockProjects.map((project, i) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    key={project.id} 
                    className="hover:bg-muted/10 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-foreground">{project.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{project.framework}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <GitBranch className="w-4 h-4" /> {project.type}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{project.lastScan}</td>
                    <td className="px-6 py-4">
                      {project.status === "Clear" ? (
                        <div className="flex items-center gap-1.5 text-green-500">
                          <ShieldCheck className="w-4 h-4" /> 0 issues
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1 text-destructive text-xs font-bold bg-destructive/10 px-2 py-0.5 rounded-full">
                            <ShieldAlert className="w-3 h-3" /> {project.criticalCount} Critical
                          </span>
                          <span className="flex items-center gap-1 text-orange-500 text-xs font-bold bg-orange-500/10 px-2 py-0.5 rounded-full">
                            {project.highCount} High
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/projects/${project.id}/findings`}>
                        <Button variant="ghost" size="sm">View Findings</Button>
                      </Link>
                      <Button variant="ghost" size="icon" className="ml-2">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
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
