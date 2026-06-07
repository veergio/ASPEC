"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sparkles, Calendar, ChevronLeft, ChevronRight,
  Search, FileBarChart2, Thermometer, Wrench, Package, Wallet,
  Activity, Zap, CheckCircle2, User, LayoutGrid, Clock
} from "lucide-react";
import { motion } from "framer-motion";
import { PageLoadingScreen } from "@/components/ui/skeleton-loading";
import { Input } from "@/components/ui/input";

const rupiah = (n: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

interface ClusteringRun {
  run_id: number;
  asset_type: string;
  best_k: number;
  silhouette_score: number;
  created_at: string;
}

interface Cluster {
  cluster_id: number;
  cluster_index: number;
  dominant_damage: string;
  dominant_cause: string;
  dominant_spare_part: string;
  average_cost: number;
  member_count: number;
}

interface ClusterLog {
  ticket_id: number;
  asset_id: number;
  asset_name: string;
  technician_name: string;
  title: string;
  tag: string;
  note: string;
  completed_date: string;
}

const toneStyle: Record<string, string> = {
  warning: "bg-warning/15 text-warning border-warning/30",
  success: "bg-success/15 text-success border-success/30",
  cyan: "bg-cyan/15 text-cyan border-cyan/30",
  critical: "bg-critical/15 text-critical border-critical/30",
};

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

export default function ClustersPage() {
  const [runs, setRuns] = useState<ClusteringRun[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<number | null>(null);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [selectedClusterId, setSelectedClusterId] = useState<number | null>(null);
  const [logs, setLogs] = useState<ClusterLog[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingClusters, setLoadingClusters] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterDate, setFilterDate] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    fetchRuns();
  }, [filterDate]);

  async function fetchRuns() {
    setLoading(true);
    try {
      const url = filterDate ? `/api/clusters?date=${filterDate}` : "/api/clusters";
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setRuns(json.runs);
        if (json.runs.length > 0) {
          setSelectedRunId(json.runs[0].run_id);
        } else {
          setSelectedRunId(null);
          setClusters([]);
          setSelectedClusterId(null);
          setLogs([]);
        }
      }
    } catch (error) {
      console.error("Failed to fetch runs", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (selectedRunId) {
      fetchClusters(selectedRunId);
    }
  }, [selectedRunId]);

  async function fetchClusters(runId: number) {
    setLoadingClusters(true);
    try {
      const res = await fetch(`/api/clusters?run_id=${runId}`);
      const json = await res.json();
      if (json.success) {
        setClusters(json.clusters);
        if (json.clusters.length > 0) {
          setSelectedClusterId(json.clusters[0].cluster_id);
        } else {
          setSelectedClusterId(null);
          setLogs([]);
        }
      }
    } catch (error) {
      console.error("Failed to fetch clusters", error);
    } finally {
      setLoadingClusters(false);
    }
  }

  useEffect(() => {
    if (selectedClusterId) {
      fetchLogs(selectedClusterId);
    }
  }, [selectedClusterId]);

  async function fetchLogs(clusterId: number) {
    setLoadingLogs(true);
    try {
      const res = await fetch(`/api/clusters?cluster_id=${clusterId}`);
      const json = await res.json();
      if (json.success) {
        setLogs(json.logs);
      }
    } catch (error) {
      console.error("Failed to fetch logs", error);
    } finally {
      setLoadingLogs(false);
    }
  }

  const filteredRuns = runs.filter(r =>
    r.asset_type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredRuns.length / itemsPerPage) || 1;
  const currentRuns = filteredRuns.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const selectedRun = runs.find(r => r.run_id === selectedRunId);

  if (loading && runs.length === 0) {
    return <PageLoadingScreen message="Memuat data kluster..." />;
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.04,
        duration: 0.2,
      }
    }
  };

  const item = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { duration: 0.2 } }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="-m-4 min-h-[calc(100vh-4rem)] bg-background p-4 md:-m-8 md:p-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Clustering Analysis
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            Cluster Complaints
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Analisis kluster otomatis terhadap log deskripsi keluhan dan riwayat penggantian spare part.
          </p>
        </div>
        <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
          <Sparkles className="mr-1 h-3 w-3" /> AI Model: NLP-KMeans · Active
        </Badge>
      </div>

      <motion.div variants={item} className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        {/* Sidebar: Asset Types */}
        <Card className="border-border bg-card shadow-sm lg:col-span-1 flex flex-col justify-between">
          <div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-foreground">Asset Types</CardTitle>
              {/* Mengubah space-y-2 menjadi flex dan space-x-2 agar sejajar ke samping */}
              <div className="mt-3 flex gap-2">
                {/* Input Cari */}
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Cari tipe aset..."
                    className="h-8 pl-8 text-xs w-full"
                  />
                </div>

                {/* Input Tanggal */}
                <div className="relative flex-1">
                  <Calendar className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="date"
                    value={filterDate}
                    onChange={(e) => {
                      setFilterDate(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="h-8 pl-8 text-xs w-full"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-1.5 p-2">
              {currentRuns.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground">
                  Tidak ada data tipe aset yang cocok.
                </div>
              ) : (
                currentRuns.map((r) => {
                  const active = r.run_id === selectedRunId;
                  return (
                    <button
                      key={r.run_id}
                      onClick={() => setSelectedRunId(r.run_id)}
                      className={`w-full rounded-xl border p-3 text-left transition ${active
                        ? "border-primary/40 bg-primary/5 shadow-sm"
                        : "border-transparent hover:border-border hover:bg-muted/60"
                        }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium text-foreground">
                          {r.asset_type}
                        </span>
                        <Badge variant="secondary" className="text-[9px] px-1.5">
                          ID: {r.run_id}
                        </Badge>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>{formatDate(r.created_at)}</span>
                        <span>k={r.best_k}</span>
                      </div>
                    </button>
                  );
                })
              )}
            </CardContent>
          </div>

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

        {/* Main Content */}
        <div className="space-y-4 lg:col-span-3">
          {/* Header Card for Selected Run */}
          <Card className="overflow-hidden border-border bg-card shadow-sm">
            <div className="h-1.5 w-full bg-gradient-to-r from-primary via-cyan to-primary" />
            <CardContent className="p-6">
              {selectedRun ? (
                <div className="flex flex-wrap items-start justify-between gap-6">
                  <div className="flex items-start gap-4">
                    <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-primary to-cyan text-primary-foreground shadow-md">
                      <FileBarChart2 className="h-7 w-7" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Run ID: {selectedRun.run_id}
                        <span className="h-1 w-1 rounded-full bg-muted-foreground/50" />
                        Silhouette Score: {selectedRun.silhouette_score.toFixed(4)}
                      </div>
                      <h2 className="mt-1 text-2xl font-semibold text-foreground">
                        {selectedRun.asset_type}
                      </h2>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="h-4 w-4 text-primary" />
                          Generated on {formatDate(selectedRun.created_at)}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Activity className="h-4 w-4 text-cyan" />
                          Optimal Clusters: {selectedRun.best_k}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className="gap-1.5 px-3 py-1.5 text-sm border-primary/40 bg-primary/10 text-primary">
                    <CheckCircle2 className="h-4 w-4" /> Validated Run
                  </Badge>
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">Pilih tipe aset untuk melihat detail.</div>
              )}
            </CardContent>
          </Card>

          {/* Clusters Horizontal Scroll */}
          <motion.div variants={item}>
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                  Detected Clusters
                </h3>
              </div>
              <p className="text-[11px] text-muted-foreground italic">Scroll horizontal untuk melihat semua kluster</p>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
              {loadingClusters ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="min-w-[320px] h-[220px] rounded-2xl border border-border bg-muted animate-pulse" />
                ))
              ) : clusters.length === 0 ? (
                <div className="w-full py-12 border border-dashed border-border rounded-2xl text-center text-sm text-muted-foreground">
                  Tidak ada kluster ditemukan untuk tipe aset ini.
                </div>
              ) : (
                clusters.map((c) => {
                  const active = c.cluster_id === selectedClusterId;
                  return (
                    <button
                      key={c.cluster_id}
                      onClick={() => setSelectedClusterId(c.cluster_id)}
                      className={`min-w-[320px] flex-shrink-0 rounded-2xl border p-5 text-left transition relative overflow-hidden ${active
                        ? "border-primary bg-primary/5 shadow-md ring-1 ring-primary/20"
                        : "border-border bg-card hover:border-primary/40 hover:bg-muted/50"
                        }`}
                    >
                      {active && <div className="absolute top-0 right-0 h-16 w-16 bg-primary/10 rounded-bl-full flex items-start justify-end p-2"><CheckCircle2 className="h-4 w-4 text-primary" /></div>}
                      <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                        <span className="font-bold text-primary">Cluster #{c.cluster_index}</span>
                        <Badge variant="outline" className="text-[10px] bg-background">{c.member_count} logs</Badge>
                      </div>
                      <div className="mt-3 text-lg font-bold text-foreground line-clamp-1">
                        {c.dominant_damage}
                      </div>

                      <div className="mt-3 space-y-2">
                        <div className="flex items-center gap-2 text-[11px]">
                          <Wrench className="h-3 w-3 text-critical" />
                          <span className="text-muted-foreground">Cause:</span>
                          <span className="font-medium text-foreground truncate">{c.dominant_cause}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px]">
                          <Package className="h-3 w-3 text-cyan" />
                          <span className="text-muted-foreground">Part:</span>
                          <span className="font-medium text-foreground truncate">{c.dominant_spare_part}</span>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-[9px] uppercase font-bold text-muted-foreground">Avg. Cost</span>
                          <span className="text-sm font-bold text-foreground">{rupiah(c.average_cost)}</span>
                        </div>
                        <div className={`h-8 w-8 rounded-full border grid place-items-center ${active ? 'bg-primary text-white border-primary' : 'bg-muted/50 text-muted-foreground border-border'}`}>
                          <LayoutGrid className="h-4 w-4" />
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>

          {/* Maintenance Logs (Enhanced UI) */}
          <motion.div variants={item}>
            <Card className="border-border bg-card shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4">
                <div className="flex items-center gap-2">
                  <LayoutGrid className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle className="text-base text-foreground">
                      Cluster Members & Maintenance Logs
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">Detail riwayat perbaikan yang teridentifikasi dalam kluster ini</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="px-2 py-1 text-[10px] font-bold">
                    {logs.length} Total Entries
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {loadingLogs ? (
                  <div className="p-6 space-y-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />
                    ))}
                  </div>
                ) : logs.length === 0 ? (
                  <div className="py-20 flex flex-col items-center justify-center text-muted-foreground">
                    <Activity className="h-10 w-10 mb-2 opacity-20" />
                    <p className="text-sm">Pilih kluster untuk melihat log maintenance</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 divide-y divide-border/50">
                    {logs.map((t, i) => (
                      <div key={i} className="group p-5 hover:bg-muted/30 transition-colors">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge className={`text-[10px] uppercase font-bold tracking-tight ${toneStyle[severityTone(t.tag)]}`}>
                                {t.tag}
                              </Badge>
                              <span className="text-sm font-semibold text-foreground">{t.title}</span>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1.5 font-medium text-primary">
                                <LayoutGrid className="h-3.5 w-3.5" />
                                {t.asset_name} (ID: {t.asset_id})
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5" />
                                {formatDate(t.completed_date)}
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground/80 leading-relaxed max-w-3xl">
                              {t.note}
                            </p>
                          </div>

                          {/* Technician Card */}
                          <div className="flex items-center gap-3 bg-muted/50 border border-border/50 rounded-2xl p-3 pr-5 min-w-[200px]">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-cyan/20 border border-primary/20 flex items-center justify-center text-primary">
                              <User className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Technician</div>
                              <div className="text-sm font-bold text-foreground">{t.technician_name || "Unassigned"}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}
