"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  AlertTriangle, Wrench, Package, Wallet, MapPin, Gauge,
  TrendingUp, Activity, CheckCircle2, Zap, Cog, Calendar,
  Sparkles, ArrowUpRight, Thermometer,
} from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

type Condition = "Healthy" | "Warning" | "Critical";

const assetList: {
  id: string; name: string; location: string; health: number;
  rul: string; rulPct: number; condition: Condition;
}[] = [
  { id: "C-204", name: "Compressor C-204", location: "Plant A · Bay 5", health: 58, rul: "180h", rulPct: 22, condition: "Critical" },
  { id: "T-01", name: "Turbine T-01", location: "Plant A · Bay 2", health: 94, rul: "1,240h", rulPct: 88, condition: "Healthy" },
  { id: "P-118", name: "Pump P-118", location: "Plant B · Line 3", health: 76, rul: "640h", rulPct: 58, condition: "Warning" },
  { id: "G-09", name: "Generator G-09", location: "Substation 1", health: 88, rul: "980h", rulPct: 76, condition: "Healthy" },
  { id: "R-15", name: "Robot Arm R-15", location: "Plant B · Cell 4", health: 64, rul: "320h", rulPct: 38, condition: "Warning" },
];

const trend = Array.from({ length: 14 }, (_, i) => ({
  d: `D${i + 1}`,
  health: 70 + Math.round(Math.sin(i / 2) * 8 + Math.random() * 4),
  vibration: 30 + Math.round(Math.cos(i / 3) * 8 + Math.random() * 5),
}));

const failureModes = [
  { mode: "Bearing wear", count: 12 },
  { mode: "Seal leak", count: 8 },
  { mode: "Overheating", count: 5 },
  { mode: "Vibration drift", count: 4 },
];

const timeline = [
  { date: "12 May 2026", title: "Penggantian kontaktor utama", tag: "Corrective", tone: "warning", note: "Teknisi: Budi S. · Durasi 2j 15m" },
  { date: "28 Apr 2026", title: "Pembersihan filter & inspeksi termal", tag: "Preventive", tone: "success", note: "Suhu turun 8°C pasca tindakan" },
  { date: "10 Apr 2026", title: "Kalibrasi sensor getaran", tag: "Inspection", tone: "cyan", note: "Baseline vibrasi diperbarui" },
  { date: "22 Mar 2026", title: "Overhaul ringan modul kompresor", tag: "Major", tone: "critical", note: "Spare part: roller bearing × 2" },
];

const conditionStyle: Record<Condition, string> = {
  Healthy: "border-success/40 bg-success/10 text-success",
  Warning: "border-warning/40 bg-warning/10 text-warning",
  Critical: "border-critical/40 bg-critical/10 text-critical",
};

const conditionIcon: Record<Condition, typeof CheckCircle2> = {
  Healthy: CheckCircle2,
  Warning: AlertTriangle,
  Critical: Zap,
};

const toneStyle: Record<string, string> = {
  warning: "bg-warning/15 text-warning border-warning/30",
  success: "bg-success/15 text-success border-success/30",
  cyan: "bg-cyan/15 text-cyan border-cyan/30",
  critical: "bg-critical/15 text-critical border-critical/30",
};

