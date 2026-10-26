"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = e.target as HTMLFormElement;
    
    try {
      await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: form.fullName.value,
          email: form.email.value,
          password: form.password.value,
        })
      });
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
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
            <h1 className="text-base font-semibold text-ink">Register Account</h1>
            <p className="text-xs font-mono text-ink-muted">Initialize developer workspace</p>
          </div>

          {error && (
            <div className="p-2.5 rounded bg-destructive/10 border border-destructive text-destructive font-mono text-xs">
              fatal: {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-ink-muted uppercase">Full Name</label>
              <Input
                id="fullName"
                name="fullName"
                placeholder="Dracarys"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-ink-muted uppercase">Email</label>
              <Input
                id="email"
                name="email"
                type="email"
                required
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
                placeholder="••••••••"
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full text-xs font-mono">
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
              create account &gt;
            </Button>
          </form>

          <p className="text-center text-xs font-mono text-ink-muted pt-2 border-t border-hairline">
            already registered?{" "}
            <Link href="/login" className="text-primary hover:underline">
              sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
