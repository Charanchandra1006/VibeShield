"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Shield, Zap, Search, Lock } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-white/5 bg-background/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <span className="font-bold text-xl tracking-tight">VibeShield</span>
        </div>
        <nav className="hidden md:flex gap-6 text-sm font-medium text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-foreground transition-colors">How it works</a>
          <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
        </nav>
        <div className="flex items-center gap-4">
          <Button variant="ghost" className="hidden sm:inline-flex" asChild>
            <Link href="/login">Sign In</Link>
          </Button>
          <Button className="bg-primary hover:bg-primary/90" asChild>
            <Link href="/register">Get Started</Link>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 relative overflow-hidden pt-20 pb-32">
        
        {/* Background glow effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] -z-10 opacity-50" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] -z-10" />

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-4xl mx-auto space-y-8"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium mb-4">
            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
            VibeShield Public Beta is Live
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight lg:leading-[1.1] bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-500">
            Build Fast. <br className="hidden md:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500">
              Ship Secure.
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            An AI-native application security platform that detects, explains, prioritizes, and helps remediate vulnerabilities before they reach production.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button size="lg" className="w-full sm:w-auto text-base h-12 px-8 shadow-[0_0_40px_-10px_rgba(124,58,237,0.5)]" asChild>
              <Link href="/register">Start Scanning Free</Link>
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto text-base h-12 px-8" asChild>
              <Link href="/dashboard">View Documentation</Link>
            </Button>
          </div>
        </motion.div>

        {/* Feature Cards Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="grid md:grid-cols-3 gap-6 w-full max-w-6xl mx-auto mt-32"
        >
          <FeatureCard 
            icon={<Search className="w-6 h-6 text-blue-400" />}
            title="Automated Assessment"
            description="Connect your repository or upload code. We automatically scan dependencies, secrets, and code logic."
          />
          <FeatureCard 
            icon={<Zap className="w-6 h-6 text-primary" />}
            title="AI-Assisted Remediation"
            description="Translate complex findings into beginner-friendly explanations and generate actionable code fixes."
          />
          <FeatureCard 
            icon={<Lock className="w-6 h-6 text-green-400" />}
            title="Continuous Verification"
            description="Rescan after fixing issues and track vulnerability trends across your entire workspace."
          />
        </motion.div>
      </main>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="group relative glass rounded-2xl p-8 hover:bg-white/[0.15] dark:hover:bg-black/[0.15] transition-all duration-300 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="w-12 h-12 rounded-xl bg-background/50 border flex items-center justify-center mb-6 relative z-10">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-3 relative z-10">{title}</h3>
      <p className="text-muted-foreground leading-relaxed relative z-10">{description}</p>
    </div>
  );
}
