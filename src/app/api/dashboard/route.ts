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
            WITH latest_runs AS (
                SELECT run_id, asset_type
                FROM (
                    SELECT run_id, asset_type, ROW_NUMBER() OVER (PARTITION BY asset_type ORDER BY run_id DESC) as run_rn
                    FROM clustering_runs
                ) r
                WHERE r.run_rn = 1
            ),
            best_clusters AS (
                SELECT 
                    c.dominant_damage AS jenis,
                    c.dominant_cause AS penyebab,
                    c.dominant_spare_part AS sparePart,
                    c.average_cost AS biaya,
                    c.member_count AS frequency,
                    lr.asset_type
                FROM nlp_clusters c
                INNER JOIN latest_runs lr ON c.run_id = lr.run_id
                INNER JOIN (
                    SELECT 
                        cluster_id,
                        ROW_NUMBER() OVER (PARTITION BY run_id ORDER BY member_count DESC, cluster_id DESC) as cluster_rn
                    FROM nlp_clusters
                ) cr ON c.cluster_id = cr.cluster_id AND cr.cluster_rn = 1
            )
            SELECT jenis, penyebab, sparePart, biaya, frequency, asset_type
            FROM best_clusters
            ORDER BY frequency DESC
        `;

        // Monthly maintenance trend (tickets + cost)
        const monthlyTrendSql = `
            SELECT
                DATE_FORMAT(completed_date, '%Y-%m') AS month,
                COUNT(*) AS tickets,
                COALESCE(SUM(repair_cost), 0) AS total_cost
            FROM maintenance_logs
            WHERE completed_date IS NOT NULL
            GROUP BY month
            ORDER BY month
        `;

        // Asset count grouped by category
        const categorySql = `
            SELECT category, COUNT(*) AS count
            FROM assets
            WHERE status = 'Aktif' AND category IS NOT NULL
            GROUP BY category
            ORDER BY count DESC
        `;

        // Severity distribution from maintenance logs
        const severitySql = `
            SELECT severity, COUNT(*) AS count
            FROM maintenance_logs
            WHERE severity IS NOT NULL
            GROUP BY severity
            ORDER BY count DESC
        `;

        const [summaryResult, clusters, monthlyTrend, categoryDist, severityDist] = await Promise.all([
            query<any>(summarySql),
            query<any>(clustersSql),
            query<any>(monthlyTrendSql),
            query<any>(categorySql),
            query<any>(severitySql),
        ]);

        return NextResponse.json({
            success: true,
            summary: summaryResult[0],
            clusters,
            monthlyTrend,
            categoryDist,
            severityDist,
        });
    } catch (error) {
        console.error("[DASHBOARD_API_ERROR]", error);
        return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
    }
}
