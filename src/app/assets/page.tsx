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
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton-loading";

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

// 🌟 Ditambahkan sesuai struktur return FITUR 1 GET database terupdate
interface DropdownOptions {
  asset_types: string[];
  buildings: string[];
  floors: number[];
  zones: string[];
  categories: string[];
  sub_categories: string[];
  critical_levels: string[];
}

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

function splitCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function parseRepairCost(val: any): number {
  if (val === undefined || val === null) return 0;
  const s = String(val).trim();
  if (!s) return 0;

  // Clean prefix and keep numbers, dots, commas, and minus signs
  let clean = s.replace(/[^0-9\.,\-]/g, '');

  const lastDot = clean.lastIndexOf('.');
  const lastComma = clean.lastIndexOf(',');

  if (lastComma > lastDot) {
    // Indonesian format: 1.000.000,50 -> 1000000.50
    clean = clean.replace(/\./g, '').replace(/,/g, '.');
  } else if (lastDot > lastComma) {
    // US format: 1,000,000.50 -> 1000000.50
    clean = clean.replace(/,/g, '');
  } else {
    // Only one type of separator or none
    if (clean.includes(',')) {
      const parts = clean.split(',');
      if (parts.length > 2 || parts[1].length === 3) {
        clean = clean.replace(/,/g, '');
      } else {
        clean = clean.replace(/,/g, '.');
      }
    }
  }

  const parsed = parseFloat(clean);
  return isNaN(parsed) ? 0 : parsed;
}

