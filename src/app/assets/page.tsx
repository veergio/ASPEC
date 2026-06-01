"use client";
import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Filter, Plus, Search, CheckCircle2, AlertTriangle, Zap, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

// 🔴 1. SINKRONISASI TIPE DATA DENGAN MARIADB
type Cond = "Critical" | "Major" | "Minor";
type Asset = {
  id: number;
  name: string;
  location: string;
  years: number | null; // Izinkan null jika belum di-update oleh model ML
  condition: Cond;
  rul: string;
};

function formatYears(y: number | null) {
  if (y === null) return "N/A (No Run)";
  return y < 1 ? `${Math.round(y * 12)} mo` : `${y.toFixed(1)} yr`;
}

// 🔴 2. PENYESUAIAN WARNA BADGE SESUAI STATUS DB RIIL
const conditionStyle: Record<Cond, string> = {
  Critical: "border-destructive/40 bg-destructive/10 text-destructive",
  Major: "border-warning/40 bg-warning/10 text-warning",
  Minor: "border-success/40 bg-success/10 text-success",
};

const conditionIcon: Record<Cond, typeof CheckCircle2> = {
  Critical: Zap,
  Major: AlertTriangle,
  Minor: CheckCircle2,
};

const ALL_CONDITIONS: Cond[] = ["Critical", "Major", "Minor"];

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loadingFetch, setLoadingFetch] = useState(true);
  const [queryStr, setQueryStr] = useState("");
  const [activeConditions, setActiveConditions] = useState<Cond[]>(ALL_CONDITIONS);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Pagination Server States
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Form States
  const [name, setName] = useState("");
  const [building, setBuilding] = useState("");
  const [floor, setFloor] = useState("");
  const [zone, setZone] = useState("");
  const [years, setYears] = useState("");
  const [criticalLevel, setCriticalLevel] = useState<Cond>("Minor"); // State input baru

  // Fetch Server Pagination Handler
  const fetchAssets = useCallback(async () => {
    setLoadingFetch(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
        search: queryStr,
        conditions: activeConditions.join(",") // Mengirim string "Critical,Major,Minor" ke API
      });

      const res = await fetch(`/api/assets?${params.toString()}`);
      const json = await res.json();

      if (json.success && json.data) {
        const mapped: Asset[] = json.data.map((item: any) => {
          const y = item.predicted_rul !== null ? Number(item.predicted_rul) : null;
          const locParts = [item.building, item.floor !== null ? `Fl. ${item.floor}` : null, item.zone].filter(Boolean);

          return {
            id: item.asset_id,
            name: item.asset_name,
            location: locParts.join(" · "),
            years: y,
            // 🔴 3. AMBIL LANGSUNG KONDISI DARI KOLOM CRITICAL_LEVEL DATABASE
            condition: (item.critical_level || "Minor") as Cond,
            rul: formatYears(y)
          };
        });
        setAssets(mapped);
        setTotalPages(json.pagination.totalPages || 1);
        setTotalItems(json.pagination.totalItems || 0);
      }
    } catch {
      toast.error("Gagal memuat data telemetry asset");
    } finally {
      setLoadingFetch(false);
    }
  }, [currentPage, limit, queryStr, activeConditions]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const handleSearchChange = (val: string) => {
    setQueryStr(val);
    setCurrentPage(1);
  };

  const toggleCondition = (c: Cond) => {
    setActiveConditions((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
    setCurrentPage(1);
  };

  const resetForm = () => {
    setName("");
    setBuilding("");
    setFloor("");
    setZone("");
    setYears("");
    setCriticalLevel("Minor");
  };

  const onAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const y = years ? Number(years) : null;
    if (!name.trim() || !building.trim()) {
      toast.error("Lengkapi semua field wajib dengan benar");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          asset_name: name,
          building,
          floor: floor ? Number(floor) : null,
          zone: zone || null,
          predicted_rul: y,
          critical_level: criticalLevel // Kirim level kekritisan yang dipilih
        })
      });
      const data = await res.json();

      if (data.success) {
        toast.success("Asset berhasil ditambahkan");
        fetchAssets();
        resetForm();
        setOpen(false);
      } else {
        toast.error(data.message || "Gagal menyimpan");
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Asset Monitoring"
        subtitle="Live operational status, remaining useful life, and ML maintenance forecasts."
        action={
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-primary to-cyan text-primary-foreground hover:opacity-90">
                <Plus className="mr-2 h-4 w-4" /> Add Asset
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Tambah Asset Baru</DialogTitle>
                <DialogDescription>
                  Masukkan koordinat penempatan asset untuk sinkronisasi monitoring dashboard ASPEC.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={onAdd} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="asset-name">Nama Asset</Label>
                  <Input id="asset-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="mis. PER-58KX-0009" required />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="building">Gedung</Label>
                    <Input id="building" value={building} onChange={(e) => setBuilding(e.target.value)} placeholder="Gedung A" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="floor">Lantai</Label>
                    <Input id="floor" type="number" value={floor} onChange={(e) => setFloor(e.target.value)} placeholder="2" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="zone">Zona / Bay</Label>
                    <Input id="zone" value={zone} onChange={(e) => setZone(e.target.value)} placeholder="Timur" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="asset-years">ML Predicted RUL (tahun)</Label>
                    <Input id="asset-years" type="number" step="0.1" min="0" value={years} onChange={(e) => setYears(e.target.value)} placeholder="Kosongkan jika NULL" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="critical-level">Critical Level</Label>
                    <Select value={criticalLevel} onValueChange={(val) => setCriticalLevel(val as Cond)}>
                      <SelectTrigger id="critical-level">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Minor">Minor</SelectItem>
                        <SelectItem value="Major">Major</SelectItem>
                        <SelectItem value="Critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" disabled={submitting} onClick={() => { resetForm(); setOpen(false); }}>Batal</Button>
                  <Button type="submit" disabled={submitting} className="bg-gradient-to-r from-primary to-cyan text-primary-foreground">
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Simpan Asset"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <Card className="border-border bg-card">
        <CardContent className="p-0">
          <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={queryStr}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Cari asset berdasarkan nama atau lokasi…"
                className="h-9 pl-9 bg-background/60"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="border-border">
                  <Filter className="mr-2 h-4 w-4" /> Filters
                  {activeConditions.length < ALL_CONDITIONS.length && (
                    <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-[10px]">
                      {activeConditions.length}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Kondisi</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {ALL_CONDITIONS.map((c) => (
                  <DropdownMenuCheckboxItem
                    key={c}
                    checked={activeConditions.includes(c)}
                    onCheckedChange={() => toggleCondition(c)}
                    onSelect={(e) => e.preventDefault()}
                  >
                    {c}
                  </DropdownMenuCheckboxItem>
                ))}
                <DropdownMenuSeparator />
                <button
                  type="button"
                  onClick={() => { setActiveConditions(ALL_CONDITIONS); setCurrentPage(1); }}
                  className="w-full px-2 py-1.5 text-left text-xs text-muted-foreground hover:text-foreground"
                >
                  Reset filter
                </button>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead>Asset Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Remaining Useful Life</TableHead>
                <TableHead className="text-right">Condition</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingFetch ? (
                <TableRow className="border-border hover:bg-transparent">
                  <TableCell colSpan={4} className="py-12 text-center text-sm text-muted-foreground">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-cyan" />
                    <span className="mt-2 block">Menghubungkan ke database telemetry...</span>
                  </TableCell>
                </TableRow>
              ) : assets.length === 0 ? (
                <TableRow className="border-border hover:bg-transparent">
                  <TableCell colSpan={4} className="py-12 text-center text-sm text-muted-foreground">
                    Tidak ada asset yang cocok dengan kriteria filter.
                  </TableCell>
                </TableRow>
              ) : (
                assets.map((a) => {
                  const Icon = conditionIcon[a.condition];
                  return (
                    <TableRow key={a.id} className="border-border">
                      <TableCell className="font-medium text-foreground">{a.name}</TableCell>
                      <TableCell className="text-muted-foreground">{a.location}</TableCell>
                      <TableCell className="text-muted-foreground">{a.rul}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className={`gap-1 rounded-full px-2.5 ${conditionStyle[a.condition]}`}>
                          <Icon className="h-3 w-3" />{a.condition}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between border-t border-border px-4 py-3 bg-card/50">
            <div className="text-xs text-muted-foreground">
              Showing <span className="font-medium text-foreground">{assets.length}</span> of{" "}
              <span className="font-medium text-foreground">{totalItems}</span> assets
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Rows per page:</span>
                <Select
                  value={limit.toString()}
                  onValueChange={(val) => {
                    setLimit(Number(val));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="h-8 w-[70px] border-border bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                    <SelectItem value="1000">1000</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="text-xs text-muted-foreground">
                Page <span className="font-medium text-foreground">{currentPage}</span> of{" "}
                <span className="font-medium text-foreground">{totalPages || 1}</span>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={currentPage === 1 || loadingFetch}
                  onClick={() => setCurrentPage((prev) => prev - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={currentPage === totalPages || totalPages === 0 || loadingFetch}
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}