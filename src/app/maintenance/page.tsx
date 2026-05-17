"use client";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarCheck, Clock, Wrench, CheckCircle2, AlertCircle } from "lucide-react";

const upcoming = [
  { date: "May 12", title: "Compressor C-204 — Bearing Replacement", type: "Critical", tech: "M. Putra", duration: "4h" },
  { date: "May 15", title: "Robot Arm R-15 — Calibration", type: "Preventive", tech: "S. Wijaya", duration: "2h" },
  { date: "May 18", title: "Turbine T-01 — Oil Sampling", type: "Inspection", tech: "A. Rahman", duration: "1.5h" },
  { date: "May 22", title: "Pump P-118 — Seal Inspection", type: "Preventive", tech: "D. Sari", duration: "3h" },
];

const history = [
  { date: "May 08", title: "Conveyor CV-7 belt tensioning", status: "Completed" },
  { date: "May 05", title: "Generator G-09 oil change", status: "Completed" },
  { date: "May 02", title: "Boiler B-02 pressure relief test", status: "Completed" },
  { date: "Apr 28", title: "HVAC AH-3 filter replacement", status: "Completed" },
];

const calendarDays = Array.from({ length: 35 }, (_, i) => {
  const day = i - 3;
  return { day, hasEvent: [12, 15, 18, 22, 24, 28].includes(day) };
});

const typeStyle: Record<string, string> = {
  Critical: "border-critical/40 bg-critical/10 text-critical",
  Preventive: "border-cyan/40 bg-cyan/10 text-cyan",
  Inspection: "border-warning/40 bg-warning/10 text-warning",
};

export default function MaintenancePage() {
  return (
    <div>
      <PageHeader
        title="Maintenance Schedule"
        subtitle="Plan, track, and review all preventive and corrective maintenance activities."
        action={
          <Button className="bg-gradient-to-r from-primary to-cyan text-primary-foreground hover:opacity-90">
            <CalendarCheck className="mr-2 h-4 w-4" /> Schedule Maintenance
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="border-border bg-card lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">May 2026</CardTitle>
            <div className="flex gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" /> Scheduled</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-critical" /> Critical</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] uppercase tracking-wider text-muted-foreground">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                <div key={d} className="py-2">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((c, i) => {
                const valid = c.day > 0 && c.day <= 31;
                const isCritical = c.day === 12;
                return (
                  <div
                    key={i}
                    className={`relative aspect-square rounded-lg border p-2 text-xs ${
                      valid ? "border-border bg-background/40 text-foreground" : "border-transparent text-muted-foreground/30"
                    } ${c.hasEvent ? "ring-1 ring-primary/40" : ""}`}
                  >
                    {valid && c.day}
                    {c.hasEvent && (
                      <span className={`absolute bottom-1.5 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full ${isCritical ? "bg-critical" : "bg-primary"}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base">Upcoming Inspections</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcoming.map((u) => (
              <div key={u.title} className="rounded-lg border border-border bg-background/40 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-xs font-semibold text-cyan">{u.date}</div>
                    <div className="mt-0.5 text-sm font-medium text-foreground">{u.title}</div>
                  </div>
                  <Badge variant="outline" className={typeStyle[u.type]}>{u.type}</Badge>
                </div>
                <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1"><Wrench className="h-3 w-3" />{u.tech}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{u.duration}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base">Maintenance Activity Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative space-y-5 pl-6">
              <div className="absolute left-2 top-2 bottom-2 w-px bg-border" />
              {history.map((h) => (
                <div key={h.title} className="relative">
                  <div className="absolute -left-[18px] top-1.5 grid h-4 w-4 place-items-center rounded-full border border-success/40 bg-success/20">
                    <CheckCircle2 className="h-2.5 w-2.5 text-success" />
                  </div>
                  <div className="text-xs text-muted-foreground">{h.date}</div>
                  <div className="text-sm text-foreground">{h.title}</div>
                  <div className="text-[10px] uppercase tracking-wider text-success">{h.status}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base">Scheduled This Week</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {[
              { label: "Preventive Tasks", value: "18", icon: Wrench, tone: "text-cyan" },
              { label: "Inspections", value: "9", icon: AlertCircle, tone: "text-warning" },
              { label: "Completed", value: "23", icon: CheckCircle2, tone: "text-success" },
              { label: "Overdue", value: "2", icon: Clock, tone: "text-critical" },
            ].map((m) => (
              <div key={m.label} className="rounded-lg border border-border bg-background/40 p-4">
                <m.icon className={`h-4 w-4 ${m.tone}`} />
                <div className="mt-2 text-2xl font-semibold text-foreground">{m.value}</div>
                <div className="text-xs text-muted-foreground">{m.label}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}