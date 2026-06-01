"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AspecLogo } from "@/components/aspec-logo";
import {
  ShieldCheck,
  Cpu,
  Activity,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { dispatchAuthChange } from "@/lib/role";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || "Login failed. Please try again.");
        setLoading(false);
        return;
      }

      dispatchAuthChange();

      const role = data.user?.role ?? "teknisi";

      setLoading(false);

      router.push(role === "teknisi" ? "/work-report" : "/");
      router.refresh();
    } catch {
      setError("Network error. Please check your connection.");
      setLoading(false);
    }
  };
  return (
    <div className="grid min-h-screen w-full grid-cols-1 bg-background lg:grid-cols-2">
      {/* LEFT SIDE — HERO PANEL */}
      <div className="relative hidden overflow-hidden lg:block">
        {/* Background */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('/assets/login-bg.jpg')",
          }}
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-background/90 via-background/60 to-primary/30" />

        {/* Content */}
        <div className="relative z-10 flex h-full flex-col justify-between p-12">
          <AspecLogo size={48} withText />

          <div className="max-w-md space-y-6">
            <h2 className="text-4xl font-semibold leading-tight text-foreground">
              Industrial intelligence,
              <br />
              <span className="bg-gradient-to-r from-cyan to-primary bg-clip-text text-transparent">
                engineered for uptime.
              </span>
            </h2>

            <p className="text-sm text-muted-foreground">
              ASPEC unifies asset telemetry, AI diagnostics, and maintenance
              orchestration in a single operations control center.
            </p>

            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Cpu, label: "Predictive AI" },
                { icon: Activity, label: "Real-time Health" },
                { icon: ShieldCheck, label: "Enterprise-grade" },
              ].map((f) => (
                <div
                  key={f.label}
                  className="rounded-xl border border-border/60 bg-card/40 p-3 backdrop-blur"
                >
                  <f.icon className="h-4 w-4 text-cyan" />

                  <div className="mt-2 text-xs text-foreground">
                    {f.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            © 2026 ASPEC Industrial AI
          </div>
        </div>
      </div>

      {/* RIGHT SIDE — LOGIN FORM */}
      <div className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile header */}
          <div className="mb-8 flex flex-col items-center text-center lg:hidden">
            <AspecLogo size={64} />

            <h1 className="mt-4 text-2xl font-bold text-foreground">
              ASPEC
            </h1>

            <p className="text-xs text-muted-foreground">
              AI-Powered Predictive Maintenance System
            </p>
          </div>

          {/* Desktop header */}
          <div className="mb-6 hidden lg:block">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-[11px] text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              Secure Operator Access
            </div>

            <h1 className="text-3xl font-semibold text-foreground">
              Welcome back
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Sign in to access the Control Center
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={onSubmit}
            className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]"
          >
            {/* Error alert */}
            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>

              <Input
                id="email"
                type="email"
                placeholder="enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                disabled={loading}
                className="h-11 bg-background/60"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
              </div>

              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  disabled={loading}
                  className="h-11 bg-background/60 pr-10"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={loading}
              className="h-11 w-full bg-gradient-to-r from-primary to-cyan text-primary-foreground hover:opacity-90 cursor-pointer"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in…
                </span>
              ) : (
                "Sign in to Control Center"
              )}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Need access?{" "}
              <span className="text-cyan">
                Contact your administrator
              </span>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}