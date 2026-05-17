"use client";
import Link from "next/link";
import { Gauge, Boxes, Timer, ArrowUpRight, CheckCircle2, AlertTriangle, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { assets, counts, conditionStyle, type Cond } from "@/lib/assets-data";

const conditionIcon: Record<Cond, typeof CheckCircle2> = {
  Healthy: CheckCircle2,
  Warning: AlertTriangle,
  Critical: Zap,
};

const summary = [
  { label: "Total Active Assets", value: String(assets.length), delta: "Across 4 plants · live monitoring", icon: Boxes, accent: "text-primary", ring: "from-primary/60 via-primary/30 to-transparent", glow: "bg-primary/10" },
  { label: "Healthy Assets", value: String(counts.Healthy), delta: "Operating within normal range", icon: CheckCircle2, accent: "text-success", ring: "from-success/60 via-success/30 to-transparent", glow: "bg-success/10" },
  { label: "Warning Assets", value: String(counts.Warning), delta: "Monitor closely · degradation detected", icon: AlertTriangle, accent: "text-warning", ring: "from-warning/60 via-warning/30 to-transparent", glow: "bg-warning/10" },
  { label: "Critical Assets", value: String(counts.Critical), delta: "Immediate action required", icon: Zap, accent: "text-critical", ring: "from-critical/60 via-critical/30 to-transparent", glow: "bg-critical/10" },
  { label: "Average Asset Lifetime", value: "6.4 yr", delta: "Fleet mean · +0.3 yr vs last quarter", icon: Timer, accent: "text-cyan", ring: "from-cyan/60 via-cyan/30 to-transparent", glow: "bg-cyan/10" },
];

const priorityAssets = assets.slice(0, 6);

export default function Dashboard() {
  return (
    <div>
      <PageHeader
        title="Operations Overview"
        subtitle="Real-time asset health, predictive insights, and maintenance intelligence."
        action={
          <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs text-muted-foreground">
            <Gauge className="h-3.5 w-3.5 text-cyan" />
            Last sync: just now
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {summary.map((s) => (
          <Card key={s.label} className="relative overflow-hidden border-border bg-card shadow-[var(--shadow-card)]">
            <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${s.ring}`} />
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</p>
                  <p className="mt-2 text-3xl font-semibold text-foreground">{s.value}</p>
                  <p className={`mt-1 text-xs ${s.accent}`}>{s.delta}</p>
                </div>
                <div className={`grid h-10 w-10 place-items-center rounded-xl ${s.glow} ${s.accent}`}>
                  <s.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6 border-border bg-card shadow-[var(--shadow-card)]">
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Smart Asset Priority</CardTitle>
            <p className="text-xs text-muted-foreground">Auto-sorted by shortest Remaining Useful Life · AI ranked</p>
          </div>
          <Link href="/assets" className="inline-flex items-center gap-1 rounded-full border border-border bg-background/60 px-3 py-1.5 text-xs text-muted-foreground transition hover:text-foreground">
            View all <ArrowUpRight className="h-3 w-3" />
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="pl-6">Asset Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Remaining Useful Life</TableHead>
                <TableHead className="pr-6 text-right">Condition</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {priorityAssets.map((a) => {
                const Icon = conditionIcon[a.condition];
                return (
                  <TableRow key={a.name} className="border-border">
                    <TableCell className="pl-6 font-medium text-foreground">{a.name}</TableCell>
                    <TableCell className="text-muted-foreground">{a.location}</TableCell>
                    <TableCell className="text-muted-foreground">{a.rul}</TableCell>
                    <TableCell className="pr-6 text-right">
                      <Badge variant="outline" className={`gap-1 rounded-full px-2.5 ${conditionStyle[a.condition]}`}>
                        <Icon className="h-3 w-3" />{a.condition}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}