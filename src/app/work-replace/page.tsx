"use client";
import { useEffect, useMemo, useState } from "react";
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
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { CalendarIcon, Check, ChevronsUpDown, Save, RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Asset {
  id: number;
  name: string;
}

const ALASAN_UMUM = [
  "Usia pakai habis",
  "Tidak ada spare part",
  "Efisiensi energi",
  "Kerusakan permanen",
  "Upgrade teknologi",
  "Lainnya",
];

function formatRupiah(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  return new Intl.NumberFormat("id-ID").format(Number(digits));
}

function AssetCombobox({
  value,
  onChange,
  placeholder,
  assets,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  assets: Asset[];
}) {
  const [open, setOpen] = useState(false);
  const selected = assets.find((a) => String(a.id) === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className={cn(
            "h-11 w-full justify-between border-border bg-card text-left font-normal",
            !value && "text-muted-foreground",
          )}
        >
          {selected ? `${selected.id} — ${selected.name}` : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Cari aset..." />
          <CommandList>
            <CommandEmpty>Aset tidak ditemukan.</CommandEmpty>
            <CommandGroup>
              {assets.map((a) => (
                <CommandItem
                  key={a.id}
                  value={`${a.id} ${a.name}`}
                  onSelect={() => { onChange(String(a.id)); setOpen(false); }}
                  className={cn(value === String(a.id) && "bg-primary text-primary-foreground")}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === String(a.id) ? "opacity-100" : "opacity-0")} />
                  {a.id} — {a.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default function WorkReplacePage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [asetLama, setAsetLama] = useState("");
  const [asetBaru, setAsetBaru] = useState("");
  const [newAssetIdentifier, setNewAssetIdentifier] = useState("");
  const [tanggal, setTanggal] = useState<Date>();
  const [tanggalOpen, setTanggalOpen] = useState(false);
  const [alasanUmum, setAlasanUmum] = useState("");
  const [alasanSpesifik, setAlasanSpesifik] = useState("");
  const [biaya, setBiaya] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/assets/details")
      .then((res) => res.json())
      .then((data) => {
        if (data.assets) {
          setAssets(data.assets);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch assets", err);
        toast.error("Gagal memuat daftar aset");
      });
  }, []);

  const formattedBiaya = useMemo(() => formatRupiah(biaya), [biaya]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asetLama || (!asetBaru && !newAssetIdentifier) || !tanggal || !alasanUmum) {
      toast.error("Lengkapi semua field wajib (Aset Lama, Aset Baru/Identitas, Tanggal, dan Alasan)");
      return;
    }

    setIsSubmitting(true);
    const payload = {
      old_asset_id: parseInt(asetLama),
      new_asset_id: asetBaru ? parseInt(asetBaru) : null,
      new_asset_identifier: newAssetIdentifier || null,
      replacement_date: format(tanggal, "yyyy-MM-dd"),
      replacement_reason: `${alasanUmum}${alasanSpesifik ? `: ${alasanSpesifik}` : ""}`,
      replacement_cost: parseInt(biaya.replace(/\D/g, "")) || 0,
    };

    try {
      const response = await fetch("/api/asset-replacements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Data penggantian berhasil disimpan");
        // Reset form
        setAsetLama("");
        setAsetBaru("");
        setNewAssetIdentifier("");
        setTanggal(undefined);
        setAlasanUmum("");
        setAlasanSpesifik("");
        setBiaya("");
      } else {
        toast.error(result.message || "Gagal menyimpan data penggantian");
      }
    } catch (error) {
      console.error("Error submitting replacement", error);
      toast.error("Terjadi kesalahan koneksi ke server");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="theme-light -m-4 min-h-[calc(100vh-4rem)] md:-m-8">
      <main className="mx-auto max-w-3xl px-4 py-6 md:py-10">
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-[11px] uppercase tracking-wider text-muted-foreground">
            <RefreshCcw className="h-3 w-3 text-primary" /> Technician Form
          </div>
          <h1 className="mt-3 text-2xl font-semibold text-foreground md:text-3xl">
            Form Riwayat Penggantian Aset
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Catat siklus hidup aset (Life Cycle). Data ini disimpan ke tabel `asset_replacements` untuk perhitungan RUL.
          </p>
        </div>

        <Card className="border-border bg-card shadow-sm">
          <CardContent className="p-5 md:p-6">
            <form onSubmit={onSubmit} className="space-y-5">

              {/* Aset Lama */}
              <div className="space-y-1.5">
                <Label className="text-sm">ID / Nama Aset Lama</Label>
                <AssetCombobox
                  value={asetLama}
                  onChange={setAsetLama}
                  placeholder="Cari ID atau nama aset..."
                  assets={assets}
                />
                <p className="text-[11px] text-muted-foreground">Aset yang akan diganti / dipensiunkan.</p>
              </div>

              {/* Aset Baru */}
              <div className="space-y-1.5">
                <Label className="text-sm">Aset Baru dari Sistem (Opsional)</Label>
                <AssetCombobox
                  value={asetBaru}
                  onChange={setAsetBaru}
                  placeholder="Cari ID atau nama aset pengganti..."
                  assets={assets}
                />
                <p className="text-[11px] text-muted-foreground">Pilih jika aset pengganti sudah terdaftar di master data.</p>
              </div>

              {/* Identifier Aset Baru */}
              <div className="space-y-1.5">
                <Label className="text-sm">Identitas / SN Aset Baru</Label>
                <Input
                  value={newAssetIdentifier}
                  onChange={(e) => setNewAssetIdentifier(e.target.value)}
                  placeholder="Contoh: SN-XYZ-2024 atau Tag ID baru..."
                  className="h-11 bg-card"
                />
                <p className="text-[11px] text-muted-foreground">Isi jika aset baru belum memiliki ID sistem atau menggunakan identitas eksternal.</p>
              </div>

              {/* Tanggal Penggantian */}
              <div className="space-y-1.5">
                <Label className="text-sm">Tanggal Penggantian</Label>
                <Popover open={tanggalOpen} onOpenChange={setTanggalOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "h-11 w-full justify-start border-border bg-card text-left font-normal",
                        !tanggal && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                      {tanggal ? format(tanggal, "dd MMM yyyy") : "Pilih tanggal aktual penggantian"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={tanggal}
                      onSelect={(d) => { setTanggal(d); setTanggalOpen(false); }}
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Alasan Penggantian */}
              <div className="space-y-1.5">
                <Label className="text-sm">Alasan Penggantian</Label>
                <Select value={alasanUmum} onValueChange={setAlasanUmum}>
                  <SelectTrigger className="h-11 border-border bg-card">
                    <SelectValue placeholder="Pilih alasan umum..." />
                  </SelectTrigger>
                  <SelectContent>
                    {ALASAN_UMUM.map((a) => (
                      <SelectItem key={a} value={a}>{a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Textarea
                  value={alasanSpesifik}
                  onChange={(e) => setAlasanSpesifik(e.target.value)}
                  placeholder="Catatan / alasan spesifik tambahan..."
                  className="min-h-[96px] bg-card"
                />
              </div>

              {/* Biaya Penggantian */}
              <div className="space-y-1.5">
                <Label className="text-sm">Biaya Penggantian (Rp)</Label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                    Rp
                  </span>
                  <Input
                    inputMode="numeric"
                    value={formattedBiaya}
                    onChange={(e) => setBiaya(e.target.value)}
                    placeholder="0"
                    className="h-11 bg-card pl-9 text-left text-base font-medium tabular-nums"
                    disabled={isSubmitting}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Total biaya pengadaan aset baru beserta biaya bongkar-pasang.
                </p>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-12 w-full bg-gradient-to-r from-primary to-cyan text-base font-semibold text-primary-foreground shadow-md hover:opacity-95"
              >
                {isSubmitting ? (
                  <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Simpan Data Penggantian
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
