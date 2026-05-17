export type Cond = "Healthy" | "Warning" | "Critical";

export type Asset = {
  name: string;
  location: string;
  years: number;
  condition: Cond;
  rul: string;
};

function conditionFromYears(years: number): Cond {
  if (years < 1.5) return "Critical";
  if (years <= 3.5) return "Warning";
  return "Healthy";
}

function formatYears(y: number) {
  return y < 1 ? `${Math.round(y * 12)} mo` : `${y.toFixed(1)} yr`;
}

const rawAssets: Array<{ name: string; location: string; years: number }> = [
  { name: "Turbine T-01", location: "Plant A · Bay 2", years: 5.8 },
  { name: "Compressor C-204", location: "Plant A · Bay 5", years: 0.9 },
  { name: "Pump P-118", location: "Plant B · Line 3", years: 2.4 },
  { name: "Generator G-09", location: "Substation 1", years: 4.2 },
  { name: "Conveyor CV-7", location: "Plant B · Line 1", years: 2.9 },
  { name: "HVAC AH-3", location: "Building C", years: 4.8 },
  { name: "Boiler B-02", location: "Plant A · Utilities", years: 3.6 },
  { name: "Robot Arm R-15", location: "Plant B · Cell 4", years: 1.8 },
  { name: "Chiller CH-22", location: "Building D", years: 0.4 },
];

export const assets: Asset[] = [...rawAssets]
  .sort((a, b) => a.years - b.years)
  .map((a) => ({ ...a, condition: conditionFromYears(a.years), rul: formatYears(a.years) }));

export const counts = {
  Healthy: assets.filter((a) => a.condition === "Healthy").length,
  Warning: assets.filter((a) => a.condition === "Warning").length,
  Critical: assets.filter((a) => a.condition === "Critical").length,
};

export const conditionStyle: Record<Cond, string> = {
  Healthy: "border-success/40 bg-success/10 text-success",
  Warning: "border-warning/40 bg-warning/10 text-warning",
  Critical: "border-critical/40 bg-critical/10 text-critical",
};