"use client";

import { Shield, LayoutDashboard, Search, Bell, Settings, LogOut, FolderKanban, Plus, User, Menu, X, Terminal, GitCommit } from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => apiFetch('/auth/me').then((res) => res.data),
    retry: false,
  });

  const handleLogout = async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    } finally {
      router.push('/login');
    }
  };

  const isActive = (href: string) => pathname === href || (href !== '/dashboard' && pathname?.startsWith(href));

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/projects', label: 'Projects', icon: FolderKanban },
    { href: '/projects/new', label: 'New Scan', icon: Plus },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-shell text-ink">
      {/* Top Navbar */}
      <header className="px-4 sm:px-6 py-2.5 border-b border-hairline bg-surface sticky top-0 z-40 flex items-center justify-between">
        <div className="flex items-center gap-4 sm:gap-6">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            {/* VibeShield Brand with Git Node aesthetic */}
            <div className="w-7 h-7 rounded-full border-2 border-primary bg-primary-soft flex items-center justify-center">
              <span className="w-2.5 h-2.5 rounded-full bg-primary" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-base tracking-tight text-ink">
                VibeShield
              </span>
              <span className="text-[11px] font-mono text-ink-muted hidden sm:inline-block px-1.5 py-0.5 rounded bg-wash border border-hairline">
                appsec
              </span>
            </div>
          </Link>

          <div className="h-4 w-px bg-hairline hidden sm:block" />

          {/* Workspace Pill */}
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-md bg-shell border border-hairline text-xs font-mono text-ink-muted">
            <span className="w-1.5 h-1.5 rounded-full bg-lane-1" />
            <span className="truncate max-w-[160px]">{user?.name ? `${user.name.toLowerCase()}` : 'workspace:main'}</span>
          </div>
        </div>

        {/* Center / Right Nav Items */}
        <div className="flex items-center gap-2 sm:gap-3">
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[14px] font-medium transition-colors ${
                    active
                      ? 'bg-primary-soft text-primary'
                      : 'text-ink-muted hover:text-ink hover:bg-wash'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-primary' : 'text-ink-muted'}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="h-4 w-px bg-hairline hidden md:block" />

          {/* User Profile Pill */}
          {user && (
            <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-full bg-wash border border-hairline text-xs font-mono text-ink-muted">
              <span className="w-2 h-2 rounded-full bg-lane-0" />
              <span className="max-w-[120px] truncate text-ink font-mono text-[12px]">{user.email || user.name}</span>
            </div>
          )}

          {/* New Scan CTA */}
          <Link href="/projects/new" className="hidden sm:block">
            <Button size="sm" className="gap-1.5 text-xs">
              <Plus className="w-3.5 h-3.5" /> Commit Scan
            </Button>
          </Link>

          {/* Logout */}
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-ink-muted hover:text-destructive hover:bg-wash"
            title="Log out"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
          </Button>

          {/* Mobile hamburger */}
          <Button
            variant="ghost"
            size="icon-sm"
            className="md:hidden text-ink-muted"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </Button>
        </div>
      </header>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-surface border-b border-hairline px-4 py-3 space-y-1">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium ${
                  active ? 'bg-primary-soft text-primary' : 'text-ink-muted hover:text-ink hover:bg-wash'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      )}

      {/* Page Content */}
      <main className="flex-1 max-w-[1264px] mx-auto w-full p-4 sm:p-6 lg:p-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-hairline py-3 px-6 text-xs text-ink-muted bg-surface">
        <div className="max-w-[1264px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 font-mono text-[12px]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-lane-1" />
            <span>VibeShield AppSec Log • Pipeline active</span>
          </div>
          <span className="text-ink-muted">
            semgrep:sast • gitleaks:secrets • osv:sca • config:iac
          </span>
        </div>
      </footer>
    </div>
  );
}
