"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Gauge, Boxes, Timer, ArrowUpRight, CheckCircle2, AlertTriangle, Zap, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { conditionStyle, type Cond } from "@/lib/assets-data";

const conditionIcon: Record<Cond, typeof CheckCircle2> = {
  Healthy: CheckCircle2,
  Warning: AlertTriangle,
  Critical: Zap,
};

const rupiah = (n: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

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
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{ summary: SummaryData; clusters: ClusterData[] } | null>(null);

  // State untuk Paginasi
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // Ubah angka ini untuk mengatur jumlah baris per halaman

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch("/api/dashboard");
        const json = await res.json();
        if (json.success) {
          setData({
            summary: json.summary,
            clusters: json.clusters
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

  if (loading || !data) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center text-muted-foreground text-sm">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Memuat telemetry data…
      </div>
    );
  }

  const { summary, clusters } = data;

  // Logika Pemotongan Data Paginasi
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentClusters = clusters.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(clusters.length / itemsPerPage);

  const summaryItems = [
    { label: "Total Active Assets", value: String(summary.total), delta: "Live monitoring · real-time", icon: Boxes, accent: "text-primary", ring: "from-primary/60 via-primary/30 to-transparent", glow: "bg-primary/10" },
    { label: "Healthy Assets", value: String(summary.healthy || 0), delta: "Operating within normal range", icon: CheckCircle2, accent: "text-success", ring: "from-success/60 via-success/30 to-transparent", glow: "bg-success/10" },
    { label: "Warning Assets", value: String(summary.warning || 0), delta: "Monitor closely · degradation detected", icon: AlertTriangle, accent: "text-warning", ring: "from-warning/60 via-warning/30 to-transparent", glow: "bg-warning/10" },
    { label: "Critical Assets", value: String(summary.critical || 0), delta: "Immediate action required", icon: Zap, accent: "text-critical", ring: "from-critical/60 via-critical/30 to-transparent", glow: "bg-critical/10" },
    { label: "Average Asset RUL", value: `${(Number(summary.avg_rul) || 0).toFixed(1)} yr`, delta: "Fleet mean · ML predicted", icon: Timer, accent: "text-cyan", ring: "from-cyan/60 via-cyan/30 to-transparent", glow: "bg-cyan/10" },
  ];

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
        {summaryItems.map((s) => (
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
            <p className="text-xs text-muted-foreground">Cluster kerusakan teratas · diurutkan berdasarkan frekuensi</p>
          </div>
          <Link href="/assets" className="inline-flex items-center gap-1 rounded-full border border-border bg-background/60 px-3 py-1.5 text-xs text-muted-foreground transition hover:text-foreground">
            View all <ArrowUpRight className="h-3 w-3" />
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead>Jenis Kerusakan</TableHead>
                <TableHead>Penyebab</TableHead>
                <TableHead>Spare Part</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead className="pr-6 text-right">Biaya Perbaikan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentClusters.length === 0 ? (
                <TableRow className="border-border">
                  {/* Diubah dari 6 ke 5 kolom agar pas dengan struktur TableHead */}
                  <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                    Tidak ada data cluster saat ini.
                  </TableCell>
                </TableRow>
              ) : (
                currentClusters.map((c, i) => (
                  <TableRow key={i} className="border-border">
                    <TableCell className="text-foreground">{c.jenis}</TableCell>
                    <TableCell className="text-muted-foreground">{c.penyebab}</TableCell>
                    <TableCell className="text-muted-foreground">{c.sparePart}</TableCell>
                    <TableCell className="text-foreground">{c.frequency}</TableCell>
                    <TableCell className="pr-6 text-right font-medium text-foreground">{rupiah(Number(c.biaya) || 0)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Kontrol Navigasi Paginasi */}
          {clusters.length > itemsPerPage && (
            <div className="flex items-center justify-between border-t border-border px-6 py-4">
              <div className="text-xs text-muted-foreground">
                Showing <span className="font-medium text-foreground">{indexOfFirstItem + 1}</span> to{' '}
                <span className="font-medium text-foreground">
                  {indexOfLastItem > clusters.length ? clusters.length : indexOfLastItem}
                </span>{' '}
                of <span className="font-medium text-foreground">{clusters.length}</span> clusters
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition hover:text-foreground disabled:opacity-40 disabled:hover:text-muted-foreground"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <div className="text-xs text-muted-foreground px-2">
                  Page <span className="font-medium text-foreground">{currentPage}</span> of {totalPages}
                </div>

                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition hover:text-foreground disabled:opacity-40 disabled:hover:text-muted-foreground"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}