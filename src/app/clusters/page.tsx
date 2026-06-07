"use client";
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sparkles, FileBarChart2, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { SkeletonTable } from "@/components/ui/skeleton-loading";

const rupiah = (n: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

interface ClusterData {
  clusterId: number;
  jenis: string;
  penyebab: string;
  sparePart: string;
  biaya: number;
  frequency: number;
  asset_type: string;
}

export default function ClustersPage() {
  const [loading, setLoading] = useState(true);
  const [clusters, setClusters] = useState<ClusterData[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    async function fetchClusters() {
      try {
        const res = await fetch("/api/dashboard");
        const json = await res.json();
        if (json.success) {
          setClusters(json.clusters || []);
        }
      } catch (error) {
        console.error("Failed to fetch clusters data", error);
      } finally {
        setLoading(false);
      }
    }
    fetchClusters();
  }, []);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentClusters = clusters.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(clusters.length / itemsPerPage);

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
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <PageHeader
        title="NLP Clustering Analysis"
        subtitle="Analisis kluster otomatis terhadap log deskripsi keluhan dan riwayat penggantian spare part."
        action={
          <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            AI Model: NLP-KMeans · Active
          </div>
        }
      />

      <motion.div variants={item}>
        <Card className="border-border bg-card shadow-[var(--shadow-card)] overflow-hidden">
          <CardHeader className="border-b border-border/50 pb-4">
            <div className="flex items-center gap-2">
              <FileBarChart2 className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-base">Smart Asset Priority</CardTitle>
                <p className="text-xs text-muted-foreground">Kerusakan paling dominan dari run kluster terbaru untuk setiap tipe aset</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <SkeletonTable rows={10} columns={6} />
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="pl-6">Asset Type</TableHead>
                      <TableHead>Jenis Kerusakan</TableHead>
                      <TableHead>Penyebab</TableHead>
                      <TableHead>Spare Part</TableHead>
                      <TableHead>Frequency</TableHead>
                      <TableHead className="pr-6 text-right">Biaya Perbaikan (Avg)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentClusters.length === 0 ? (
                      <TableRow className="border-border">
                        <TableCell colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                          Tidak ada data kluster yang ditemukan.
                        </TableCell>
                      </TableRow>
                    ) : (
                      currentClusters.map((c, i) => (
                        <TableRow key={i} className="border-border hover:bg-muted/30">
                          <TableCell className="pl-6 font-medium text-foreground">{c.asset_type}</TableCell>
                          <TableCell className="text-foreground">{c.jenis}</TableCell>
                          <TableCell className="text-muted-foreground">{c.penyebab}</TableCell>
                          <TableCell className="text-muted-foreground">{c.sparePart}</TableCell>
                          <TableCell className="text-foreground">{c.frequency} log</TableCell>
                          <TableCell className="pr-6 text-right font-medium text-foreground">
                            {rupiah(Number(c.biaya) || 0)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>

                {clusters.length > itemsPerPage && (
                  <div className="flex items-center justify-between border-t border-border px-6 py-4 bg-muted/20">
                    <div className="text-xs text-muted-foreground">
                      Showing <span className="font-medium text-foreground">{indexOfFirstItem + 1}</span> to{' '}
                      <span className="font-medium text-foreground">
                        {indexOfLastItem > clusters.length ? clusters.length : indexOfLastItem}
                      </span>{' '}
                      of <span className="font-medium text-foreground">{clusters.length}</span> clusters
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition hover:text-foreground disabled:opacity-40 disabled:hover:text-muted-foreground"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>

                      <div className="text-xs text-muted-foreground px-2">
                        Page <span className="font-medium text-foreground">{currentPage}</span> of {totalPages}
                      </div>

                      <button
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition hover:text-foreground disabled:opacity-40 disabled:hover:text-muted-foreground"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