function parseClientCSV(text: string): any[] {
  const lines = text.split(/\r?\n/);
  if (lines.length === 0 || !lines[0].trim()) return [];

  const headers = splitCSVLine(lines[0]).map(h => h.trim().toLowerCase().replace(/^["']|["']$/g, ''));
  const rows: any[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = splitCSVLine(line);
    const rowObj: any = {};
    headers.forEach((header, idx) => {
      const val = values[idx] !== undefined ? values[idx].trim().replace(/^["']|["']$/g, '') : '';
      rowObj[header] = val;
    });

    const findValue = (keys: string[]) => {
      for (const k of keys) {
        if (rowObj[k] !== undefined) return rowObj[k];
        const spaceK = k.replace(/_/g, ' ');
        if (rowObj[spaceK] !== undefined) return rowObj[spaceK];
      }
      return undefined;
    };

    const rawCost = findValue(['repair_cost', 'cost', 'repair cost', 'biaya', 'biaya perbaikan']);
    const normalized: any = {
      technician_id: findValue(['technician_id', 'technician', 'technician id']),
      planned_date: findValue(['planned_date', 'planned', 'planned date', 'planned_date_time']),
      started_date: findValue(['started_date', 'started', 'started date', 'started_date_time']),
      completed_date: findValue(['completed_date', 'completed', 'completed date', 'completed_date_time']),
      issue_type: findValue(['issue_type', 'issue', 'issue type', 'complaint_type', 'complaint type']),
      severity: findValue(['severity']),
      root_cause: findValue(['root_cause', 'root cause', 'cause']),
      spare_parts_used: findValue(['spare_parts_used', 'spare parts', 'spare parts used', 'parts']),
      repair_cost: rawCost ? parseRepairCost(rawCost) : 0,
      is_embedded: findValue(['is_embedded', 'embedded']) ?? 0
    };

    rows.push(normalized);
  }
  return rows;
}

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loadingFetch, setLoadingFetch] = useState(true);
  const [queryStr, setQueryStr] = useState("");
  const [activeConditions, setActiveConditions] = useState<Cond[]>(ALL_CONDITIONS);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // State untuk Dropdown Distinct dari Backend
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [options, setOptions] = useState<DropdownOptions>({
    asset_types: [],
    buildings: [],
    floors: [],
    zones: [],
    categories: [],
    sub_categories: [],
    critical_levels: []
  });

  // State untuk Live Metrics Otomatis
  const [totalKomplain, setTotalKomplain] = useState<number>(0);
  const [totalBiayaPerbaikan, setTotalBiayaPerbaikan] = useState<number>(0);
  const [loadingMetrics, setLoadingMetrics] = useState(false);

  // State untuk tracking baseline historical dan CSV upload
  const [historicalKomplain, setHistoricalKomplain] = useState<number>(0);
  const [historicalBiaya, setHistoricalBiaya] = useState<number>(0);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvRows, setCsvRows] = useState<any[]>([]);

  // Pagination Server States
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // 🌟 Form States Lengkap Sesuai Struktur MariaDB & Backend BE Next.js
  const [assetName, setAssetName] = useState("");
  const [assetBrand, setAssetBrand] = useState("");
  const [assetModel, setAssetModel] = useState("");
  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [assetType, setAssetType] = useState("");
  const [building, setBuilding] = useState("");
  const [floor, setFloor] = useState("");
  const [zone, setZone] = useState("");
  const [criticalLevel, setCriticalLevel] = useState("");
  const [instalationDate, setInstalationDate] = useState("");
  const [operatingHours, setOperatingHours] = useState("");

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

  // Hook: Fetch Opsi Dropdown Unik saat Dialog Dibuka
  useEffect(() => {
    const fetchDropdownOptions = async () => {
      setLoadingOptions(true);
      try {
        const res = await fetch("/api/assets?options=true");
        const json = await res.json();
        if (json.success && json.data) {
          setOptions(json.data);
        }
      } catch {
        toast.error("Gagal memuat daftar pilihan lokasi dan jenis asset");
      } finally {
        setLoadingOptions(false);
      }
    };

    if (open) {
      fetchDropdownOptions();
    }
  }, [open]);

  // Hook: Mengambil Metrik Log Pemeliharaan Otomatis Saat Dropdown Terisi Lengkap
  useEffect(() => {
    const fetchAutomatedMetrics = async () => {
      if (!building || !floor || !assetType) return;

      setLoadingMetrics(true);
      try {
        const params = new URLSearchParams({
          metrics: "true",
          building: building,
          floor: floor,
          zone: zone || "",
          type: assetType
        });

        const res = await fetch(`/api/assets?${params.toString()}`);
        const json = await res.json();

        if (json.success && json.data) {
          const histKomplain = json.data.total_komplain;
          const histBiaya = json.data.total_biaya_perbaikan;
          setHistoricalKomplain(histKomplain);
          setHistoricalBiaya(histBiaya);

          const csvCount = csvRows.length;
          const csvCost = csvRows.reduce((sum, row) => sum + (parseFloat(row.repair_cost) || 0), 0);

          setTotalKomplain(histKomplain + csvCount);
          setTotalBiayaPerbaikan(histBiaya + csvCost);
        }
      } catch (err) {
        console.error("Gagal memuat otomatis data log maintenance", err);
      } finally {
        setLoadingMetrics(false);
      }
    };

    fetchAutomatedMetrics();
  }, [building, floor, zone, assetType, csvRows.length]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setCsvFile(null);
      setCsvRows([]);
      setTotalKomplain(historicalKomplain);
      setTotalBiayaPerbaikan(historicalBiaya);
      return;
    }

    setCsvFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      try {
        const parsed = parseClientCSV(text);
        setCsvRows(parsed);

        const count = parsed.length;
        const cost = parsed.reduce((sum, row) => sum + (parseFloat(row.repair_cost) || 0), 0);

        setTotalKomplain(historicalKomplain + count);
        setTotalBiayaPerbaikan(historicalBiaya + cost);
        toast.success(`Berhasil memuat ${count} log komplain dari CSV.`);
      } catch (err) {
        console.error(err);
        toast.error("Gagal membaca file CSV. Pastikan format valid.");
      }
    };
    reader.readAsText(file);
  };

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
    setAssetName("");
    setAssetBrand("");
    setAssetModel("");
    setCategory("");
    setSubCategory("");
    setAssetType("");
    setBuilding("");
    setFloor("");
    setZone("");
    setCriticalLevel("");
    setInstalationDate("");
    setOperatingHours("");
    setTotalKomplain(0);
    setTotalBiayaPerbaikan(0);
    setHistoricalKomplain(0);
    setHistoricalBiaya(0);
    setCsvFile(null);
    setCsvRows([]);
    const input = document.getElementById("complaint-csv") as HTMLInputElement;
    if (input) input.value = "";
  };

  const onAdd = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!assetName || !assetType || !category || !building || !floor || !instalationDate) {
      toast.error("Lengkapi seluruh field wajib (tanda bintang *) terlebih dahulu");
      return;
    }

    setSubmitting(true);
    try {
      // 🌟 PERBAIKAN UTAMA: Tembak ke Internal Route Next.js agar di-INSERT ke DB terlebih dahulu
      const res = await fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          asset_name: assetName,
          asset_brand: assetBrand,
          asset_model: assetModel,
          category: category,
          sub_category: subCategory,
          asset_type: assetType,
          building: building,
          floor: Number(floor),
          zone: zone || "",
          critical_level: criticalLevel,
          instalation_date: instalationDate,
          operational_hours: operatingHours ? parseFloat(operatingHours) : 0.0,
          total_komplain: totalKomplain,
          total_biaya_perbaikan: totalBiayaPerbaikan,
          complaints: csvRows
        })
      });

      const rawData = await res.json();

      if (!res.ok || !rawData.success) {
        throw new Error(rawData?.message || "Internal server gagal memproses penambahan aset");
      }

      const formattedRul = formatYears(rawData?.predicted_rul !== undefined ? Number(rawData.predicted_rul) : null);
      toast.success(rawData.predicted_rul !== undefined
        ? `Aset Berhasil Disimpan! Prediksi RUL AI Engine: ${formattedRul}`
        : `${rawData.message}`
      );

      fetchAssets();
      resetForm();
      setOpen(false);
    } catch (error: any) {
      console.error("[NEXTJS_POST_ERROR]", error);
      toast.error(error.message || "Terjadi kesalahan saat menyimpan aset");
    } finally {
      setSubmitting(false);
    }
  };

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
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
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
            <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Tambah Asset Baru</DialogTitle>
                <DialogDescription>
                  Masukkan spesifikasi komponen dan koordinat lokasi untuk memicu kalkulasi prediktif RUL.
                </DialogDescription>
              </DialogHeader>

              {loadingOptions ? (
                <div className="flex flex-col p-6 space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <div className="grid grid-cols-2 gap-3">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <Skeleton className="h-10 w-full" />
                  <div className="flex items-center space-x-2 text-cyan mt-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-xs">Menghubungkan opsi database...</span>
                  </div>
                </div>
              ) : (
                <form onSubmit={onAdd} className="space-y-4 pt-2">

                  {/* Row 1: Nama Aset (Kustom Input Manual) */}
                  <div className="space-y-1.5">
                    <Label htmlFor="asset-name">Asset Name <span className="text-destructive">*</span></Label>
                    <Input
                      id="asset-name"
                      value={assetName}
                      onChange={(e) => setAssetName(e.target.value)}
                      placeholder="ex. PAN-AE3Z-45541"
                      required
                    />
                  </div>

                  {/* Row 2: Brand & Model */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="asset-brand">Asset Brand</Label>
                      <Input
                        id="asset-brand"
                        value={assetBrand}
                        onChange={(e) => setAssetBrand(e.target.value)}
                        placeholder="ex. Daikin"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="asset-model">Asset Model</Label>
                      <Input
                        id="asset-model"
                        value={assetModel}
                        onChange={(e) => setAssetModel(e.target.value)}
                        placeholder="ex. CS-YN-908"
                      />
                    </div>
                  </div>

                  {/* Row 3: Category & Sub Category (Dynamic Dropdown) */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="category">Category <span className="text-destructive">*</span></Label>
                      <Select value={category} onValueChange={setCategory} required>
                        <SelectTrigger id="category">
                          <SelectValue placeholder="Select Category" />
                        </SelectTrigger>
                        <SelectContent className="max-h-52">
                          {options.categories.map((cat) => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="sub-category">Sub Category</Label>
                      <Select value={subCategory} onValueChange={setSubCategory}>
                        <SelectTrigger id="sub-category">
                          <SelectValue placeholder="Select Sub Category" />
                        </SelectTrigger>
                        <SelectContent className="max-h-52">
                          {options.sub_categories.map((sub) => (
                            <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Row 4: Tipe Asset (Untuk keperluan AI Feature Engine) */}
                  <div className="space-y-1.5">
                    <Label htmlFor="asset-type">Asset Type <span className="text-destructive">*</span></Label>
                    <Select value={assetType} onValueChange={setAssetType} required>
                      <SelectTrigger id="asset-type">
                        <SelectValue placeholder="Select Asset Type" />
                      </SelectTrigger>
                      <SelectContent className="max-h-48">
                        {options.asset_types.map((type) => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Row 5: Grid Geografis Lokasi */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="building">Building <span className="text-destructive">*</span></Label>
                      <Select value={building} onValueChange={setBuilding} required>
                        <SelectTrigger id="building">
                          <SelectValue placeholder="Select Building" />
                        </SelectTrigger>
                        <SelectContent>
                          {options.buildings.map((b) => (
                            <SelectItem key={b} value={b}>{b}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="floor">Floor <span className="text-destructive">*</span></Label>
                      <Select value={floor} onValueChange={setFloor} required>
                        <SelectTrigger id="floor">
                          <SelectValue placeholder="Select Floor" />
                        </SelectTrigger>
                        <SelectContent className="max-h-48">
                          {options.floors.map((f) => (
                            <SelectItem key={String(f)} value={String(f)}>Floor {f}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="zone">Zone</Label>
                      <Select value={zone} onValueChange={setZone}>
                        <SelectTrigger id="zone">
                          <SelectValue placeholder="Select Zone" />
                        </SelectTrigger>
                        <SelectContent>
                          {options.zones.map((z) => (
                            <SelectItem key={z} value={z}>{z}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Row 6: Tanggal Instalasi & Initial Critical Level */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="instalation-date">Installation Date <span className="text-destructive">*</span></Label>
                      <Input
                        id="instalation-date"
                        type="date"
                        value={instalationDate}
                        onChange={(e) => setInstalationDate(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="critical-level">Critical Level</Label>
                      <Select value={criticalLevel} onValueChange={setCriticalLevel}>
                        <SelectTrigger id="critical-level">
                          <SelectValue placeholder="Critical (Default)" />
                        </SelectTrigger>
                        <SelectContent>
                          {options.critical_levels.map((lvl) => (
                            <SelectItem key={lvl} value={lvl}>{lvl}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Row 7: Operating Hours */}
                  <div className="space-y-1.5">
                    <Label htmlFor="operating-hours">Operational Hours (h)</Label>
                    <Input
                      id="operating-hours"
                      type="number"
                      step="0.1"
                      value={operatingHours}
                      onChange={(e) => setOperatingHours(e.target.value)}
                      placeholder="ex. 23"
                      required
                    />
                  </div>

                  {/* CSV File Input */}
                  <div className="space-y-1.5">
                    <Label htmlFor="complaint-csv">Upload Complaint CSV (Opsional)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="complaint-csv"
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        className="file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                      />
                      {csvFile && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setCsvFile(null);
                            setCsvRows([]);
                            setTotalKomplain(historicalKomplain);
                            setTotalBiayaPerbaikan(historicalBiaya);
                            const input = document.getElementById("complaint-csv") as HTMLInputElement;
                            if (input) input.value = "";
                          }}
                          className="text-xs text-destructive hover:text-destructive/80"
                        >
                          Hapus
                        </Button>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Format kolom CSV yang didukung: repair_cost, planned_date, started_date, completed_date, issue_type, severity, root_cause, spare_parts_used.
                    </p>
                  </div>

                  {/* Live Metrics Preview Section */}
                  {(building && floor && assetType) && (
                    <div className="rounded-lg border border-border bg-muted/40 p-3 space-y-2 text-xs">
                      <div className="font-semibold text-muted-foreground tracking-wide uppercase text-[10px]">
                        Historical Maintenance Metrics (Automated)
                      </div>
                      {loadingMetrics ? (
                        <div className="flex items-center space-x-2 text-muted-foreground py-1">
                          <Loader2 className="h-3 w-3 animate-spin text-cyan" />
                          <span>Mengkalkulasi log database...</span>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-4 pt-1">
                          <div>
                            <span className="text-muted-foreground block">Total Komplain:</span>
                            <span className="font-medium text-foreground text-sm">{totalKomplain} Tiket</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground block">Total Biaya Perbaikan:</span>
                            <span className="font-medium text-foreground text-sm">
                              Rp {totalBiayaPerbaikan.toLocaleString("id-ID", { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <DialogFooter className="pt-2">
                    <Button type="button" variant="outline" disabled={submitting || loadingMetrics} onClick={() => { resetForm(); setOpen(false); }}>Batal</Button>
                    <Button type="submit" disabled={submitting || loadingMetrics} className="bg-gradient-to-r from-primary to-cyan text-primary-foreground">
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Simpan & Prediksi RUL"}
                    </Button>
                  </DialogFooter>
                </form>
              )}
            </DialogContent>
          </Dialog>
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
                    <motion.tr key={a.id} variants={item} className="border-border border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
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
                    </motion.tr>
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
    </motion.div>
  );
}