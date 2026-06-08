"use client";
import { useState, useEffect, useCallback, memo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Loader2, FileSpreadsheet, ListPlus, Upload } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton-loading";

interface DropdownOptions {
  asset_types: string[];
  buildings: string[];
  floors: number[];
  zones: string[];
  categories: string[];
  sub_categories: string[];
  critical_levels: string[];
}

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
  let clean = s.replace(/[^0-9\.,\-]/g, '');
  const lastDot = clean.lastIndexOf('.');
  const lastComma = clean.lastIndexOf(',');
  if (lastComma > lastDot) {
    clean = clean.replace(/\./g, '').replace(/,/g, '.');
  } else if (lastDot > lastComma) {
    clean = clean.replace(/,/g, '');
  } else {
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

function parseAssetCSV(text: string): any[] {
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

    const normalized: any = {
      asset_name: findValue(['asset_name', 'name', 'nama asset', 'nama_asset', 'asset name']),
      asset_brand: findValue(['asset_brand', 'brand', 'merk']),
      asset_model: findValue(['asset_model', 'model', 'tipe model']),
      category: findValue(['category', 'kategori']),
      sub_category: findValue(['sub_category', 'sub category', 'sub_kategori']),
      asset_type: findValue(['asset_type', 'type', 'tipe']),
      building: findValue(['building', 'gedung', 'lokasi_gedung']),
      floor: findValue(['floor', 'lantai', 'lokasi_lantai']),
      zone: findValue(['zone', 'zona', 'lokasi_zona']),
      critical_level: findValue(['critical_level', 'critical level', 'critical', 'level']),
      instalation_date: findValue(['instalation_date', 'installation date', 'tanggal pasang', 'tgl_pasang', 'instalation date']),
      operational_hours: findValue(['operational_hours', 'op_hours', 'jam operasional', 'jam_operasional', 'operational hours']),
      total_komplain: findValue(['total_komplain', 'total komplain', 'total_complaints', 'complaints_count']),
      total_biaya_perbaikan: findValue(['total_biaya_perbaikan', 'total biaya', 'total_cost', 'repair_cost_total'])
    };
    rows.push(normalized);
  }
  return rows;
}

interface AddAssetModalProps {
  onAssetAdded: () => void;
  onResultReady: (data: any) => void;
}

