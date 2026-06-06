"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle, Wrench, Package, Wallet, MapPin, Gauge,
  TrendingUp, Activity, CheckCircle2, Zap, Cog, Calendar,
  Sparkles, ArrowUpRight, Thermometer, ChevronLeft, ChevronRight
} from "lucide-react";
import { AiChatbot } from "@/components/ai-chatbot";
import { motion } from "framer-motion";
import { PageLoadingScreen } from "@/components/ui/skeleton-loading";

type Condition = "Healthy" | "Warning" | "Critical";

interface ApiAsset {
  id: string | number;
  name: string;
  location: string;
  condition: string;
  rul: number;
  op_hours: number;
  instalation_date: string;
  category: string;
  dominant_damage: string | null;
  dominant_cause: string | null;
  dominant_spare_part: string | null;
  estimated_cost: number | null;
  recommendation_narrative: string | null;
}

interface ApiLog {
  ticket_id: string | number;
  asset_id: string | number;
  title: string;
  tag: string;
  note: string;
  completed_date: string;
}

interface Asset {
  id: string;
  name: string;
  location: string;
  health: number;
  rul: string;
  rulPct: number;
  condition: Condition;
  opHours: string;
  dominantDamage: string;
  dominantCause: string;
  dominantSparePart: string;
  estimatedCost: string;
  recommendationNarrative: string;
  rawRul: number;
}

interface TimelineEntry {
  date: string;
  title: string;
  tag: string;
  tone: string;
  note: string;
}

function getRulCondition(category: string, rul: number): Condition {
  // Kelompok 1: Safety & Security
  if (
    category === "Sistem Pemadam Kebakaran" ||
    category === "Sistem Proteksi Kebakaran Aktif" ||
    category === "Security Sistem"
  ) {
    if (rul <= 0.25) return "Critical";
    if (rul <= 1.0) return "Warning";
    return "Healthy";
  }

  // Kelompok 2: IT & Telecom
  if (
    category === "Sistem Telekomunikasi Gedung" ||
    category === "Pencatatan Meter"
  ) {
    if (rul <= 0.5) return "Critical";
    if (rul <= 2.0) return "Warning";
    return "Healthy";
  }

  // Kelompok 3: Core Operations (M&E)
  if (
    category === "Mechanical" ||
    category === "Electrical" ||
    category === "Ventilasi Sistem" ||
    category === "Sistem Transportasi Gedung" ||
    category === "Sistem Energi"
  ) {
    if (rul <= 1.0) return "Critical";
    if (rul <= 3.0) return "Warning";
    return "Healthy";
  }

  // Kelompok 4: Sipil & Plumbing
  if (
    category === "Civil" ||
    category === "Arsitektur" ||
    category === "Plumbing" ||
    category === "Distribusi Air"
  ) {
    if (rul <= 2.0) return "Critical";
    if (rul <= 5.0) return "Warning";
    return "Healthy";
  }

  // Kelompok 5: Lainnya
  if (category === "Latihan Balakar") {
    if (rul <= 0.5) return "Critical";
    if (rul <= 1.5) return "Warning";
    return "Healthy";
  }

  return "Healthy";
}

function formatRul(y: number): string {
  const isPast = y < 0;
  const absY = Math.abs(y);
  let yrs = Math.floor(absY);
  let mos = Math.round((absY - yrs) * 12);

  if (mos === 12) {
    yrs += 1;
    mos = 0;
  }

  let formatted = "";
  if (yrs === 0) formatted = `${mos} mo`;
  else if (mos === 0) formatted = `${yrs} yr`;
  else formatted = `${yrs} yr ${mos} mo`;

  if (isPast) {
    return `${formatted} longer`;
  }
  return formatted;
}