export default function AssetDetailsPage() {
  const [selectedId, setSelectedId] = useState(assetList[0].id);
  const asset = assetList.find((a) => a.id === selectedId)!;
  const ConditionIcon = conditionIcon[asset.condition];

  return (
    <div className="-m-4 min-h-[calc(100vh-4rem)] bg-background p-4 md:-m-8 md:p-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Asset Intelligence</div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">Asset Details</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Deep-dive AI insight, maintenance intelligence, and lifecycle analytics.</p>
        </div>
        <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
          <Sparkles className="mr-1 h-3 w-3" /> AI Insight Updated · Live
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <Card className="border-border bg-card shadow-sm lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-foreground">Asset List</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 p-2">
            {assetList.map((a) => {
              const active = a.id === selectedId;
              const Icon = conditionIcon[a.condition];
              return (
                <button
                  key={a.id}
                  onClick={() => setSelectedId(a.id)}
                  className={`w-full rounded-xl border p-3 text-left transition ${
                    active ? "border-primary/40 bg-primary/5 shadow-sm" : "border-transparent hover:border-border hover:bg-muted/60"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium text-foreground">{a.name}</span>
                    <Badge variant="outline" className={`gap-1 text-[10px] ${conditionStyle[a.condition]}`}>
                      <Icon className="h-3 w-3" />{a.condition}
                    </Badge>
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">{a.location}</div>
                </button>
              );
            })}
          </CardContent>
        </Card>

        <div className="space-y-4 lg:col-span-3">
          <Card className="overflow-hidden border-border bg-card shadow-sm">
            <div className="h-1.5 w-full bg-gradient-to-r from-primary via-cyan to-primary" />
            <CardContent className="p-6">
              <div className="flex flex-wrap items-start justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-primary to-cyan text-primary-foreground shadow-md">
                    <Cog className="h-7 w-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {asset.id}<span className="h-1 w-1 rounded-full bg-muted-foreground/50" />Industrial Equipment
                    </div>
                    <h2 className="mt-1 text-2xl font-semibold text-foreground">{asset.name}</h2>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4 text-primary" />{asset.location}</span>
                      <span className="inline-flex items-center gap-1.5"><Calendar className="h-4 w-4 text-cyan" />Last service 12 May 2026</span>
                    </div>
                  </div>
                </div>
                <Badge variant="outline" className={`gap-1.5 px-3 py-1.5 text-sm ${conditionStyle[asset.condition]}`}>
                  <ConditionIcon className="h-4 w-4" />{asset.condition} Condition
                </Badge>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                {[
                  { label: "Asset Health", value: `${asset.health}`, unit: "%", progress: asset.health, icon: Gauge, color: "text-primary" },
                  { label: "Remaining Useful Life", value: asset.rul, unit: "", progress: asset.rulPct, icon: TrendingUp, color: "text-cyan" },
                  { label: "Operating Hours", value: "8,420h", unit: "", progress: null, icon: Activity, color: "text-primary", sub: "Since last overhaul" },
                ].map((m) => (
                  <div key={m.label} className="rounded-2xl border border-border bg-muted/50 p-4">
                    <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                      <span>{m.label}</span>
                      <m.icon className={`h-4 w-4 ${m.color}`} />
                    </div>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-3xl font-semibold text-foreground">{m.value}</span>
                      {m.unit && <span className="text-sm text-muted-foreground">{m.unit}</span>}
                    </div>
                    {m.progress !== null ? (
                      <Progress value={m.progress} className="mt-3 h-2 bg-secondary [&>div]:bg-gradient-to-r [&>div]:from-primary [&>div]:to-cyan" />
                    ) : (
                      <div className="mt-3 text-[11px] text-muted-foreground">{m.sub}</div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div>
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">Smart Damage History — AI Insight</h3>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: "Most Frequent Complaint", value: "Suhu tidak stabil", sub: "12 laporan / 90 hari", hint: "Frekuensi naik 18% vs bulan lalu", icon: Thermometer, tone: "warning" },
                { label: "Main Failure Cause", value: "Debu / Kotoran", sub: "Root cause utama", hint: "Dampak: penurunan efisiensi −9%", icon: Wrench, tone: "critical" },
                { label: "Most Replaced Spare Part", value: "Kontaktor", sub: "5× penggantian / 6 bulan", hint: "Lead time rata-rata 6 hari", icon: Package, tone: "cyan" },
                { label: "Average Maintenance Cost", value: "Rp 7.800.000", sub: "per intervensi", hint: "Spending YTD Rp 46,8 jt", icon: Wallet, tone: "success" },
              ].map((s) => (
                <Card key={s.label} className="border-border bg-card shadow-sm transition hover:shadow-md">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div className={`grid h-10 w-10 place-items-center rounded-xl border ${toneStyle[s.tone]}`}>
                        <s.icon className="h-5 w-5" />
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="mt-4 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{s.label}</div>
                    <div className="mt-1 text-lg font-semibold text-foreground">{s.value}</div>
                    <div className="text-[11px] text-muted-foreground">{s.sub}</div>
                    <div className="mt-3 rounded-lg bg-muted/60 px-2.5 py-1.5 text-[11px] text-foreground/80">{s.hint}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="border-border bg-card shadow-sm lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base text-foreground">Health & Vibration Trend</CardTitle>
                <Badge variant="outline" className="border-border bg-muted text-muted-foreground">Last 14 days</Badge>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={trend}>
                    <defs>
                      <linearGradient id="aH2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="d" stroke="var(--muted-foreground)" fontSize={11} />
                    <YAxis stroke="var(--muted-foreground)" fontSize={11} />
                    <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--popover-foreground)" }} />
                    <Area type="monotone" dataKey="health" stroke="var(--primary)" fill="url(#aH2)" strokeWidth={2.5} />
                    <Area type="monotone" dataKey="vibration" stroke="var(--cyan)" fill="transparent" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-border bg-card shadow-sm">
              <CardHeader>
                <CardTitle className="text-base text-foreground">Top Failure Modes</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={failureModes} layout="vertical" margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis type="number" stroke="var(--muted-foreground)" fontSize={11} />
                    <YAxis type="category" dataKey="mode" stroke="var(--muted-foreground)" fontSize={11} width={100} />
                    <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12 }} />
                    <Bar dataKey="count" fill="var(--cyan)" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="border-border bg-card shadow-sm lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base text-foreground">Maintenance Activity Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="relative space-y-5 border-l border-border pl-6">
                  {timeline.map((t, i) => (
                    <li key={i} className="relative">
                      <span className={`absolute -left-[29px] top-1 grid h-5 w-5 place-items-center rounded-full border ${toneStyle[t.tone]}`}>
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      </span>
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="text-sm font-medium text-foreground">{t.title}</div>
                        <Badge variant="outline" className={`text-[10px] ${toneStyle[t.tone]}`}>{t.tag}</Badge>
                      </div>
                      <div className="mt-0.5 text-[11px] text-muted-foreground">{t.date} · {t.note}</div>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>

            <Card className="border-primary/30 bg-gradient-to-br from-primary/10 via-card to-cyan/10 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base text-foreground">
                  <Sparkles className="h-4 w-4 text-primary" />Predictive Recommendation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-foreground/85">
                  Berdasarkan tren vibrasi & suhu 14 hari terakhir, lakukan{" "}
                  <span className="font-semibold text-primary">preventive cleaning</span> dalam 7 hari.
                </p>
                <div className="rounded-xl border border-border bg-card/70 p-3">
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Estimated impact</div>
                  <div className="mt-1 text-sm font-medium text-foreground">+12% asset lifetime · −Rp 3,2 jt biaya tahunan</div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[{ k: "Uptime", v: "98.2%" }, { k: "MTBF", v: "640h" }, { k: "MTTR", v: "2.1h" }].map((m) => (
                    <div key={m.k} className="rounded-lg border border-border bg-card p-2">
                      <div className="text-[10px] uppercase text-muted-foreground">{m.k}</div>
                      <div className="text-sm font-semibold text-foreground">{m.v}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}