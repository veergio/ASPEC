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
import { Plus, Loader2 } from "lucide-react";
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

interface AddAssetModalProps {
  onAssetAdded: () => void;
  onResultReady: (data: any) => void;
}

function AddAssetModalInner({ onAssetAdded, onResultReady }: AddAssetModalProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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

  // CSV
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvRows, setCsvRows] = useState<any[]>([]);

  // Form Fields
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
    setCsvFile(null); setCsvRows([]);
    setComplaintMode("manual");
    setManualComplaints([{ issueType: "", severity: "", rootCause: "", spareParts: "", repairCost: "" }]);
    setActiveComplaintTab("0");
    const input = document.getElementById("complaint-csv") as HTMLInputElement;
    if (input) input.value = "";
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
          const csvCount = complaintMode === "csv" ? csvRows.length : 0;
          const csvCost = complaintMode === "csv" ? csvRows.reduce((sum, row) => sum + (parseFloat(row.repair_cost) || 0), 0) : 0;
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
  }, [building, floor, zone, assetType, csvRows.length, complaintMode, manualComplaints]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setCsvFile(null); setCsvRows([]);
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

  const onAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetName || !assetType || !category || !building || !floor || !instalationDate) {
      toast.error("Lengkapi seluruh field wajib (tanda bintang *) terlebih dahulu");
      return;
    }
    setSubmitting(true);
    try {
      const complaintsToSubmit = complaintMode === "csv"
        ? csvRows
        : manualComplaints.filter(c => c.issueType).map(c => ({
          issue_type: c.issueType, severity: c.severity,
          root_cause: c.rootCause, spare_parts_used: c.spareParts,
          repair_cost: parseRepairCost(c.repairCost),
          completed_date: new Date().toISOString().split('T')[0],
          is_embedded: 0
        }));

      const res = await fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          asset_name: assetName, asset_brand: assetBrand, asset_model: assetModel,
          category, sub_category: subCategory, asset_type: assetType,
          building, floor: Number(floor), zone: zone || "",
          critical_level: criticalLevel, instalation_date: instalationDate,
          operational_hours: operatingHours ? parseFloat(operatingHours) : 0.0,
          total_komplain: totalKomplain, total_biaya_perbaikan: totalBiayaPerbaikan,
          complaints: complaintsToSubmit
        })
      });
      const rawData = await res.json();
      if (!res.ok || !rawData.success) {
        throw new Error(rawData?.message || "Internal server gagal memproses penambahan aset");
      }

      const formatYears = (y: number | null): string => {
        if (y === null || y < 0) return "N/A";
        const yrs = Math.floor(y);
        const mos = Math.round((y - yrs) * 12);
        if (yrs === 0) return `${mos} mo`;
        if (mos === 0) return `${yrs} yr`;
        return `${yrs} yr ${mos} mo`;
      };
      const formattedRul = formatYears(rawData?.predicted_rul !== undefined ? Number(rawData.predicted_rul) : null);

      function getRulCondition(cat: string, rul: number | null) {
        if (rul === null) return "Healthy";
        if (["Sistem Pemadam Kebakaran", "Sistem Proteksi Kebakaran Aktif", "Security Sistem"].includes(cat)) {
          if (rul <= 0.25) return "Critical"; if (rul <= 1.0) return "Warning"; return "Healthy";
        }
        if (["Sistem Telekomunikasi Gedung", "Pencatatan Meter"].includes(cat)) {
          if (rul <= 0.5) return "Critical"; if (rul <= 2.0) return "Warning"; return "Healthy";
        }
        if (["Mechanical", "Electrical", "Ventilasi Sistem", "Sistem Transportasi Gedung", "Sistem Energi"].includes(cat)) {
          if (rul <= 1.0) return "Critical"; if (rul <= 3.0) return "Warning"; return "Healthy";
        }
        if (["Civil", "Arsitektur", "Plumbing", "Distribusi Air"].includes(cat)) {
          if (rul <= 2.0) return "Critical"; if (rul <= 5.0) return "Warning"; return "Healthy";
        }
        if (cat === "Latihan Balakar") {
          if (rul <= 0.5) return "Critical"; if (rul <= 1.5) return "Warning"; return "Healthy";
        }
        return "Healthy";
      }

      onResultReady({
        name: assetName, id: rawData.asset_id, category,
        location: `${building} · ${floor} · ${zone}`,
        predicted_rul: rawData.predicted_rul,
        instalation_date: instalationDate,
        condition: getRulCondition(category, rawData.predicted_rul)
      });

      toast.success(rawData.predicted_rul !== undefined
        ? `Aset Berhasil Disimpan! Prediksi RUL AI Engine: ${formattedRul}`
        : `${rawData.message}`
      );
      onAssetAdded();
      resetForm();
      setOpen(false);
    } catch (error: any) {
      console.error("[NEXTJS_POST_ERROR]", error);
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
            {/* Row 1: Nama Aset */}
            <div className="space-y-1.5">
              <Label htmlFor="asset-name">Asset Name <span className="text-destructive">*</span></Label>
              <Input id="asset-name" value={assetName} onChange={(e) => setAssetName(e.target.value)} placeholder="ex. PAN-AE3Z-45541" required />
            </div>

            {/* Row 2: Brand & Model */}
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

            {/* Row 3: Category & Sub Category */}
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

            {/* Row 4: Asset Type */}
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

            {/* Row 5: Location Grid */}
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

            {/* Row 6: Date & Critical Level */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="instalation-date">Installation Date <span className="text-destructive">*</span></Label>
                <Input id="instalation-date" type="date" value={instalationDate} onChange={(e) => setInstalationDate(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="critical-level">Critical Level</Label>
                <Select value={criticalLevel} onValueChange={setCriticalLevel}>
                  <SelectTrigger id="critical-level"><SelectValue placeholder="Critical (Default)" /></SelectTrigger>
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
              <Input id="operating-hours" type="number" step="0.1" value={operatingHours} onChange={(e) => setOperatingHours(e.target.value)} placeholder="ex. 23" required />
            </div>

            {/* Complaint Entry Section */}
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
                      <Button
                        type="button" variant="outline" size="icon"
                        className="h-7 w-7 rounded-md shrink-0 border-dashed"
                        onClick={() => {
                          setManualComplaints([...manualComplaints, { issueType: "", severity: "", rootCause: "", spareParts: "", repairCost: "" }]);
                          setActiveComplaintTab(String(manualComplaints.length));
                        }}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    {manualComplaints.map((complaint, idx) => (
                      <TabsContent key={idx} value={String(idx)} className="space-y-3 mt-0">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">Data Komplain #{idx + 1}</span>
                          {manualComplaints.length > 1 && (
                            <Button type="button" variant="ghost" size="sm"
                              className="h-6 px-2 text-destructive hover:bg-destructive/10 text-[10px]"
                              onClick={() => {
                                const newComplaints = manualComplaints.filter((_, i) => i !== idx);
                                setManualComplaints(newComplaints);
                                setActiveComplaintTab("0");
                              }}
                            >
                              Hapus
                            </Button>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label htmlFor={`manual-issue-${idx}`}>Jenis Kerusakan</Label>
                            <Input id={`manual-issue-${idx}`} value={complaint.issueType}
                              onChange={(e) => { const nc = [...manualComplaints]; nc[idx].issueType = e.target.value; setManualComplaints(nc); }}
                              placeholder="mis. Kebocoran Freon" className="h-9 text-xs" />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor={`manual-severity-${idx}`}>Severity</Label>
                            <Select value={complaint.severity} onValueChange={(v) => { const nc = [...manualComplaints]; nc[idx].severity = v; setManualComplaints(nc); }}>
                              <SelectTrigger id={`manual-severity-${idx}`} className="h-9 text-xs"><SelectValue placeholder="Pilih" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Low">Low</SelectItem>
                                <SelectItem value="Medium">Medium</SelectItem>
                                <SelectItem value="High">High</SelectItem>
                                <SelectItem value="Critical">Critical</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor={`manual-cause-${idx}`}>Akar Masalah (Root Cause)</Label>
                          <Textarea id={`manual-cause-${idx}`} value={complaint.rootCause}
                            onChange={(e) => { const nc = [...manualComplaints]; nc[idx].rootCause = e.target.value; setManualComplaints(nc); }}
                            placeholder="Jelaskan penyebab kerusakan..." className="min-h-[60px] text-xs" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label htmlFor={`manual-parts-${idx}`}>Spare Part Terpakai</Label>
                            <Input id={`manual-parts-${idx}`} value={complaint.spareParts}
                              onChange={(e) => { const nc = [...manualComplaints]; nc[idx].spareParts = e.target.value; setManualComplaints(nc); }}
                              placeholder="mis. Filter Dryer" className="h-9 text-xs" />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor={`manual-cost-${idx}`}>Biaya Perbaikan (Rp)</Label>
                            <Input id={`manual-cost-${idx}`} value={complaint.repairCost}
                              onChange={(e) => { const nc = [...manualComplaints]; nc[idx].repairCost = e.target.value; setManualComplaints(nc); }}
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
                      <Input id="complaint-csv" type="file" accept=".csv" onChange={handleFileChange}
                        className="h-9 text-xs file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90" />
                      {csvFile && (
                        <Button type="button" variant="ghost" size="sm"
                          onClick={() => { setCsvFile(null); setCsvRows([]); const input = document.getElementById("complaint-csv") as HTMLInputElement; if (input) input.value = ""; }}
                          className="text-[10px] text-destructive hover:text-destructive/80"
                        >
                          Hapus
                        </Button>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-tight">
                      Format kolom: repair_cost, issue_type, severity, root_cause, spare_parts_used, completed_date.
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Live Metrics Preview */}
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
  );
}

export const AddAssetModal = memo(AddAssetModalInner);
