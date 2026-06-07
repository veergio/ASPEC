"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Gauge, Boxes, Timer, ArrowUpRight, CheckCircle2, AlertTriangle, Zap, FileBarChart2, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { motion } from "framer-motion";
import { SkeletonCard } from "@/components/ui/skeleton-loading";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
  BarChart,
} from "recharts";

/* ─── Unified Color Palette ─── */
const COLORS = {
  primary: "#4f46e5",   // indigo / chart-1
  accent: "#f97316",    // orange / chart-2
  success: "#10b981",   // green  / chart-3
  warning: "#f59e0b",   // amber  / chart-4
  cyan: "#06b6d4",      // cyan   / chart-5
  critical: "#ef4444",  // red
};

// Ordered palette for bar cells to cycle through
const BAR_PALETTE = [
  COLORS.primary,
  COLORS.cyan,
  COLORS.accent,
  COLORS.success,
  COLORS.warning,
  COLORS.critical,
];

const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

const TOOLTIP_STYLE: React.CSSProperties = {
  backgroundColor: "hsl(var(--card))",
  borderColor: "hsl(var(--border))",
  borderRadius: "10px",
  color: "hsl(var(--foreground))",
  fontSize: "12px",
  boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
};

/* ─── Types ─── */
interface SummaryData {
  total: number;
  healthy: number;
  warning: number;
  critical: number;
  avg_rul: number;
}

interface ClusterData {
  clusterId: number;
  jenis: string;
  penyebab: string;
  sparePart: string;
  biaya: number;
  frequency: number;
  asset_type: string;
}

interface MonthlyTrend {
  month: string;
  tickets: number;
  total_cost: number;
}

interface CategoryDist {
  category: string;
  count: number;
}

