import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
    try {
        const assetsSql = `
            SELECT 
                a.asset_id as id, 
                a.asset_name as name, 
                a.zone as location, 
                a.status as \`condition\`, 
                a.predicted_rul as rul, 
                a.operational_hours as op_hours,
                a.instalation_date,
                a.category,
                n.dominant_damage, 
                n.asset_type,
                n.dominant_cause, 
                n.dominant_spare_part, 
                n.estimated_cost, 
                n.recommendation_narrative
            FROM assets a
            LEFT JOIN (
                SELECT 
                    cluster_id,
                    asset_type,
                    dominant_damage,
                    dominant_cause,
                    dominant_spare_part,
                    estimated_cost,
                    recommendation_narrative,
                    (@rownum := IF(@prev_type = asset_type, @rownum + 1, 1)) as rn,
                    (@prev_type := asset_type) as dummy
                FROM nlp_clusters, (SELECT @rownum := 0, @prev_type := '') as vars
                ORDER BY asset_type, cluster_id DESC
            ) n ON a.asset_type = n.asset_type AND n.rn = 1
             where a.status = 'Aktif'
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