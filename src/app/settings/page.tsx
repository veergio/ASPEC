"use client";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  return (
    <div>
      <PageHeader title="Settings" subtitle="Manage your workspace, preferences and integrations." />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="border-border bg-card">
          <CardHeader><CardTitle className="text-base">Profile</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label>Full Name</Label><Input defaultValue="Aris Operator" className="bg-background/60" /></div>
            <div className="space-y-2"><Label>Email</Label><Input defaultValue="aris@aspec.io" className="bg-background/60" /></div>
            <div className="space-y-2"><Label>Role</Label><Input defaultValue="Plant Engineer" className="bg-background/60" /></div>
            <Button className="bg-gradient-to-r from-primary to-cyan text-primary-foreground">Save Changes</Button>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader><CardTitle className="text-base">Notifications</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Critical alerts", desc: "Receive instant SMS + email for critical events", on: true },
              { label: "Maintenance reminders", desc: "Daily digest of upcoming maintenance", on: true },
              { label: "Weekly summary", desc: "Email summary every Monday morning", on: false },
              { label: "AI anomaly detection", desc: "Push notification on predictive anomalies", on: true },
            ].map((n) => (
              <div key={n.label} className="flex items-center justify-between rounded-lg border border-border bg-background/40 p-3">
                <div>
                  <div className="text-sm font-medium text-foreground">{n.label}</div>
                  <div className="text-xs text-muted-foreground">{n.desc}</div>
                </div>
                <Switch defaultChecked={n.on} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}