function formatCurrency(amount: number | null): string {
  if (amount == null) return "N/A";
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

function formatDate(iso: string): string {
  if (!iso) return "N/A";
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function severityTone(tag: string): string {
  const t = tag?.toLowerCase() ?? "";
  if (t.includes("healthy")) return "cyan";
  if (t.includes("warning")) return "warning";
  if (t.includes("critical")) return "critical";
  return "cyan";
}

function mapAsset(a: ApiAsset): Asset {
  // Calculate age in years based on installation date
  const installDate = a.instalation_date ? new Date(a.instalation_date) : new Date();
  const today = new Date();
  // Using 365 to align with SQL DATEDIFF logic
  const diffTime = Math.max(0, today.getTime() - installDate.getTime());
  const elapsedYears = diffTime / (1000 * 60 * 60 * 24 * 365);

  const remainingRulCalc = (a.rul || 0) - elapsedYears;
  const totalLifeYears = a.rul || 0;
  const healthPct = totalLifeYears > 0 ? Math.round((Math.max(0, remainingRulCalc) / totalLifeYears) * 100) : 0;

  return {
    id: String(a.id),
    name: a.name,
    location: a.location || "N/A",
    health: Math.min(healthPct, 100),
    rul: formatRul(remainingRulCalc),
    rulPct: Math.min(healthPct, 100),
    condition: getRulCondition(a.category, remainingRulCalc),
    opHours: `${a.op_hours?.toLocaleString("id-ID") ?? "0"}h`,
    dominantDamage: a.dominant_damage ?? "—",
    dominantCause: a.dominant_cause ?? "—",
    dominantSparePart: a.dominant_spare_part ?? "—",
    estimatedCost: formatCurrency(a.estimated_cost),
    recommendationNarrative: a.recommendation_narrative ?? "Tidak ada rekomendasi saat ini.",
    rawRul: remainingRulCalc,
  };
}

function mapLog(l: ApiLog): TimelineEntry {
  return {
    date: formatDate(l.completed_date),
    title: l.title,
    tag: l.tag,
    tone: severityTone(l.tag),
    note: l.note,
  };
}

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
  const [assets, setAssets] = useState<Asset[]>([]);
  const [allLogs, setAllLogs] = useState<ApiLog[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/assets/details");
        if (!res.ok) throw new Error("Failed to fetch");
        const { assets: raw, logs }: { assets: ApiAsset[]; logs: ApiLog[] } =
          await res.json();
        const mapped = raw.map(mapAsset);
        
        // Sorting logic: Critical (RUL >= 0) > Warning (RUL >= 0) > Healthy (RUL >= 0) > Critical (RUL < 0) > Warning (RUL < 0) > Healthy (RUL < 0)
        mapped.sort((a, b) => {
          const getRank = (asset: Asset) => {
            if (asset.rawRul >= 0) {
              if (asset.condition === "Critical") return 1;
              if (asset.condition === "Warning") return 2;
              if (asset.condition === "Healthy") return 3;
            } else {
              if (asset.condition === "Critical") return 4;
              if (asset.condition === "Warning") return 5;
              if (asset.condition === "Healthy") return 6;
            }
            return 7;
          };
          const rankA = getRank(a);
          const rankB = getRank(b);
          if (rankA !== rankB) return rankA - rankB;
          return a.rawRul - b.rawRul;
        });

        setAssets(mapped);
        setAllLogs(logs);
        if (mapped.length) setSelectedId(mapped[0].id);
      } catch (err) {
        setError("Gagal memuat data aset.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <PageLoadingScreen message="Memuat detail aset dan predictive insight..." />;
  }
  if (error || !assets.length) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center text-critical text-sm">
        {error ?? "Tidak ada data aset."}
      </div>
    );
  }

  const asset = assets.find((a) => a.id === selectedId) ?? assets[0];
  const ConditionIcon = conditionIcon[asset.condition];

  const timeline: TimelineEntry[] = allLogs
    .filter((l) => String(l.asset_id) === asset.id)
    .slice(0, 4)
    .map(mapLog);

  // Hitung index data untuk halaman saat ini
  const totalPages = Math.ceil(assets.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentAssets = assets.slice(indexOfFirstItem, indexOfLastItem);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="-m-4 min-h-[calc(100vh-4rem)] bg-background p-4 md:-m-8 md:p-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Asset Intelligence
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            Asset Details
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Deep-dive AI insight, maintenance intelligence, and lifecycle analytics.
          </p>
        </div>
        {/* <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
          <Sparkles className="mr-1 h-3 w-3" /> AI Insight Updated · Live
        </Badge> */}
      </div>

      <motion.div variants={item} className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <Card className="border-border bg-card shadow-sm lg:col-span-1 flex flex-col justify-between">
          <div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-foreground">Asset List</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 p-2">
              {currentAssets.map((a) => {
                const active = a.id === selectedId;
                const Icon = conditionIcon[a.condition];
                return (
                  <button
                    key={a.id}
                    onClick={() => setSelectedId(a.id)}
                    className={`w-full rounded-xl border p-3 text-left transition ${active
                      ? "border-primary/40 bg-primary/5 shadow-sm"
                      : "border-transparent hover:border-border hover:bg-muted/60"
                      }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium text-foreground">
                        {a.name}
                      </span>
                      <Badge
                        variant="outline"
                        className={`gap-1 text-[10px] ${conditionStyle[a.condition]}`}
                      >
                        <Icon className="h-3 w-3" />
                        {a.condition}
                      </Badge>
                    </div>
                    <div className="mt-1 text-[11px] text-muted-foreground">
                      {a.location}
                    </div>
                  </button>
                );
              })}
            </CardContent>
          </div>

          {/* Kontrol Paginasi Terintegrasi di bagian bawah sidebar list */}
          {totalPages > 1 && (
            <div className="p-3 border-t border-border flex items-center justify-between gap-2 bg-muted/20">
              <span className="text-[11px] text-muted-foreground font-medium">
                Hal {currentPage} dari {totalPages}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7 rounded-lg"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7 rounded-lg"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
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
                      {asset.id}
                      <span className="h-1 w-1 rounded-full bg-muted-foreground/50" />
                      Industrial Equipment
                    </div>
                    <h2 className="mt-1 text-2xl font-semibold text-foreground">
                      {asset.name}
                    </h2>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-4 w-4 text-primary" />
                        {asset.location}
                      </span>
                      {timeline[0] && (
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="h-4 w-4 text-cyan" />
                          Last service {timeline[0].date}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={`gap-1.5 px-3 py-1.5 text-sm ${conditionStyle[asset.condition]}`}
                >
                  <ConditionIcon className="h-4 w-4" />
                  {asset.condition} Condition
                </Badge>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                {[
                  {
                    label: "Asset Health",
                    value: `${asset.health}`,
                    unit: "%",
                    progress: asset.health,
                    icon: Gauge,
                    color: "text-primary",
                    sub: undefined,
                  },
                  {
                    label: "Remaining Useful Life",
                    value: asset.rul,
                    unit: "",
                    progress: asset.rulPct,
                    icon: TrendingUp,
                    color: "text-cyan",
                    sub: undefined,
                  },
                  {
                    label: "Operating Hours",
                    value: asset.opHours,
                    unit: "",
                    progress: null,
                    icon: Activity,
                    color: "text-primary",
                    sub: "Since last overhaul",
                  },
                ].map((m) => (
                  <div
                    key={m.label}
                    className="rounded-2xl border border-border bg-muted/50 p-4"
                  >
                    <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                      <span>{m.label}</span>
                      <m.icon className={`h-4 w-4 ${m.color}`} />
                    </div>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-3xl font-semibold text-foreground">
                        {m.value}
                      </span>
                      {m.unit && (
                        <span className="text-sm text-muted-foreground">{m.unit}</span>
                      )}
                    </div>
                    {m.progress !== null ? (
                      <Progress
                        value={m.progress}
                        className="mt-3 h-2 bg-secondary [&>div]:bg-gradient-to-r [&>div]:from-primary [&>div]:to-cyan"
                      />
                    ) : (
                      <div className="mt-3 text-[11px] text-muted-foreground">
                        {m.sub}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <motion.div variants={item}>
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                Smart Damage History — AI Insight
              </h3>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  label: "Most Frequent Complaint",
                  value: asset.dominantDamage,
                  sub: "Root complaint",
                  hint: "Dari data NLP cluster terbaru",
                  icon: Thermometer,
                  tone: "warning",
                },
                {
                  label: "Main Failure Cause",
                  value: asset.dominantCause,
                  sub: "Root cause utama",
                  hint: "Berdasarkan analisis log historis",
                  icon: Wrench,
                  tone: "critical",
                },
                {
                  label: "Most Replaced Spare Part",
                  value: asset.dominantSparePart,
                  sub: "Suku cadang utama",
                  hint: "Berdasarkan frekuensi penggantian",
                  icon: Package,
                  tone: "cyan",
                },
                {
                  label: "Average Maintenance Cost",
                  value: asset.estimatedCost,
                  sub: "per intervensi (estimasi)",
                  hint: "Dari data biaya cluster NLP",
                  icon: Wallet,
                  tone: "success",
                },
              ].map((s) => (
                <Card
                  key={s.label}
                  className="border-border bg-card shadow-sm transition hover:shadow-md"
                >
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div
                        className={`grid h-10 w-10 place-items-center rounded-xl border ${toneStyle[s.tone]}`}
                      >
                        <s.icon className="h-5 w-5" />
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="mt-4 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      {s.label}
                    </div>
                    <div className="mt-1 text-lg font-semibold text-foreground">
                      {s.value}
                    </div>
                    <div className="text-[11px] text-muted-foreground">{s.sub}</div>
                    <div className="mt-3 rounded-lg bg-muted/60 px-2.5 py-1.5 text-[11px] text-foreground/80">
                      {s.hint}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>

          <motion.div variants={item} className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="border-border bg-card shadow-sm lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base text-foreground">
                  Maintenance Activity History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {timeline.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Belum ada riwayat maintenance untuk aset ini.
                  </p>
                ) : (
                  <ol className="relative space-y-5 border-l border-border pl-6">
                    {timeline.map((t, i) => (
                      <li key={i} className="relative">
                        <span
                          className={`absolute -left-[29px] top-1 grid h-5 w-5 place-items-center rounded-full border ${toneStyle[t.tone]}`}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        </span>
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="text-sm font-medium text-foreground">
                            {t.title}
                          </div>
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${toneStyle[t.tone]}`}
                          >
                            {t.tag}
                          </Badge>
                        </div>
                        <div className="mt-0.5 text-[11px] text-muted-foreground">
                          {t.date} · {t.note}
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </CardContent>
            </Card>

            <Card className="border-primary/30 bg-gradient-to-br from-primary/10 via-card to-cyan/10 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base text-foreground">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Predictive Recommendation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-foreground/85">
                  {asset.recommendationNarrative}
                </p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    { k: "RUL", v: asset.rul },
                    { k: "Condition", v: asset.condition },
                    { k: "Op Hours", v: asset.opHours },
                  ].map((m) => (
                    <div
                      key={m.k}
                      className="rounded-lg border border-border bg-card p-2"
                    >
                      <div className="text-[10px] uppercase text-muted-foreground">
                        {m.k}
                      </div>
                      <div className="text-sm font-semibold text-foreground">
                        {m.v}
                      </div>
                    </div>
                  ))}
                </div>
                <AiChatbot assetId={Number(asset.id)} />
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>

    </motion.div>
  );
}
