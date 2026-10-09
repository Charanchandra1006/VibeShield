"use client";

import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, GitBranch, Plus } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of your security posture across all projects.</p>
        </div>
        <Button className="shrink-0 gap-2" asChild>
          <Link href="/projects/new">
            <Plus className="w-4 h-4" /> New Scan
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Total Scans" value="12" description="+2 from last week" />
        <StatsCard title="Critical Issues" value="0" description="All clear" trend="good" />
        <StatsCard title="High Issues" value="4" description="-3 from last week" trend="good" />
        <StatsCard title="Projects" value="3" description="1 active" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="col-span-1 border-border">
          <CardHeader>
            <CardTitle>Recent Projects</CardTitle>
            <CardDescription>Security status of your connected repositories.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ProjectRow name="vibeshield-api" branch="main" issues={2} status="warning" />
            <ProjectRow name="frontend-client" branch="main" issues={0} status="success" />
            <ProjectRow name="auth-service" branch="staging" issues={5} status="critical" />
          </CardContent>
        </Card>

        <Card className="col-span-1 border-border">
          <CardHeader>
            <CardTitle>Security Posture Trend</CardTitle>
            <CardDescription>Vulnerabilities detected over time.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center border-t border-border/50 bg-muted/10 rounded-b-xl">
            <p className="text-muted-foreground flex items-center gap-2">
              <Shield className="w-5 h-5" /> Chart data will appear after your first scans
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatsCard({ title, value, description, trend }: { title: string, value: string, description: string, trend?: 'good' | 'bad' }) {
  return (
    <Card className="border-border hover:border-primary/20 transition-colors">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className={`text-xs mt-1 ${trend === 'good' ? 'text-green-500' : trend === 'bad' ? 'text-destructive' : 'text-muted-foreground'}`}>
          {description}
        </p>
      </CardContent>
    </Card>
  );
}

function ProjectRow({ name, branch, issues, status }: { name: string, branch: string, issues: number, status: 'success' | 'warning' | 'critical' }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${status === 'success' ? 'bg-green-500' : status === 'warning' ? 'bg-yellow-500' : 'bg-destructive'}`} />
        <div>
          <p className="text-sm font-medium">{name}</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
            <GitBranch className="w-3 h-3" /> {branch}
          </p>
        </div>
      </div>
      <div className="text-sm font-medium flex items-center gap-1.5">
        <Shield className={`w-4 h-4 ${status === 'success' ? 'text-green-500' : status === 'warning' ? 'text-yellow-500' : 'text-destructive'}`} />
        {issues} issues
      </div>
    </div>
  );
}
