import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
    try {
        const remainingRulCalc = `(predicted_rul - (DATEDIFF(CURRENT_DATE, instalation_date) / 365))`;

        const conditionSql = `
            CASE 
                -- Kelompok 1: Safety & Security
                WHEN category IN ('Sistem Pemadam Kebakaran', 'Sistem Proteksi Kebakaran Aktif', 'Security Sistem') THEN
                    CASE 
                        WHEN ${remainingRulCalc} <= 0.25 THEN 'Critical'
                        WHEN ${remainingRulCalc} <= 1.0 THEN 'Warning'
                        ELSE 'Healthy'
                    END
                -- Kelompok 2: IT & Telecom
                WHEN category IN ('Sistem Telekomunikasi Gedung', 'Pencatatan Meter') THEN
                    CASE 
                        WHEN ${remainingRulCalc} <= 0.5 THEN 'Critical'
                        WHEN ${remainingRulCalc} <= 2.0 THEN 'Warning'
                        ELSE 'Healthy'
                    END
                -- Kelompok 3: Core Operations (M&E)
                WHEN category IN ('Mechanical', 'Electrical', 'Ventilasi Sistem', 'Sistem Transportasi Gedung', 'Sistem Energi') THEN
                    CASE 
                        WHEN ${remainingRulCalc} <= 1.0 THEN 'Critical'
                        WHEN ${remainingRulCalc} <= 3.0 THEN 'Warning'
                        ELSE 'Healthy'
                    END
                -- Kelompok 4: Sipil & Plumbing
                WHEN category IN ('Civil', 'Arsitektur', 'Plumbing', 'Distribusi Air') THEN
                    CASE 
                        WHEN ${remainingRulCalc} <= 2.0 THEN 'Critical'
                        WHEN ${remainingRulCalc} <= 5.0 THEN 'Warning'
                        ELSE 'Healthy'
                    END
                -- Kelompok 5: Lainnya (Latihan Balakar)
                WHEN category = 'Latihan Balakar' THEN
                    CASE 
                        WHEN ${remainingRulCalc} <= 0.5 THEN 'Critical'
                        WHEN ${remainingRulCalc} <= 1.5 THEN 'Warning'
                        ELSE 'Healthy'
                    END
                ELSE 'Healthy'
            END
        `;

        const summarySql = `
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN (${conditionSql}) = 'Healthy' THEN 1 ELSE 0 END) as healthy,
                SUM(CASE WHEN (${conditionSql}) = 'Warning' THEN 1 ELSE 0 END) as warning,
                SUM(CASE WHEN (${conditionSql}) = 'Critical' THEN 1 ELSE 0 END) as critical,
                AVG(CASE WHEN ${remainingRulCalc} >= 0 THEN ${remainingRulCalc} ELSE NULL END) as avg_rul
            FROM assets
            WHERE status ='Aktif'
        `;

        const clustersSql = `
            SELECT 
                dominant_damage AS jenis, 
                dominant_cause AS penyebab, 
                dominant_spare_part AS sparePart, 
                estimated_cost AS biaya,
                COUNT(*) AS frequency
            FROM nlp_clusters
            GROUP BY 
                dominant_damage, 
                dominant_cause, 
                dominant_spare_part, 
                estimated_cost
            ORDER BY frequency DESC
        `;

        const summaryResult = await query<any>(summarySql);
        const clusters = await query<any>(clustersSql);

        return NextResponse.json({
            success: true,
            summary: summaryResult[0],
            clusters
        });
    } catch (error) {
        console.error("[DASHBOARD_API_ERROR]", error);
        return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
    }
}
