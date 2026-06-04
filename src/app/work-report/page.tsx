"use client";
import { useMemo, useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command, CommandEmpty, CommandGroup, CommandInput,
  CommandItem, CommandList,
} from "@/components/ui/command";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { CalendarIcon, Check, ChevronsUpDown, Save, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AssetOption {
  id: number;
  name: string;
}

function formatRupiah(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  return new Intl.NumberFormat("id-ID").format(Number(digits));
}

function DatePickerField({ label, value, onChange }: {
  label: string;
  value: Date | undefined;
  onChange: (d: Date | undefined) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "h-11 w-full justify-start border-border bg-card text-left font-normal",
              !value && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
            {value ? format(value, "dd MMM yyyy") : "Pilih tanggal"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" selected={value} onSelect={onChange} className={cn("p-3 pointer-events-auto")} />
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default function WorkReportPage() {
  const [assetsList, setAssetsList] = useState<AssetOption[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState<number | null>(null);
  const [assetName, setAssetName] = useState<string>("");
  const [assetOpen, setAssetOpen] = useState(false);
  const [planned, setPlanned] = useState<Date>();
  const [start, setStart] = useState<Date>();
  const [done, setDone] = useState<Date>();
  const [issue, setIssue] = useState("");
  const [severity, setSeverity] = useState("");
  const [cause, setCause] = useState("");
  const [parts, setParts] = useState("");
  const [cost, setCost] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadAssets() {
      try {
        const res = await fetch("/api/assets/details");
        if (res.ok) {
          const json = await res.json();
          if (json.assets) {
            const mapped: AssetOption[] = json.assets.map((a: any) => ({
              id: Number(a.id),
              name: a.name,
            }));
            setAssetsList(mapped);
          }
        }
      } catch (error) {
        console.error("Gagal mengambil data aset:", error);
        toast.error("Gagal memuat daftar aset dari server.");
      }
    }
    loadAssets();
  }, []);

  const formattedCost = useMemo(() => formatRupiah(cost), [cost]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetId) {
      toast.error("Harap pilih aset terlebih dahulu.");
      return;
    }
    if (!start) {
      toast.error("Tanggal mulai pemeliharaan wajib diisi.");
      return;
    }
    if (!done) {
      toast.error("Tanggal selesai pemeliharaan wajib diisi.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/maintenance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          asset_id: selectedAssetId,
          planned_date: planned ? planned.toISOString() : null,
          started_date: start ? start.toISOString() : null,
          completed_date: done ? done.toISOString() : null,
          issue_type: issue,
          severity: severity || "Low",
          root_cause: cause,
          spare_parts_used: parts,
          repair_cost: cost,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Laporan berhasil disimpan!");
        // Reset form
        setAssetName("");
        setSelectedAssetId(null);
        setPlanned(undefined);
        setStart(undefined);
        setDone(undefined);
        setIssue("");
        setSeverity("");
        setCause("");
        setParts("");
        setCost("");
      } else {
        toast.error(data.message || "Gagal menyimpan laporan.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan saat menyimpan laporan.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="theme-light -m-4 min-h-[calc(100vh-4rem)] md:-m-8">
      <main className="mx-auto max-w-3xl px-4 py-6 md:py-10">
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-[11px] uppercase tracking-wider text-muted-foreground">
            <Wrench className="h-3 w-3 text-primary" /> Technician Form
          </div>
          <h1 className="mt-3 text-2xl font-semibold text-foreground md:text-3xl">Form Laporan Pekerjaan</h1>
          <p className="mt-1 text-sm text-muted-foreground">Isi laporan pemeliharaan aset dengan cepat dan akurat.</p>
        </div>

        <Card className="border-border bg-card shadow-sm">
          <CardContent className="p-5 md:p-6">
            <form onSubmit={onSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <Label className="text-sm">Aset</Label>
                <Popover open={assetOpen} onOpenChange={setAssetOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn(
                        "h-11 w-full justify-between border-border bg-card text-left font-normal",
                        !assetName && "text-muted-foreground",
                      )}
                    >
                      {assetName || "Pilih aset…"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Cari aset…" />
                      <CommandList>
                        <CommandEmpty>Aset tidak ditemukan.</CommandEmpty>
                        <CommandGroup>
                          {assetsList.map((a) => (
                            <CommandItem
                              key={a.id}
                              value={a.name}
                              onSelect={() => {
                                setAssetName(a.name);
                                setSelectedAssetId(a.id);
                                setAssetOpen(false);
                              }}
                            >
                              <Check className={cn("mr-2 h-4 w-4", assetName === a.name ? "opacity-100" : "opacity-0")} />
                              {a.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <DatePickerField label="Tanggal Rencana" value={planned} onChange={setPlanned} />
                <DatePickerField label="Tanggal Mulai" value={start} onChange={setStart} />
                <DatePickerField label="Tanggal Selesai" value={done} onChange={setDone} />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-sm">Keluhan / Permasalahan</Label>
                  <Textarea
                    value={issue}
                    onChange={(e) => setIssue(e.target.value)}
                    placeholder="Jelaskan keluhan atau gejala kerusakan…"
                    className="min-h-[96px] bg-card"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Tingkat Keparahan (Severity)</Label>
                  <Select value={severity} onValueChange={setSeverity}>
                    <SelectTrigger className="h-11 border-border bg-card">
                      <SelectValue placeholder="Pilih tingkat keparahan…" />
                    </SelectTrigger>
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
                <Label className="text-sm">Akar Penyebab</Label>
                <Textarea
                  value={cause}
                  onChange={(e) => setCause(e.target.value)}
                  placeholder="Hasil analisis penyebab utama…"
                  className="min-h-[80px] bg-card"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm">Spare Part Diganti</Label>
                <Textarea
                  value={parts}
                  onChange={(e) => setParts(e.target.value)}
                  placeholder="Daftar spare part yang diganti, mis. bearing 6205, seal hidrolik…"
                  className="min-h-[80px] bg-card"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm">Biaya Pemeliharaan</Label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">Rp</span>
                  <Input
                    inputMode="numeric"
                    value={formattedCost}
                    onChange={(e) => setCost(e.target.value)}
                    placeholder="0"
                    className="h-11 bg-card pl-9 text-left text-base font-medium tabular-nums"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="h-12 w-full bg-gradient-to-r from-primary to-cyan text-base font-semibold text-primary-foreground shadow-md hover:opacity-95 disabled:opacity-50"
              >
                <Save className="mr-2 h-4 w-4" />
                {submitting ? "Menyimpan…" : "Simpan Laporan"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Data tersinkronisasi otomatis dengan ASPEC Industrial AI
        </p>
      </main>
    </div>
  );
}