function AddAssetModalInner({ onAssetAdded, onResultReady }: AddAssetModalProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [entryMode, setEntryMode] = useState<"manual" | "bulk">("manual");

  // Dropdown options
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [options, setOptions] = useState<DropdownOptions>({
    asset_types: [], buildings: [], floors: [], zones: [],
    categories: [], sub_categories: [], critical_levels: []
  });

  // Metrics
  const [totalKomplain, setTotalKomplain] = useState<number>(0);
  const [totalBiayaPerbaikan, setTotalBiayaPerbaikan] = useState<number>(0);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [historicalKomplain, setHistoricalKomplain] = useState<number>(0);
  const [historicalBiaya, setHistoricalBiaya] = useState<number>(0);

  // CSV for Complaints
  const [complaintCsvFile, setComplaintCsvFile] = useState<File | null>(null);
  const [complaintCsvRows, setComplaintCsvRows] = useState<any[]>([]);

  // CSV for Bulk Assets
  const [assetCsvFile, setAssetCsvFile] = useState<File | null>(null);
  const [assetCsvRows, setAssetCsvRows] = useState<any[]>([]);

  // Form Fields (Manual)
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

  // Complaint
  const [complaintMode, setComplaintMode] = useState<"csv" | "manual">("manual");
  const [manualComplaints, setManualComplaints] = useState<any[]>([
    { issueType: "", severity: "", rootCause: "", spareParts: "", repairCost: "" }
  ]);
  const [activeComplaintTab, setActiveComplaintTab] = useState("0");

  const resetForm = useCallback(() => {
    setAssetName(""); setAssetBrand(""); setAssetModel("");
    setCategory(""); setSubCategory(""); setAssetType("");
    setBuilding(""); setFloor(""); setZone("");
    setCriticalLevel(""); setInstalationDate(""); setOperatingHours("");
    setTotalKomplain(0); setTotalBiayaPerbaikan(0);
    setHistoricalKomplain(0); setHistoricalBiaya(0);
    setComplaintCsvFile(null); setComplaintCsvRows([]);
    setAssetCsvFile(null); setAssetCsvRows([]);
    setComplaintMode("manual");
    setEntryMode("manual");
    setManualComplaints([{ issueType: "", severity: "", rootCause: "", spareParts: "", repairCost: "" }]);
    setActiveComplaintTab("0");
    const inputC = document.getElementById("complaint-csv") as HTMLInputElement;
    if (inputC) inputC.value = "";
    const inputA = document.getElementById("asset-csv") as HTMLInputElement;
    if (inputA) inputA.value = "";
  }, []);

  // Fetch dropdown options when opened
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const fetchDropdownOptions = async () => {
      setLoadingOptions(true);
      try {
        const res = await fetch("/api/assets?options=true");
        const json = await res.json();
        if (!cancelled && json.success && json.data) {
          setOptions(json.data);
        }
      } catch {
        toast.error("Gagal memuat daftar pilihan lokasi dan jenis asset");
      } finally {
        if (!cancelled) setLoadingOptions(false);
      }
    };
    fetchDropdownOptions();
    return () => { cancelled = true; };
  }, [open]);

  // Metrics auto-fetch
  useEffect(() => {
    if (entryMode !== "manual") return;
    if (!building || !floor || !assetType) return;
    let cancelled = false;
    const fetchAutomatedMetrics = async () => {
      setLoadingMetrics(true);
      try {
        const params = new URLSearchParams({
          metrics: "true", building, floor, zone: zone || "", type: assetType
        });
        const res = await fetch(`/api/assets?${params.toString()}`);
        const json = await res.json();
        if (!cancelled && json.success && json.data) {
          const histKomplain = json.data.total_komplain;
          const histBiaya = json.data.total_biaya_perbaikan;
          setHistoricalKomplain(histKomplain);
          setHistoricalBiaya(histBiaya);
          const csvCount = complaintMode === "csv" ? complaintCsvRows.length : 0;
          const csvCost = complaintMode === "csv" ? complaintCsvRows.reduce((sum, row) => sum + (parseFloat(row.repair_cost) || 0), 0) : 0;
          const validManuals = complaintMode === "manual" ? manualComplaints.filter(c => c.issueType) : [];
          const manualCount = validManuals.length;
          const manualCost = validManuals.reduce((sum, c) => sum + parseRepairCost(c.repairCost), 0);
          setTotalKomplain(histKomplain + csvCount + manualCount);
          setTotalBiayaPerbaikan(histBiaya + csvCost + manualCost);
        }
      } catch (err) {
        console.error("Gagal memuat otomatis data log maintenance", err);
      } finally {
        if (!cancelled) setLoadingMetrics(false);
      }
    };
    fetchAutomatedMetrics();
    return () => { cancelled = true; };
  }, [building, floor, zone, assetType, complaintCsvRows.length, complaintMode, manualComplaints, entryMode]);

  const handleComplaintFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setComplaintCsvFile(null); setComplaintCsvRows([]);
      setTotalKomplain(historicalKomplain);
      setTotalBiayaPerbaikan(historicalBiaya);
      return;
    }
    setComplaintCsvFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;
      try {
        const parsed = parseClientCSV(text);
        setComplaintCsvRows(parsed);
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

  const handleAssetFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setAssetCsvFile(null); setAssetCsvRows([]);
      return;
    }
    setAssetCsvFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;
      try {
        const parsed = parseAssetCSV(text);
        setAssetCsvRows(parsed);
        toast.success(`Berhasil memuat ${parsed.length} asset dari CSV.`);
      } catch (err) {
        console.error(err);
        toast.error("Gagal membaca file CSV asset.");
      }
    };
    reader.readAsText(file);
  };

  const onAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (entryMode === "manual") {
      if (!assetName || !assetType || !category || !building || !floor || !instalationDate) {
        toast.error("Lengkapi seluruh field wajib (tanda bintang *) terlebih dahulu");
        return;
      }
    } else {
      if (assetCsvRows.length === 0) {
        toast.error("Upload file CSV asset terlebih dahulu");
        return;
      }
    }
    
    setSubmitting(true);
    try {
      let body: any;

      if (entryMode === "manual") {
        const complaintsToSubmit = complaintMode === "csv"
          ? complaintCsvRows
          : manualComplaints.filter(c => c.issueType).map(c => ({
            issue_type: c.issueType, severity: c.severity,
            root_cause: c.rootCause, spare_parts_used: c.spareParts,
            repair_cost: parseRepairCost(c.repairCost),
            completed_date: new Date().toISOString().split('T')[0],
            is_embedded: 0
          }));

        body = {
          asset_name: assetName, asset_brand: assetBrand, asset_model: assetModel,
          category, sub_category: subCategory, asset_type: assetType,
          building, floor: Number(floor), zone: zone || "",
          critical_level: criticalLevel, instalation_date: instalationDate,
          operational_hours: operatingHours ? parseFloat(operatingHours) : 0.0,
          total_komplain: totalKomplain, total_biaya_perbaikan: totalBiayaPerbaikan,
          complaints: complaintsToSubmit
        };
      } else {
        body = assetCsvRows;
      }

      const res = await fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const rawData = await res.json();
      if (!res.ok || !rawData.success) {
        throw new Error(rawData?.message || "Gagal memproses penambahan aset");
      }

      if (entryMode === "manual") {
        const formatYears = (y: number | null): string => {
          if (y === null || y < 0) return "N/A";
          const yrs = Math.floor(y);
          const mos = Math.round((y - yrs) * 12);
          if (yrs === 0) return `${mos} mo`;
          if (mos === 0) return `${yrs} yr`;
          return `${yrs} yr ${mos} mo`;
        };
        const formattedRul = formatYears(rawData?.predicted_rul !== undefined ? Number(rawData.predicted_rul) : null);

        onResultReady({
          name: assetName, id: rawData.asset_id, category,
          location: `${building} · ${floor} · ${zone}`,
          predicted_rul: rawData.predicted_rul,
          instalation_date: instalationDate,
        });

        toast.success(rawData.predicted_rul !== undefined
          ? `Aset Berhasil Disimpan! Prediksi RUL: ${formattedRul}`
          : `${rawData.message}`
        );
      } else {
        toast.success(`Berhasil mengimpor ${assetCsvRows.length} asset!`);
      }
      
      onAssetAdded();
      resetForm();
      setOpen(false);
    } catch (error: any) {
      console.error("[POST_ASSET_ERROR]", error);
      toast.error(error.message || "Terjadi kesalahan saat menyimpan aset");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-primary to-cyan text-primary-foreground hover:opacity-90">
          <Plus className="mr-2 h-4 w-4" /> Add Asset
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tambah Asset Baru</DialogTitle>
          <DialogDescription>
            Pilih metode input untuk menambahkan aset ke dalam sistem manajemen.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={entryMode} onValueChange={(v) => setEntryMode(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="manual" className="flex items-center gap-2">
              <ListPlus className="h-4 w-4" /> Manual Entry
            </TabsTrigger>
            <TabsTrigger value="bulk" className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4" /> Bulk Import (CSV)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="manual">
            {loadingOptions ? (
              <div className="flex flex-col space-y-4">
                <Skeleton className="h-10 w-full" />
                <div className="grid grid-cols-2 gap-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="flex items-center space-x-2 text-cyan mt-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-xs">Menghubungkan opsi database...</span>
                </div>
              </div>
            ) : (
              <form onSubmit={onAdd} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="asset-name">Asset Name <span className="text-destructive">*</span></Label>
                  <Input id="asset-name" value={assetName} onChange={(e) => setAssetName(e.target.value)} placeholder="ex. PAN-AE3Z-45541" required />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="asset-brand">Asset Brand</Label>
                    <Input id="asset-brand" value={assetBrand} onChange={(e) => setAssetBrand(e.target.value)} placeholder="ex. Daikin" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="asset-model">Asset Model</Label>
                    <Input id="asset-model" value={assetModel} onChange={(e) => setAssetModel(e.target.value)} placeholder="ex. CS-YN-908" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="category">Category <span className="text-destructive">*</span></Label>
                    <Select value={category} onValueChange={setCategory} required>
                      <SelectTrigger id="category"><SelectValue placeholder="Select Category" /></SelectTrigger>
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
                      <SelectTrigger id="sub-category"><SelectValue placeholder="Select Sub Category" /></SelectTrigger>
                      <SelectContent className="max-h-52">
                        {options.sub_categories.map((sub) => (
                          <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="asset-type">Asset Type <span className="text-destructive">*</span></Label>
                  <Select value={assetType} onValueChange={setAssetType} required>
                    <SelectTrigger id="asset-type"><SelectValue placeholder="Select Asset Type" /></SelectTrigger>
                    <SelectContent className="max-h-48">
                      {options.asset_types.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="building">Building <span className="text-destructive">*</span></Label>
                    <Select value={building} onValueChange={setBuilding} required>
                      <SelectTrigger id="building"><SelectValue placeholder="Select Building" /></SelectTrigger>
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
                      <SelectTrigger id="floor"><SelectValue placeholder="Select Floor" /></SelectTrigger>
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
                      <SelectTrigger id="zone"><SelectValue placeholder="Select Zone" /></SelectTrigger>
                      <SelectContent>
                        {options.zones.map((z) => (
                          <SelectItem key={z} value={z}>{z}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="instalation-date">Installation Date <span className="text-destructive">*</span></Label>
                    <Input id="instalation-date" type="date" value={instalationDate} onChange={(e) => setInstalationDate(e.target.value)} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="critical-level">Critical Level</Label>
                    <Select value={criticalLevel} onValueChange={setCriticalLevel}>
                      <SelectTrigger id="critical-level"><SelectValue placeholder="Healthy (Default)" /></SelectTrigger>
                      <SelectContent>
                        {options.critical_levels.map((lvl) => (
                          <SelectItem key={lvl} value={lvl}>{lvl}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="operating-hours">Operational Hours (h)</Label>
                  <Input id="operating-hours" type="number" step="0.1" value={operatingHours} onChange={(e) => setOperatingHours(e.target.value)} placeholder="ex. 23" required />
                </div>

                <div className="space-y-3 pt-2 border-t border-border/50">
                  <Label className="text-sm font-semibold text-primary/80">Riwayat Komplain & Perbaikan</Label>
                  <Tabs value={complaintMode} onValueChange={(v) => setComplaintMode(v as any)} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 h-9">
                      <TabsTrigger value="manual" className="text-xs">Form Manual</TabsTrigger>
                      <TabsTrigger value="csv" className="text-xs">Upload CSV</TabsTrigger>
                    </TabsList>

                    <TabsContent value="manual" className="space-y-4 mt-3">
                      <Tabs value={activeComplaintTab} onValueChange={setActiveComplaintTab} className="w-full">
                        <div className="flex items-center gap-2 mb-2 overflow-x-auto pb-1 no-scrollbar">
                          <TabsList className="h-8 justify-start bg-transparent p-0 gap-1">
                            {manualComplaints.map((_, idx) => (
                              <TabsTrigger key={idx} value={String(idx)} className="data-[state=active]:bg-muted px-3 text-[10px] h-7 border border-border">
                                C-{idx + 1}
                              </TabsTrigger>
                            ))}
                          </TabsList>
                          <Button type="button" variant="outline" size="icon" className="h-7 w-7 rounded-md shrink-0 border-dashed"
                            onClick={() => {
                              setManualComplaints([...manualComplaints, { issueType: "", severity: "", rootCause: "", spareParts: "", repairCost: "" }]);
                              setActiveComplaintTab(String(manualComplaints.length));
                            }}>
                            <Plus className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        {manualComplaints.map((complaint, idx) => (
                          <TabsContent key={idx} value={String(idx)} className="space-y-3 mt-0">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">Data Komplain #{idx + 1}</span>
                              {manualComplaints.length > 1 && (
                                <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-destructive hover:bg-destructive/10 text-[10px]"
                                  onClick={() => { const newComplaints = manualComplaints.filter((_, i) => i !== idx); setManualComplaints(newComplaints); setActiveComplaintTab("0"); }}>
                                  Hapus
                                </Button>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1.5">
                                <Label className="text-[11px]">Jenis Kerusakan</Label>
                                <Input value={complaint.issueType} onChange={(e) => { const nc = [...manualComplaints]; nc[idx].issueType = e.target.value; setManualComplaints(nc); }}
                                  placeholder="mis. Kebocoran Freon" className="h-9 text-xs" />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-[11px]">Severity</Label>
                                <Select value={complaint.severity} onValueChange={(v) => { const nc = [...manualComplaints]; nc[idx].severity = v; setManualComplaints(nc); }}>
                                  <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Pilih" /></SelectTrigger>
                                  <SelectContent><SelectItem value="Low">Low</SelectItem><SelectItem value="Medium">Medium</SelectItem><SelectItem value="High">High</SelectItem><SelectItem value="Critical">Critical</SelectItem></SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-[11px]">Root Cause</Label>
                              <Textarea value={complaint.rootCause} onChange={(e) => { const nc = [...manualComplaints]; nc[idx].rootCause = e.target.value; setManualComplaints(nc); }}
                                placeholder="Penyebab kerusakan..." className="min-h-[60px] text-xs" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1.5">
                                <Label className="text-[11px]">Spare Part</Label>
                                <Input value={complaint.spareParts} onChange={(e) => { const nc = [...manualComplaints]; nc[idx].spareParts = e.target.value; setManualComplaints(nc); }}
                                  placeholder="mis. Filter Dryer" className="h-9 text-xs" />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-[11px]">Biaya (Rp)</Label>
                                <Input value={complaint.repairCost} onChange={(e) => { const nc = [...manualComplaints]; nc[idx].repairCost = e.target.value; setManualComplaints(nc); }}
                                  placeholder="0" className="h-9 text-xs" />
                              </div>
                            </div>
                          </TabsContent>
                        ))}
                      </Tabs>
                    </TabsContent>

                    <TabsContent value="csv" className="space-y-3 mt-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="complaint-csv">File CSV Log Maintenance</Label>
                        <div className="flex items-center gap-2">
                          <Input id="complaint-csv" type="file" accept=".csv" onChange={handleComplaintFileChange}
                            className="h-9 text-xs file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90" />
                          {complaintCsvFile && (
                            <Button type="button" variant="ghost" size="sm" className="text-[10px] text-destructive"
                              onClick={() => { setComplaintCsvFile(null); setComplaintCsvRows([]); const i = document.getElementById("complaint-csv") as HTMLInputElement; if (i) i.value = ""; }}>
                              Hapus
                            </Button>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground leading-tight">
                          Kolom: repair_cost, issue_type, severity, root_cause, spare_parts_used, completed_date.
                        </p>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>

                {(building && floor && assetType) && (
                  <div className="rounded-lg border border-border bg-muted/40 p-3 space-y-2 text-xs">
                    <div className="font-semibold text-muted-foreground tracking-wide uppercase text-[10px]">Historical Maintenance Metrics</div>
                    {loadingMetrics ? (
                      <div className="flex items-center space-x-2 text-muted-foreground py-1">
                        <Loader2 className="h-3 w-3 animate-spin text-cyan" /><span>Mengkalkulasi log database...</span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-4 pt-1">
                        <div><span className="text-muted-foreground block">Total Komplain:</span><span className="font-medium text-foreground text-sm">{totalKomplain} Tiket</span></div>
                        <div><span className="text-muted-foreground block">Total Biaya:</span><span className="font-medium text-foreground text-sm">Rp {totalBiayaPerbaikan.toLocaleString("id-ID")}</span></div>
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
          </TabsContent>

          <TabsContent value="bulk" className="space-y-6 pt-2">
            <div className="rounded-xl border-2 border-dashed border-border p-8 text-center space-y-4 bg-muted/20">
              <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Upload className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Upload Asset CSV File</h4>
                <p className="text-xs text-muted-foreground px-4">
                  Gunakan format CSV yang sesuai dengan struktur kolom database untuk mengimpor banyak aset sekaligus.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Input id="asset-csv" type="file" accept=".csv" onChange={handleAssetFileChange} className="hidden" />
                <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('asset-csv')?.click()}>
                  Pilih File CSV
                </Button>
              </div>
              {assetCsvFile && (
                <div className="flex items-center justify-center gap-2 text-xs text-primary font-medium">
                  <FileSpreadsheet className="h-4 w-4" />
                  {assetCsvFile.name} ({assetCsvRows.length} assets)
                </div>
              )}
            </div>

            <div className="space-y-3">
              <h5 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Panduan Format CSV Asset</h5>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-[10px] bg-muted/40 p-3 rounded-lg border border-border">
                <div className="flex justify-between"><span>asset_name</span><span className="text-destructive">*</span></div>
                <div className="flex justify-between"><span>category</span><span className="text-destructive">*</span></div>
                <div className="flex justify-between"><span>asset_type</span><span className="text-destructive">*</span></div>
                <div className="flex justify-between"><span>building</span><span className="text-destructive">*</span></div>
                <div className="flex justify-between"><span>floor</span><span className="text-destructive">*</span></div>
                <div className="flex justify-between"><span>instalation_date</span><span className="text-destructive">*</span></div>
                <div>asset_brand</div>
                <div>asset_model</div>
                <div>zone</div>
                <div>operational_hours</div>
                <div>total_komplain</div>
                <div>total_biaya_perbaikan</div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" disabled={submitting} onClick={() => { resetForm(); setOpen(false); }}>Batal</Button>
              <Button type="button" onClick={onAdd} disabled={submitting || assetCsvRows.length === 0} className="bg-gradient-to-r from-primary to-cyan text-primary-foreground">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : `Impor ${assetCsvRows.length} Asset`}
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

export const AddAssetModal = memo(AddAssetModalInner);
