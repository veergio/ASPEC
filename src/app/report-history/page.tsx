"use client";
import { useState, useMemo } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Search, FileText, Eye, Calendar, Wrench, Wallet, Hash } from "lucide-react";

type Report = {
  id: string;
  asset: string;
  date: string;
  issue: string;
  cost: number;
  status: string;
  technician?: string;
  notes?: string;
};

const reports: Report[] = [
  { id: "RPT-2026-0418", asset: "Compressor C-204", date: "10 May 2026", issue: "Bearing overheat", cost: 24500000, status: "Disetujui" },
  { id: "RPT-2026-0417", asset: "Pump P-118", date: "08 May 2026", issue: "Vibration drift", cost: 8900000, status: "Disetujui" },
  { id: "RPT-2026-0416", asset: "Conveyor CV-7", date: "05 May 2026", issue: "Belt tensioning", cost: 3200000, status: "Disetujui" },
  { id: "RPT-2026-0415", asset: "Robot Arm R-15", date: "03 May 2026", issue: "Servo calibration", cost: 5400000, status: "Review" },
  { id: "RPT-2026-0414", asset: "Generator G-09", date: "01 May 2026", issue: "Oil change & filter", cost: 6700000, status: "Disetujui" },
  { id: "RPT-2026-0413", asset: "Boiler B-02", date: "28 Apr 2026", issue: "Pressure relief test", cost: 2100000, status: "Disetujui" },
].map((r) => ({
  ...r,
  technician: "Budi S.",
  notes: "Pemeriksaan menyeluruh dilakukan, komponen utama diperiksa dan dibersihkan. Tidak ditemukan kerusakan lanjutan.",
}));

const statusStyle: Record<string, string> = {
  Disetujui: "border-success/40 bg-success/10 text-success",
  Review: "border-warning/40 bg-warning/10 text-warning",
};

const rupiah = (n: number) => new Intl.NumberFormat("id-ID").format(n);

export default function ReportHistoryPage() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Report | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return reports;
    return reports.filter(
      (r) =>
        r.asset.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q) ||
        r.issue.toLowerCase().includes(q) ||
        r.status.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <div>
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
                placeholder="Cari berdasarkan aset, ID, atau jenis masalah…"
                className="h-9 pl-9 bg-background/60"
              />
            </div>
            <div className="text-xs text-muted-foreground">
              {filtered.length} dari {reports.length} laporan
            </div>
          </div>

          <div className="divide-y divide-border">
            {filtered.length === 0 && (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Tidak ada laporan yang cocok dengan pencarian Anda.
              </div>
            )}
            {filtered.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center gap-4 p-4">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-[220px]">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{r.asset}</span>
                    <span className="text-[11px] text-muted-foreground">#{r.id}</span>
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
                <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 p-3">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant="outline" className={statusStyle[selected.status]}>{selected.status}</Badge>
                </div>
                <div className="rounded-lg border border-border bg-muted/40 p-3">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">Catatan Teknisi</div>
                  <div className="mt-1 text-foreground">{selected.notes}</div>
                  <div className="mt-2 text-xs text-muted-foreground">Teknisi: {selected.technician}</div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}