import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
    try {
        const assetsSql = `
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
                    c.dominant_damage,
                    c.dominant_cause,
                    c.dominant_spare_part,
                    c.average_cost,
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
            SELECT 
                a.asset_id as id, 
                a.asset_name as name, 
                a.zone as location, 
                a.status as \`condition\`, 
                a.predicted_rul as rul, 
                a.operational_hours as op_hours,
                a.instalation_date,
                a.category,
                a.recommendation_narrative,
                n.dominant_damage, 
                a.asset_type,
                n.dominant_cause, 
                n.dominant_spare_part, 
                n.average_cost as estimated_cost, 
                a.recommendation_narrative
            FROM assets a
            LEFT JOIN best_clusters n ON a.asset_type = n.asset_type COLLATE utf8mb4_unicode_ci
            WHERE a.status = 'Aktif'
        `;

        const logsSql = `
            SELECT ticket_id, asset_id, issue_type as title, severity as tag, root_cause as note, completed_date 
            FROM maintenance_logs 
            ORDER BY completed_date DESC
        `;

        const assets = await query(assetsSql);
        const logs = await query(logsSql);

        return NextResponse.json({ assets, logs });
    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}