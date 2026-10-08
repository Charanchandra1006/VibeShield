"use client";

import { Shield, LayoutDashboard, Search, Bell, Settings, LogOut, ChevronDown } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="px-6 py-3 border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <span className="font-bold text-xl tracking-tight hidden sm:block">VibeShield</span>
          </Link>
          
          <div className="h-6 w-px bg-border hidden sm:block" />
          
          <button className="hidden sm:flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors">
            Personal Workspace
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="flex items-center gap-4">
          <nav className="hidden md:flex items-center gap-4 text-sm font-medium">
            <Link href="/dashboard" className="text-primary flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Link>
            <Link href="/dashboard/scans" className="text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors">
              <Search className="w-4 h-4" />
              Scans
            </Link>
          </nav>
          
          <div className="h-6 w-px bg-border hidden md:block" />
          
          <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full animate-pulse" />
          </Button>
          
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <Settings className="w-5 h-5" />
          </Button>
          
          <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10">
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
