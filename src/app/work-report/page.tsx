"use client";
import { useMemo, useState } from "react";
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
import { format } from "date-fns";
import { CalendarIcon, Check, ChevronsUpDown, Save, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const ASSETS = [
  "Turbine T-01", "Compressor C-204", "Pump P-118",
  "Generator G-09", "Conveyor CV-7", "HVAC AH-3",
  "Boiler B-02", "Robot Arm R-15",
];

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
          <Calendar mode="single" selected={value} onSelect={onChange} initialFocus className={cn("p-3 pointer-events-auto")} />
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default function WorkReportPage() {
  const [asset, setAsset] = useState<string>("");
  const [assetOpen, setAssetOpen] = useState(false);
  const [planned, setPlanned] = useState<Date>();
  const [start, setStart] = useState<Date>();
  const [done, setDone] = useState<Date>();
  const [issue, setIssue] = useState("");
  const [cause, setCause] = useState("");
  const [parts, setParts] = useState("");
  const [cost, setCost] = useState("");

  const formatted = useMemo(() => formatRupiah(cost), [cost]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Laporan berhasil disimpan", {
      description: asset ? `${asset} • Rp ${formatted || 0}` : "Laporan tersimpan",
    });
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
                        !asset && "text-muted-foreground",
                      )}
                    >
                      {asset || "Pilih aset…"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Cari aset…" />
                      <CommandList>
                        <CommandEmpty>Aset tidak ditemukan.</CommandEmpty>
                        <CommandGroup>
                          {ASSETS.map((a) => (
                            <CommandItem key={a} value={a} onSelect={() => { setAsset(a); setAssetOpen(false); }}>
                              <Check className={cn("mr-2 h-4 w-4", asset === a ? "opacity-100" : "opacity-0")} />
                              {a}
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

              <div className="space-y-1.5">
                <Label className="text-sm">Keluhan / Permasalahan</Label>
                <Textarea value={issue} onChange={(e) => setIssue(e.target.value)} placeholder="Jelaskan keluhan atau gejala kerusakan…" className="min-h-[96px] bg-card" />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm">Akar Penyebab</Label>
                <Textarea value={cause} onChange={(e) => setCause(e.target.value)} placeholder="Hasil analisis penyebab utama…" className="min-h-[80px] bg-card" />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm">Spare Part Diganti</Label>
                <Textarea value={parts} onChange={(e) => setParts(e.target.value)} placeholder="Daftar spare part yang diganti, mis. bearing 6205, seal hidrolik…" className="min-h-[80px] bg-card" />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm">Biaya Pemeliharaan</Label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">Rp</span>
                  <Input
                    inputMode="numeric"
                    value={formatted}
                    onChange={(e) => setCost(e.target.value)}
                    placeholder="0"
                    className="h-11 bg-card pl-9 text-left text-base font-medium tabular-nums"
                  />
                </div>
              </div>

              <Button type="submit" className="h-12 w-full bg-gradient-to-r from-primary to-cyan text-base font-semibold text-primary-foreground shadow-md hover:opacity-95">
                <Save className="mr-2 h-4 w-4" /> Simpan Laporan
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