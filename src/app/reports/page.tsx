"use client";
import { useState, useMemo } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Download, FileText, TrendingUp, TrendingDown, Search } from "lucide-react";
import {
  Line, LineChart, CartesianGrid, ResponsiveContainer,
  Tooltip, XAxis, YAxis, PieChart, Pie, Cell, Legend,
} from "recharts";

const uptime = [
  { wk: "W1", value: 97.4 },
  { wk: "W2", value: 98.1 },
  { wk: "W3", value: 96.8 },
  { wk: "W4", value: 98.9 },
  { wk: "W5", value: 99.2 },
  { wk: "W6", value: 98.4 },
];

const distribution = [
  { name: "Healthy", value: 241, color: "var(--success)" },
  { name: "Warning", value: 29, color: "var(--warning)" },
  { name: "Critical", value: 4, color: "var(--critical)" },
  { name: "Offline", value: 10, color: "var(--muted-foreground)" },
];

const recent = [
  { title: "Weekly Operations Report — W19", date: "May 10, 2026", size: "2.4 MB", type: "Weekly" },
  { title: "Monthly Maintenance Summary — April", date: "May 01, 2026", size: "4.1 MB", type: "Monthly" },
  { title: "Predictive Analytics Insights Q2", date: "Apr 28, 2026", size: "6.8 MB", type: "Quarterly" },
  { title: "Plant A — Asset Health Audit", date: "Apr 22, 2026", size: "3.2 MB", type: "Audit" },
];

export default function ReportsPage() {
  const [query, setQuery] = useState("");

  const filteredReports = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return recent;
    return recent.filter((r) =>
      r.title.toLowerCase().includes(q) || r.type.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <div>
      <PageHeader
        title="Reports & Analytics"
        subtitle="Operational performance, maintenance analytics, and industrial insights."
        action={
          <Button className="bg-gradient-to-r from-primary to-cyan text-primary-foreground hover:opacity-90">
            <Download className="mr-2 h-4 w-4" /> Export PDF
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Avg Uptime", value: "98.4%", delta: "+0.6%", up: true },
          { label: "MTBF", value: "1,284h", delta: "+42h", up: true },
          { label: "MTTR", value: "2.1h", delta: "-0.3h", up: true },
          { label: "Maint. Cost", value: "$84.2K", delta: "-7.1%", up: true },
        ].map((k) => (
          <Card key={k.label} className="border-border bg-card">
            <CardContent className="p-5">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{k.label}</p>
              <p className="mt-2 text-3xl font-semibold text-foreground">{k.value}</p>
              <p className={`mt-1 flex items-center gap-1 text-xs ${k.up ? "text-success" : "text-critical"}`}>
                {k.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {k.delta} vs last period
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="border-border bg-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Weekly Uptime Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={uptime}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="wk" stroke="var(--muted-foreground)" fontSize={11} />
                <YAxis domain={[95, 100]} stroke="var(--muted-foreground)" fontSize={11} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }} />
                <Line type="monotone" dataKey="value" stroke="var(--cyan)" strokeWidth={2.5} dot={{ r: 4, fill: "var(--primary)" }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base">Asset Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={distribution} dataKey="value" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {distribution.map((d) => (
                    <Cell key={d.name} fill={d.color} stroke="var(--card)" />
                  ))}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Recent Reports</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari laporan..."
              className="h-9 pl-9 bg-background/60"
            />
          </div>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          {filteredReports.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Tidak ada laporan yang cocok.
            </div>
          )}
          {filteredReports.map((r) => (
            <div key={r.title} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-medium text-foreground">{r.title}</div>
                  <div className="text-xs text-muted-foreground">{r.date} · {r.size}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-cyan/40 text-cyan">{r.type}</Badge>
                <Button size="sm" variant="outline" className="border-border">
                  <Download className="mr-2 h-3.5 w-3.5" /> PDF
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}