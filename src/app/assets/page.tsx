"use client";
import { useMemo, useState } from "react";
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
import { Filter, Plus, Search, CheckCircle2, AlertTriangle, Zap } from "lucide-react";
import { toast } from "sonner";

type Cond = "Healthy" | "Warning" | "Critical";
type Asset = { name: string; location: string; years: number; condition: Cond; rul: string };

const rawAssets: Array<{ name: string; location: string; years: number }> = [
  { name: "Turbine T-01", location: "Plant A · Bay 2", years: 5.8 },
  { name: "Compressor C-204", location: "Plant A · Bay 5", years: 0.9 },
  { name: "Pump P-118", location: "Plant B · Line 3", years: 2.4 },
  { name: "Generator G-09", location: "Substation 1", years: 4.2 },
  { name: "Conveyor CV-7", location: "Plant B · Line 1", years: 2.9 },
  { name: "HVAC AH-3", location: "Building C", years: 4.8 },
  { name: "Boiler B-02", location: "Plant A · Utilities", years: 3.6 },
  { name: "Robot Arm R-15", location: "Plant B · Cell 4", years: 1.8 },
  { name: "Chiller CH-22", location: "Building D", years: 0.4 },
];

function conditionFromYears(years: number): Cond {
  if (years < 1.5) return "Critical";
  if (years <= 3.5) return "Warning";
  return "Healthy";
}

function formatYears(y: number) {
  return y < 1 ? `${Math.round(y * 12)} mo` : `${y.toFixed(1)} yr`;
}

const initialAssets: Asset[] = [...rawAssets]
  .sort((a, b) => a.years - b.years)
  .map((a) => ({ ...a, condition: conditionFromYears(a.years), rul: formatYears(a.years) }));

const conditionStyle: Record<Cond, string> = {
  Healthy: "border-success/40 bg-success/10 text-success",
  Warning: "border-warning/40 bg-warning/10 text-warning",
  Critical: "border-critical/40 bg-critical/10 text-critical",
};

const conditionIcon: Record<Cond, typeof CheckCircle2> = {
  Healthy: CheckCircle2,
  Warning: AlertTriangle,
  Critical: Zap,
};

const ALL_CONDITIONS: Cond[] = ["Healthy", "Warning", "Critical"];

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>(initialAssets);
  const [query, setQuery] = useState("");
  const [activeConditions, setActiveConditions] = useState<Cond[]>(ALL_CONDITIONS);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [years, setYears] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return assets.filter((a) => {
      const matchQ = !q || a.name.toLowerCase().includes(q) || a.location.toLowerCase().includes(q);
      const matchC = activeConditions.includes(a.condition);
      return matchQ && matchC;
    });
  }, [assets, query, activeConditions]);

  const toggleCondition = (c: Cond) => {
    setActiveConditions((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
    );
  };

  const resetForm = () => { setName(""); setLocation(""); setYears(""); };

  const onAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const y = Number(years);
    if (!name.trim() || !location.trim() || Number.isNaN(y) || y < 0) {
      toast.error("Lengkapi semua field dengan benar");
      return;
    }
    const cond = conditionFromYears(y);
    const newAsset: Asset = {
      name: name.trim(),
      location: location.trim(),
      years: y,
      condition: cond,
      rul: formatYears(y),
    };
    setAssets((prev) => [newAsset, ...prev]);
    toast.success("Asset berhasil ditambahkan", { description: `${newAsset.name} · ${cond}` });
    resetForm();
    setOpen(false);
  };

  return (
    <div>
      <PageHeader
        title="Asset Monitoring"
        subtitle="Live operational status, remaining useful life, and maintenance forecasts."
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
                  Masukkan detail asset. Kondisi akan dihitung otomatis dari sisa umur pakai.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={onAdd} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="asset-name">Nama Asset</Label>
                  <Input id="asset-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="mis. Pump P-220" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="asset-location">Lokasi</Label>
                  <Input id="asset-location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="mis. Plant A · Bay 3" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="asset-years">Sisa Umur Pakai (tahun)</Label>
                  <Input id="asset-years" type="number" step="0.1" min="0" value={years} onChange={(e) => setYears(e.target.value)} placeholder="mis. 2.5" />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => { resetForm(); setOpen(false); }}>Batal</Button>
                  <Button type="submit" className="bg-gradient-to-r from-primary to-cyan text-primary-foreground">Simpan</Button>
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
                value={query}
                onChange={(e) => setQuery(e.target.value)}
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
                  onClick={() => setActiveConditions(ALL_CONDITIONS)}
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
              {filtered.length === 0 ? (
                <TableRow className="border-border hover:bg-transparent">
                  <TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                    Tidak ada asset yang cocok.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((a) => {
                  const Icon = conditionIcon[a.condition];
                  return (
                    <TableRow key={a.name} className="border-border">
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
        </CardContent>
      </Card>
    </div>
  );
}