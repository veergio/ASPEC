"use client";
import { useState, useMemo, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Search, FileText, Eye, Calendar, Wrench, Wallet, Hash, ShieldAlert, Settings } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton-loading";

type Report = {
  id: string;
  asset: string;
  date: string;
  issue: string;
  cost: number;
  status: string;
  technician?: string;
  notes?: string;
  severity?: string;
  parts?: string;
  plannedDate?: string;
  startedDate?: string;
  completedDate?: string;
};

const statusStyle: Record<string, string> = {
  Disetujui: "border-success/40 bg-success/10 text-success",
  Review: "border-warning/40 bg-warning/10 text-warning",
};

const severityStyle: Record<string, string> = {
  Low: "border-cyan/40 bg-cyan/10 text-cyan",
  Medium: "border-warning/40 bg-warning/10 text-warning",
  High: "border-critical/40 bg-critical/10 text-critical",
  Critical: "border-critical bg-critical/20 text-critical font-bold",
};

const rupiah = (n: number) => new Intl.NumberFormat("id-ID").format(n);

export default function ReportHistoryPage() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Report | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    async function loadReports() {
      try {
        const res = await fetch("/api/maintenance");
        if (!res.ok) throw new Error("Failed to fetch");
        const json = await res.json();
        if (json.success && json.data) {
          const mapped = json.data.map((r: any) => ({
            id: `RPT-${String(r.ticket_id).padStart(4, "0")}`,
            asset: r.asset_name || "Aset Tidak Dikenal",
            date: r.completed_date ? new Date(r.completed_date).toLocaleDateString("id-ID", {
              day: "numeric", month: "short", year: "numeric",
            }) : (r.started_date ? `Mulai: ${new Date(r.started_date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}` : "Rencana"),
            issue: r.issue_type || "Tidak ada keluhan",
            cost: r.repair_cost ? Number(r.repair_cost) : 0,
            status: r.completed_date ? "Disetujui" : "Review",
            technician: r.technician_name || "Teknisi",
            notes: r.root_cause || "—",
            severity: r.severity || "Low",
            parts: r.spare_parts_used || "—",
            plannedDate: r.planned_date,
            startedDate: r.started_date,
            completedDate: r.completed_date,
          }));
          setReports(mapped);
        }
      } catch (err) {
        console.error(err);
        setError("Gagal memuat riwayat laporan.");
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let result = reports;
    if (q) {
      result = reports.filter(
        (r) =>
          r.asset.toLowerCase().includes(q) ||
          r.id.toLowerCase().includes(q) ||
          r.issue.toLowerCase().includes(q) ||
          r.status.toLowerCase().includes(q) ||
          (r.severity && r.severity.toLowerCase().includes(q))
      );
    }
    return result;
  }, [query, reports]);

  // Pagination logic
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedReports = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage, itemsPerPage]);

  // Reset to page 1 when query or itemsPerPage changes
  useEffect(() => {
    setCurrentPage(1);
  }, [query, itemsPerPage]);

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
    <motion.div variants={container} initial="hidden" animate="show">
      <PageHeader
        title="Riwayat Laporan"
        subtitle="Daftar laporan pemeliharaan yang telah Anda kirimkan."
      />

      <Card className="border-border bg-card">
        <CardContent className="p-0">
          <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari berdasarkan aset, ID, tingkat keparahan, atau jenis masalah…"
                className="h-9 pl-9 bg-background/60"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground whitespace-nowrap">Baris per halaman:</span>
              <Select
                value={String(itemsPerPage)}
                onValueChange={(v) => setItemsPerPage(Number(v))}
              >
                <SelectTrigger className="h-8 w-[70px] text-xs">
                  <SelectValue placeholder={itemsPerPage} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="1000">1000</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-xs text-muted-foreground">
              {filtered.length} dari {reports.length} laporan
            </div>
          </div>

          <div className="divide-y divide-border">
            {loading && (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex flex-wrap items-center gap-4 p-4">
                  <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
                  <div className="flex-1 min-w-[220px] space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-60" />
                  </div>
                  <div className="text-right space-y-2">
                    <Skeleton className="h-4 w-24 ml-auto" />
                    <Skeleton className="h-5 w-16 ml-auto rounded-full" />
                  </div>
                  <Skeleton className="h-8 w-20 rounded-md" />
                </div>
              ))
            )}
            {error && (
              <div className="p-8 text-center text-sm text-critical">
                {error}
              </div>
            )}
            {!loading && !error && filtered.length === 0 && (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Tidak ada laporan yang cocok dengan pencarian Anda.
              </div>
            )}
            {!loading && !error && paginatedReports.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center gap-4 p-4">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-[220px]">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{r.asset}</span>
                    <span className="text-[11px] text-muted-foreground">#{r.id}</span>
                    {r.severity && (
                      <Badge variant="outline" className={`text-[10px] py-0 px-1.5 ${severityStyle[r.severity] || ""}`}>
                        {r.severity}
                      </Badge>
                    )}
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">{r.date} • {r.issue}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-foreground tabular-nums">Rp {rupiah(r.cost)}</div>
                  <Badge variant="outline" className={`mt-1 ${statusStyle[r.status]}`}>{r.status}</Badge>
                </div>
                <Button size="sm" variant="outline" className="border-border" onClick={() => setSelected(r)}>
                  <Eye className="mr-2 h-3.5 w-3.5" /> Detail
                </Button>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="border-t border-border p-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage((p) => Math.max(1, p - 1));
                      }}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>

                  {/* Simple page numbers */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => {
                      // Show current page, first, last, and neighbors
                      return (
                        p === 1 ||
                        p === totalPages ||
                        Math.abs(p - currentPage) <= 1
                      );
                    })
                    .map((p, i, arr) => {
                      const elements = [];
                      if (i > 0 && p - arr[i - 1] > 1) {
                        elements.push(
                          <PaginationItem key={`ellipsis-${p}`}>
                            <span className="px-2 text-muted-foreground">...</span>
                          </PaginationItem>
                        );
                      }
                      elements.push(
                        <PaginationItem key={p}>
                          <PaginationLink
                            isActive={p === currentPage}
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentPage(p);
                            }}
                            className="cursor-pointer"
                          >
                            {p}
                          </PaginationLink>
                        </PaginationItem>
                      );
                      return elements;
                    })}

                  <PaginationItem>
                    <PaginationNext
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage((p) => Math.min(totalPages, p + 1));
                      }}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="sm:max-w-lg">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />{selected.asset}
                </DialogTitle>
                <DialogDescription>Detail laporan pemeliharaan</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                {[
                  { icon: Hash, label: "ID Laporan", value: selected.id },
                  { icon: Calendar, label: "Tanggal", value: selected.date },
                  { icon: Wrench, label: "Masalah", value: selected.issue },
                  { icon: Wallet, label: "Biaya", value: `Rp ${rupiah(selected.cost)}` },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-lg border border-border bg-muted/40 p-3">
                    <span className="inline-flex items-center gap-2 text-muted-foreground">
                      <item.icon className="h-3.5 w-3.5" />{item.label}
                    </span>
                    <span className="font-medium text-foreground">{item.value}</span>
                  </div>
                ))}

                {selected.severity && (
                  <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 p-3">
                    <span className="inline-flex items-center gap-2 text-muted-foreground">
                      <ShieldAlert className="h-3.5 w-3.5" />Keparahan (Severity)
                    </span>
                    <Badge variant="outline" className={severityStyle[selected.severity] || ""}>
                      {selected.severity}
                    </Badge>
                  </div>
                )}

                <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 p-3">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant="outline" className={statusStyle[selected.status]}>{selected.status}</Badge>
                </div>

                <div className="rounded-lg border border-border bg-muted/40 p-3">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">Catatan & Spare Part</div>
                  <div className="mt-1">
                    <span className="text-muted-foreground text-xs block">Akar Penyebab:</span>
                    <span className="text-foreground">{selected.notes}</span>
                  </div>
                  {selected.parts && (
                    <div className="mt-2 pt-2 border-t border-border/40">
                      <span className="text-muted-foreground text-xs block">Spare Part Diganti:</span>
                      <span className="text-foreground inline-flex items-center gap-1">
                        <Settings className="h-3 w-3 text-cyan shrink-0" />
                        {selected.parts}
                      </span>
                    </div>
                  )}
                  <div className="mt-3 text-[11px] text-muted-foreground">Teknisi: {selected.technician}</div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}