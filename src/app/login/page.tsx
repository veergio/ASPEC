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
  HardHat,
  BriefcaseBusiness,
} from "lucide-react";
import { setRole, type Role } from "@/lib/role";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [role, setSelectedRole] = useState<Role>("manager");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (loading) return;

    setLoading(true);
    setRole(role);

    router.push(role === "technician" ? "/work-report" : "/");
  };

  const roles: {
    id: Role;
    label: string;
    desc: string;
    icon: typeof BriefcaseBusiness;
  }[] = [
    {
      id: "manager",
      label: "Asset Manager",
      desc: "Operations & analytics",
      icon: BriefcaseBusiness,
    },
    {
      id: "technician",
      label: "Asset Technician",
      desc: "Field maintenance",
      icon: HardHat,
    },
  ];

  return (
    <div className="grid min-h-screen w-full grid-cols-1 bg-background lg:grid-cols-2">
      {/* LEFT SIDE */}
      <div className="relative hidden overflow-hidden lg:block">
        {/* BACKGROUND IMAGE */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('/assets/login-bg.jpg')",
          }}
        />

        {/* OVERLAY */}
        <div className="absolute inset-0 bg-gradient-to-br from-background/90 via-background/60 to-primary/30" />

        {/* CONTENT */}
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

      {/* RIGHT SIDE */}
      <div className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* MOBILE HEADER */}
          <div className="mb-8 flex flex-col items-center text-center lg:hidden">
            <AspecLogo size={64} />

            <h1 className="mt-4 text-2xl font-bold text-foreground">
              ASPEC
            </h1>

            <p className="text-xs text-muted-foreground">
              AI-Powered Predictive Maintenance System
            </p>
          </div>

          {/* DESKTOP HEADER */}
          <div className="mb-6 hidden lg:block">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-[11px] text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              Secure Operator Access
            </div>

            <h1 className="text-3xl font-semibold text-foreground">
              Welcome back
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              AI-Powered Predictive Maintenance System
            </p>
          </div>

          {/* FORM */}
          <form
            onSubmit={onSubmit}
            className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]"
          >
            {/* ROLE SELECT */}
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Sign in as
              </Label>

              <div className="grid grid-cols-2 gap-2">
                {roles.map((r) => {
                  const active = role === r.id;

                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setSelectedRole(r.id)}
                      className={`flex flex-col items-start rounded-xl border p-3 text-left transition ${
                        active
                          ? "border-cyan/60 bg-cyan/10 ring-1 ring-cyan/40"
                          : "border-border bg-background/60 hover:border-border/80"
                      }`}
                    >
                      <r.icon
                        className={`h-4 w-4 ${
                          active
                            ? "text-cyan"
                            : "text-muted-foreground"
                        }`}
                      />

                      <div className="mt-2 text-sm font-medium text-foreground">
                        {r.label}
                      </div>

                      <div className="text-[10px] text-muted-foreground">
                        {r.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* EMAIL */}
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>

              <Input
                id="email"
                type="email"
                defaultValue="operator@aspec.io"
                required
                className="h-11 bg-background/60"
              />
            </div>

            {/* PASSWORD */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>

                <a
                  href="#"
                  className="text-xs text-cyan hover:underline"
                >
                  Forgot?
                </a>
              </div>

              <Input
                id="password"
                type="password"
                defaultValue="••••••••"
                required
                className="h-11 bg-background/60"
              />
            </div>

            {/* BUTTON */}
            <Button
              type="submit"
              disabled={loading}
              className="h-11 w-full bg-gradient-to-r from-primary to-cyan text-primary-foreground hover:opacity-90"
            >
              {loading ? "Signing in…" : "Sign in to Control Center"}
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