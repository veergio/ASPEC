export type AssetStatus = "healthy" | "warning" | "critical";

export interface Asset {
  id: string;
  name: string;
  category: "mechanical" | "electrical" | "security";
  status: AssetStatus;
  healthScore: number;        // 0-100
  remainingUsefulLife: number; // dalam hari
  confidenceScore: number;    // persentase 0-100
  lastMaintenance: string;    // ISO date
  nextMaintenance: string;    // ISO date
}