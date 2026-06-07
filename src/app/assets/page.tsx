"use client";
import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { Filter, Search, CheckCircle2, AlertTriangle, Zap, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton-loading";
import { AddAssetModal } from "@/components/add-asset-modal";

type Cond = "Critical" | "Warning" | "Healthy";
type Asset = {
  id: number;
  name: string;
  location: string;
  years: number | null;
  condition: Cond;
  rul: string;
  installationDate: string;
  remainingRul: string;
};



function getRulCondition(category: string, rul: number | null): Cond {
  if (rul === null) return "Healthy";

  if (
    category === "Sistem Pemadam Kebakaran" ||
    category === "Sistem Proteksi Kebakaran Aktif" ||
    category === "Security Sistem"
  ) {
    if (rul <= 0.25) return "Critical";
    if (rul <= 1.0) return "Warning";
    return "Healthy";
  }

  if (
    category === "Sistem Telekomunikasi Gedung" ||
    category === "Pencatatan Meter"
  ) {
    if (rul <= 0.5) return "Critical";
    if (rul <= 2.0) return "Warning";
    return "Healthy";
  }

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

  if (category === "Latihan Balakar") {
    if (rul <= 0.5) return "Critical";
    if (rul <= 1.5) return "Warning";
    return "Healthy";
  }

  return "Healthy";
}

function formatYears(y: number | null): string {
  if (y === null || y < 0) return "N/A";
  const yrs = Math.floor(y);
  const mos = Math.round((y - yrs) * 12);

  if (yrs === 0) return `${mos} mo`;
  if (mos === 0) return `${yrs} yr`;
  return `${yrs} yr ${mos} mo`;
}

function formatRemainingRul(y: number | null): string {
  if (y === null) return "N/A";
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

const conditionStyle: Record<Cond, string> = {
  Critical: "border-destructive/40 bg-destructive/10 text-destructive",
  Warning: "border-warning/40 bg-warning/10 text-warning",
  Healthy: "border-success/40 bg-success/10 text-success",
};

const conditionIcon: Record<Cond, typeof CheckCircle2> = {
  Critical: Zap,
  Warning: AlertTriangle,
  Healthy: CheckCircle2,
};

const ALL_CONDITIONS: Cond[] = ["Critical", "Warning", "Healthy"];



export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loadingFetch, setLoadingFetch] = useState(true);
  const [queryStr, setQueryStr] = useState("");
  const [activeConditions, setActiveConditions] = useState<Cond[]>(ALL_CONDITIONS);
  const [resultOpen, setResultOpen] = useState(false);
  const [resultData, setResultData] = useState<any>(null);

  // Pagination Server States
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Fetch Server Pagination Handler
  const fetchAssets = useCallback(async () => {
    setLoadingFetch(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
        search: queryStr,
        conditions: activeConditions.join(",")
      });

      const res = await fetch(`/api/assets?${params.toString()}`);
      const json = await res.json();

      if (json.success && json.data) {
        const mapped: Asset[] = json.data.map((item: any) => {
          const y = item.predicted_rul !== null ? Number(item.predicted_rul) : null;
          const remY = item.remaining_rul !== null ? Number(item.remaining_rul) : null;
          const locParts = [item.building, item.floor !== null ? `Fl. ${item.floor}` : null, item.zone].filter(Boolean);

          return {
            id: item.asset_id,
            name: item.asset_name || `Asset #${item.asset_id}`,
            location: locParts.join(" · "),
            years: y,
            condition: (item.derived_condition || getRulCondition(item.category, remY)) as Cond,
            rul: formatYears(y),
            installationDate: item.instalation_date ? new Date(item.instalation_date).toLocaleDateString('id-ID') : "N/A",
            remainingRul: formatRemainingRul(remY)
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
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
      <PageHeader
        title="Asset Monitoring"
        subtitle="Live operational status, remaining useful life, and ML maintenance forecasts."
        action={
          <AddAssetModal
            onAssetAdded={fetchAssets}
            onResultReady={(data) => {
              setResultData(data);
              setResultOpen(true);
            }}
          />
        }
      />

      {/* Sisa code Card, Table, dan Pagination tetap sama karena sudah bekerja dengan baik */}
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
                <TableHead>Installation Date</TableHead>
                <TableHead>Total Predicted Life</TableHead>
                <TableHead>RUL</TableHead>
                <TableHead className="text-right">Condition</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingFetch ? (
                Array.from({ length: 6 }).map((_, rIdx) => (
                  <TableRow key={rIdx} className="border-border hover:bg-transparent">
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell className="text-right flex justify-end"><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                  </TableRow>
                ))
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
                    <TableRow key={a.id} className="border-border border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                      <TableCell className="font-medium text-foreground">{a.name}</TableCell>
                      <TableCell className="text-muted-foreground">{a.location}</TableCell>
                      <TableCell className="text-muted-foreground">{a.installationDate}</TableCell>
                      <TableCell className="text-muted-foreground">{a.rul}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {a.remainingRul === "N/A" ? (
                          <span className="text-destructive font-medium">Expired / N/A</span>
                        ) : a.remainingRul.includes("longer") ? (
                          <span className="text-destructive font-medium">{a.remainingRul}</span>
                        ) : (
                          a.remainingRul
                        )}
                      </TableCell>
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

      {/* Summary Popup Result */}
      <Dialog open={resultOpen} onOpenChange={setResultOpen}>
        <DialogContent className="sm:max-w-md border-border bg-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <CheckCircle2 className="h-6 w-6 text-success" />
              Asset Prediction Result
            </DialogTitle>
            <DialogDescription>
              AI Engine has analyzed the asset specifications and historical patterns.
            </DialogDescription>
          </DialogHeader>

          {resultData && (
            <div className="space-y-6 py-4">
              <div className="flex items-start justify-between border-b border-border pb-4">
                <div>
                  <h3 className="text-lg font-bold text-foreground">{resultData.name}</h3>
                  <p className="text-xs text-muted-foreground">{resultData.location}</p>
                </div>
                <Badge variant="outline" className={cn("rounded-full px-2.5", conditionStyle[resultData.condition as Cond])}>
                  {resultData.condition}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-y-4 text-sm">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">Asset ID</span>
                  <span className="font-mono font-medium text-cyan">#{resultData.id}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">Category</span>
                  <span className="font-medium">{resultData.category}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">Install Date</span>
                  <span className="font-medium">{format(new Date(resultData.instalation_date), "dd MMM yyyy")}</span>
                </div>
              </div>

              <div className="rounded-xl bg-muted/40 p-4 border border-border/50">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold">Predicted Sisa Umur (RUL)</span>
                  <div className="text-right">
                    <span className="text-2xl font-black text-primary block leading-none">
                      {formatYears(resultData.predicted_rul)}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Progress
                    value={(() => {
                      const ageDays = (new Date().getTime() - new Date(resultData.instalation_date).getTime()) / (1000 * 3600 * 24);
                      const remainingDays = (resultData.predicted_rul || 0) * 365.25;
                      const totalDays = ageDays + remainingDays;
                      return totalDays > 0 ? Math.min(100, Math.max(0, (remainingDays / totalDays) * 100)) : 0;
                    })()}
                    className="h-2 bg-background"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground font-medium italic">
                    <span>Lifespan used</span>
                    <span>Remaining capacity</span>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-center text-muted-foreground px-4">
                This ML prediction is based on regional operational data and typical wear patterns.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setResultOpen(false)} className="w-full bg-gradient-to-r from-primary to-cyan text-primary-foreground shadow-lg font-semibold">
              Understand & Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}