interface DashboardData {
  summary: SummaryData;
  clusters: ClusterData[];
  monthlyTrend: MonthlyTrend[];
  categoryDist: CategoryDist[];
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    async function fetchDashboard() {
      try {
        const res = await fetch("/api/dashboard");
        const json = await res.json();
        if (json.success) {
          setData({
            summary: json.summary,
            clusters: json.clusters,
            monthlyTrend: json.monthlyTrend || [],
            categoryDist: json.categoryDist || [],
          });
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  /* ─── Loading Skeleton ─── */
  if (loading || !data) {
    return (
      <div className="space-y-6">
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
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5 mt-6">
          <Card className="lg:col-span-2 border-border bg-card h-[400px] animate-pulse" />
          <Card className="lg:col-span-3 border-border bg-card h-[400px] animate-pulse" />
        </div>
        <Card className="border-border bg-card h-[360px] animate-pulse mt-6" />
        <Card className="border-border bg-card h-[420px] animate-pulse mt-6" />
      </div>
    );
  }

  const { summary, clusters, monthlyTrend, categoryDist } = data;

  /* ─── Summary card configs ─── */
  const summaryItems = [
    { label: "Total Active Assets", value: String(summary.total), delta: "Live monitoring · real-time", icon: Boxes, accent: "text-primary", ring: "from-primary/60 via-primary/30 to-transparent", glow: "bg-primary/10" },
    { label: "Healthy Assets", value: String(summary.healthy || 0), delta: "Operating within normal range", icon: CheckCircle2, accent: "text-success", ring: "from-success/60 via-success/30 to-transparent", glow: "bg-success/10" },
    { label: "Warning Assets", value: String(summary.warning || 0), delta: "Monitor closely · degradation detected", icon: AlertTriangle, accent: "text-warning", ring: "from-warning/60 via-warning/30 to-transparent", glow: "bg-warning/10" },
    { label: "Critical Assets", value: String(summary.critical || 0), delta: "Immediate action required", icon: Zap, accent: "text-critical", ring: "from-critical/60 via-critical/30 to-transparent", glow: "bg-critical/10" },
    { label: "Average Asset RUL", value: `${(Number(summary.avg_rul) || 0).toFixed(1)} yr`, delta: "Fleet mean · ML predicted", icon: Timer, accent: "text-cyan", ring: "from-cyan/60 via-cyan/30 to-transparent", glow: "bg-cyan/10" },
  ];

  /* ─── Chart data ─── */
  const healthChartData = [
    { name: "Healthy", value: Number(summary.healthy || 0), color: COLORS.success },
    { name: "Warning", value: Number(summary.warning || 0), color: COLORS.warning },
    { name: "Critical", value: Number(summary.critical || 0), color: COLORS.critical },
  ];

  const clusterChartData = clusters.map((c) => ({
    name: c.asset_type,
    Frequency: c.frequency,
    Cost: c.biaya,
    Damage: c.jenis,
  }));

  const trendChartData = monthlyTrend.map((m) => {
    const [y, mo] = m.month.split("-");
    const shortLabel = new Date(Number(y), Number(mo) - 1).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    return { month: shortLabel, Tickets: m.tickets, Cost: Number(m.total_cost) };
  });

  const categoryChartData = categoryDist.map((c) => ({
    name: c.category,
    count: c.count,
  }));

  /* ─── Motion ─── */
  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04, duration: 0.2 } } };
  const item = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.2 } } };

  /* ─── Render ─── */
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
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

      {/* ═══ Summary Cards ═══ */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {summaryItems.map((s) => (
          <motion.div key={s.label} variants={item}>
            <Card className="relative h-full overflow-hidden border-border bg-card shadow-[var(--shadow-card)]">
              <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${s.ring}`} />
              <CardContent className="p-5 h-full flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</p>
                    <p className="mt-2 text-3xl font-semibold text-foreground">{s.value}</p>
                    <p className={`mt-1 text-xs ${s.accent}`}>{s.delta}</p>
                  </div>
                  <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${s.glow} ${s.accent}`}>
                    <s.icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* ═══ Row 1: Health Donut + NLP Cluster Composed ═══ */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Health Donut */}
        <motion.div variants={item} className="lg:col-span-2 h-full">
          <Card className="border-border bg-card shadow-[var(--shadow-card)] h-[430px] flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold tracking-wide text-foreground">Asset Health Distribution</CardTitle>
              <p className="text-xs text-muted-foreground">Persentase kondisi aset aktif dalam sistem monitoring</p>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col items-center justify-center">
              {mounted ? (
                <div className="w-full h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={healthChartData} cx="50%" cy="45%" innerRadius={65} outerRadius={85} paddingAngle={5} dataKey="value">
                        {healthChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        formatter={(value, entry: any) => (
                          <span className="text-xs text-muted-foreground font-medium px-1">
                            {value} ({entry.payload.value} unit)
                          </span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-xs text-muted-foreground">Loading chart...</div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* NLP Cluster Composed Chart */}
        <motion.div variants={item} className="lg:col-span-3 h-full">
          <Card className="border-border bg-card shadow-[var(--shadow-card)] h-[430px] flex flex-col">
            <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle className="text-sm font-semibold tracking-wide text-foreground">NLP Cluster Cost & Frequency</CardTitle>
                <p className="text-xs text-muted-foreground">Frekuensi keluhan (bar) vs biaya rata-rata (line)</p>
              </div>
              <Link
                href="/clusters"
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/50 px-3 py-1.5 text-xs text-muted-foreground transition hover:text-foreground hover:bg-muted"
              >
                <FileBarChart2 className="h-3.5 w-3.5" />
                View Clusters <ArrowUpRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col items-center justify-center pr-4">
              {mounted ? (
                <div className="w-full h-[320px] mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={clusterChartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} />
                      <YAxis
                        yAxisId="left"
                        stroke={COLORS.primary}
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        label={{ value: "Frequency", angle: -90, position: "insideLeft", offset: 0, style: { fontSize: 10, fill: COLORS.primary } }}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        stroke={COLORS.accent}
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => `${(v / 1e6).toFixed(1)}M`}
                        label={{ value: "Avg Cost (IDR)", angle: 90, position: "insideRight", offset: 0, style: { fontSize: 10, fill: COLORS.accent } }}
                      />
                      <Tooltip
                        contentStyle={TOOLTIP_STYLE}
                        formatter={(value: any, name: string) => {
                          if (name === "Cost") return [rupiah(value), "Avg Cost"];
                          if (name === "Frequency") return [`${value} logs`, "Frequency"];
                          return [value, name];
                        }}
                        labelFormatter={(label, items) => {
                          const d = items[0]?.payload;
                          return `${label} — ${d?.Damage || "N/A"}`;
                        }}
                      />
                      <Bar yAxisId="left" dataKey="Frequency" fill={COLORS.primary} radius={[4, 4, 0, 0]} barSize={28} />
                      <Line yAxisId="right" type="monotone" dataKey="Cost" stroke={COLORS.accent} strokeWidth={2.5} dot={{ r: 4, strokeWidth: 2, fill: COLORS.accent }} activeDot={{ r: 6 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[320px] flex items-center justify-center text-xs text-muted-foreground">Loading chart...</div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ═══ Row 2: Monthly Maintenance Trend ═══ */}
      <motion.div variants={item}>
        <Card className="border-border bg-card shadow-[var(--shadow-card)] overflow-hidden">
          <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-semibold tracking-wide text-foreground">Maintenance Activity Trend</CardTitle>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Jumlah tiket maintenance & total biaya perbaikan per bulan</p>
            </div>
            <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
              {trendChartData.length} months tracked
            </Badge>
          </CardHeader>
          <CardContent className="pr-4">
            {mounted && trendChartData.length > 0 ? (
              <div className="w-full h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendChartData}>
                    <defs>
                      <linearGradient id="gradTickets" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradCost" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.accent} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={COLORS.accent} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} />
                    <YAxis
                      yAxisId="left"
                      stroke={COLORS.primary}
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      label={{ value: "Tickets", angle: -90, position: "insideLeft", offset: 0, style: { fontSize: 10, fill: COLORS.primary } }}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke={COLORS.accent}
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `${(v / 1e6).toFixed(0)}M`}
                      label={{ value: "Cost (IDR)", angle: 90, position: "insideRight", offset: 0, style: { fontSize: 10, fill: COLORS.accent } }}
                    />
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      formatter={(value: any, name: string) => {
                        if (name === "Cost") return [rupiah(value), "Total Cost"];
                        return [`${value} tickets`, "Tickets"];
                      }}
                    />
                    <Area yAxisId="left" type="monotone" dataKey="Tickets" stroke={COLORS.primary} strokeWidth={2} fillOpacity={1} fill="url(#gradTickets)" dot={false} activeDot={{ r: 4 }} />
                    <Area yAxisId="right" type="monotone" dataKey="Cost" stroke={COLORS.accent} strokeWidth={2} fillOpacity={1} fill="url(#gradCost)" dot={false} activeDot={{ r: 4 }} />
                    <Legend
                      verticalAlign="top"
                      height={30}
                      formatter={(value) => <span className="text-xs text-muted-foreground font-medium px-1">{value}</span>}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-xs text-muted-foreground">No maintenance trend data</div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ═══ Row 3: Assets by Category (full-width) ═══ */}
      <motion.div variants={item}>
        <Card className="border-border bg-card shadow-[var(--shadow-card)] overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Boxes className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-semibold tracking-wide text-foreground">Assets by Category</CardTitle>
            </div>
            <p className="text-xs text-muted-foreground">Distribusi jumlah aset aktif berdasarkan kategori</p>
          </CardHeader>
          <CardContent className="flex flex-col justify-center">
            {mounted && categoryChartData.length > 0 ? (
              <div className="w-full h-[380px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryChartData} layout="vertical" margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={180}
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      formatter={(value: any) => [`${value} assets`, "Count"]}
                    />
                    <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={18}>
                      {categoryChartData.map((_, i) => (
                        <Cell key={i} fill={BAR_PALETTE[i % BAR_PALETTE.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[380px] flex items-center justify-center text-xs text-muted-foreground">No category data</div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}