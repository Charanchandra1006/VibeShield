"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = e.target as HTMLFormElement;
    
    try {
      await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: form.email.value,
          password: form.password.value,
        })
      });
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setDemoLoading(true);
    setError(null);
    try {
      try {
        await apiFetch('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email: 'demo@vibeshield.io', password: 'Password123!' })
        });
      } catch {
        // Register if not exists
        await apiFetch('/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            email: 'demo@vibeshield.io',
            password: 'Password123!',
            name: 'Demo Security Analyst',
          })
        });
      }
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-shell text-ink px-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 justify-center group">
          <div className="w-7 h-7 rounded-full border-2 border-primary bg-primary-soft flex items-center justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-primary" />
          </div>
          <span className="font-semibold text-lg tracking-tight text-ink">VibeShield</span>
        </Link>

        {/* Card */}
        <div className="border border-hairline rounded-lg bg-surface p-6 space-y-5">
          <div className="space-y-1">
            <h1 className="text-base font-semibold text-ink">Authenticate</h1>
            <p className="text-xs font-mono text-ink-muted">Enter credentials or use 1-click demo</p>
          </div>

          {error && (
            <div className="p-2.5 rounded bg-destructive/10 border border-destructive text-destructive font-mono text-xs">
              fatal: {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-ink-muted uppercase">Email</label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                defaultValue="demo@vibeshield.io"
                placeholder="dev@null.org"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-ink-muted uppercase">Password</label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                defaultValue="Password123!"
                placeholder="••••••••"
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full text-xs font-mono">
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
              sign in &gt;
            </Button>
          </form>

          <div className="relative border-t border-hairline my-4">
            <span className="absolute left-1/2 -top-2.5 -translate-x-1/2 bg-surface px-2 text-[10px] font-mono text-ink-muted">
              or
            </span>
          </div>

          <Button
            variant="outline"
            type="button"
            onClick={handleDemoLogin}
            disabled={demoLoading}
            className="w-full text-xs font-mono gap-1.5"
          >
            {demoLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-primary" />}
            1-click demo login
          </Button>

          <p className="text-center text-xs font-mono text-ink-muted">
            no account?{" "}
            <Link href="/register" className="text-primary hover:underline">
              register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
