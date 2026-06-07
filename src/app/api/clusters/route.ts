import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const runId = searchParams.get("run_id");
    const clusterId = searchParams.get("cluster_id");
    const date = searchParams.get("date"); // yyyy-mm-dd

    try {
        if (clusterId) {
            // Fetch maintenance logs for a specific cluster with Technician Name
            const logsSql = `
                SELECT 
                    ml.ticket_id, 
                    ml.asset_id, 
                    ml.issue_type as title, 
                    ml.severity as tag, 
                    ml.root_cause as note, 
                    ml.completed_date,
                    a.asset_name,
                    u.name as technician_name
                FROM maintenance_logs ml
                JOIN maintenance_log_clusters mlc ON ml.ticket_id = mlc.ticket_id
                JOIN assets a ON ml.asset_id = a.asset_id
                LEFT JOIN users u ON ml.technician_id = u.user_id
                WHERE mlc.cluster_id = ?
                ORDER BY ml.completed_date DESC
            `;
            const logs = await query(logsSql, [clusterId]);
            return NextResponse.json({ success: true, logs });
        }

        if (runId) {
            // Fetch all clusters for a specific run
            const clustersSql = `
                SELECT 
                    cluster_id, 
                    cluster_index, 
                    dominant_damage, 
                    dominant_cause, 
                    dominant_spare_part, 
                    average_cost, 
                    member_count
                FROM nlp_clusters
                WHERE run_id = ?
                ORDER BY cluster_index ASC
            `;
            const clusters = await query(clustersSql, [runId]);
            return NextResponse.json({ success: true, clusters });
        }

        // Fetch unique asset types with their LATEST run info, optionally filtered by date
        let runsSql = `
            WITH latest_runs AS (
                SELECT 
                    run_id, 
                    asset_type, 
                    best_k, 
                    silhouette_score, 
                    created_at,
                    ROW_NUMBER() OVER (PARTITION BY asset_type ORDER BY created_at DESC) as rn
                FROM clustering_runs
                ${date ? 'WHERE DATE(created_at) = ?' : ''}
            )
            SELECT 
                run_id, 
                asset_type, 
                best_k, 
                silhouette_score, 
                created_at
            FROM latest_runs
            WHERE rn = 1
            ORDER BY created_at DESC
        `;
        const params: any[] = [];
        if (date) {
            params.push(date);
        }

        const runs = await query(runsSql, params);
        return NextResponse.json({ success: true, runs });

    } catch (error) {
        console.error("[CLUSTERS_API_ERROR]", error);
        return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
    }
}
