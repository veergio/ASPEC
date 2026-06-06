import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

interface AssetDBRow {
    asset_id: number;
    asset_name: string;
    building: string | null;
    floor: number | null;
    zone: string | null;
    predicted_rul: number | null;
    critical_level: string;
}

interface DistinctStringRow { value: string; }
interface DistinctNumberRow { value: number; }

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);

        // ── FITUR 1: Handle Request Dropdown Options (DISTINCT) ──
        if (searchParams.get("options") === "true") {
            const [
                assetTypesResult,
                buildingsResult,
                floorsResult,
                zonesResult,
                categoriesResult,
                subCategoriesResult,
                criticalLevelsResult
            ] = await Promise.all([
                query<DistinctStringRow>("SELECT DISTINCT asset_type as value FROM assets WHERE asset_type IS NOT NULL ORDER BY asset_type ASC"),
                query<DistinctStringRow>("SELECT DISTINCT building as value FROM assets WHERE building IS NOT NULL ORDER BY building ASC"),
                query<DistinctNumberRow>("SELECT DISTINCT floor as value FROM assets WHERE floor IS NOT NULL ORDER BY floor ASC"),
                query<DistinctStringRow>("SELECT DISTINCT zone as value FROM assets WHERE zone IS NOT NULL ORDER BY zone ASC"),
                query<DistinctStringRow>("SELECT DISTINCT category as value FROM assets WHERE category IS NOT NULL ORDER BY category ASC"),
                query<DistinctStringRow>("SELECT DISTINCT sub_category as value FROM assets WHERE sub_category IS NOT NULL ORDER BY sub_category ASC"),
                query<DistinctStringRow>("SELECT DISTINCT critical_level as value FROM assets WHERE critical_level IS NOT NULL ORDER BY critical_level ASC")
            ]);

            return NextResponse.json({
                success: true,
                data: {
                    asset_types: assetTypesResult.map(r => r.value),
                    buildings: buildingsResult.map(r => r.value),
                    floors: floorsResult.map(r => r.value),
                    zones: zonesResult.map(r => r.value),
                    categories: categoriesResult.map(r => r.value),
                    sub_categories: subCategoriesResult.map(r => r.value),
                    critical_levels: criticalLevelsResult.map(r => r.value)
                }
            });
        }

        // ── FITUR 2: Hitung Agregasi Komplain & Biaya Berdasarkan Lokasi & Tipe ──
        if (searchParams.get("metrics") === "true") {
            const building = searchParams.get("building") || "";
            const floor = searchParams.get("floor") ? Number(searchParams.get("floor")) : null;
            const zone = searchParams.get("zone") || "";
            const assetType = searchParams.get("type") || "";

            const assetRows = await query<{ asset_id: number }>(
                `SELECT asset_id FROM assets  WHERE building = ? AND floor <=> ? AND zone <=> ? AND asset_type = ?`,
                [building, floor, zone, assetType]
            );

            if (assetRows.length === 0) {
                return NextResponse.json({
                    success: true,
                    data: { total_komplain: 0, total_biaya_perbaikan: 0.0 }
                });
            }

            const assetIds = assetRows.map(r => r.asset_id);
            const placeholders = assetIds.map(() => "?").join(",");

            const metricsResult = await query<{ total_komplain: number; total_biaya: string | null }>(
                `SELECT 
                    COUNT(ticket_id) as total_komplain,
                    SUM(repair_cost) as total_biaya
                 FROM maintenance_logs 
                 WHERE asset_id IN (${placeholders})`,
                assetIds
            );

            return NextResponse.json({
                success: true,
                data: {
                    total_komplain: metricsResult[0]?.total_komplain ? Number(metricsResult[0].total_komplain) : 0,
                    total_biaya_perbaikan: metricsResult[0]?.total_biaya ? parseFloat(metricsResult[0].total_biaya) : 0.0
                }
            });
        }

        // ── LOGIKA GET PAGINATED ASSETS (BAWAAN UTAMA) ──
        const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
        const limit = parseInt(searchParams.get("limit") || "10");
        const search = searchParams.get("search")?.trim().toLowerCase() || "";
        const conditionsParam = searchParams.get("conditions") || "";

        const offset = (page - 1) * limit;
        const queryParams: any[] = [];
        let whereClauses: string[] = [];

        if (search) {
            whereClauses.push("(LOWER(asset_name) LIKE ? OR LOWER(building) LIKE ? OR LOWER(zone) LIKE ?)");
            const searchWildcard = `%${search}%`;
            queryParams.push(searchWildcard, searchWildcard, searchWildcard);
        }

        const remainingRulCalc = `(predicted_rul - (DATEDIFF(CURRENT_DATE, instalation_date) / 365))`;

        const conditionSql = `
            CASE 
                WHEN category IN ('Sistem Pemadam Kebakaran', 'Sistem Proteksi Kebakaran Aktif', 'Security Sistem') THEN
                    CASE 
                        WHEN ${remainingRulCalc} <= 0.25 THEN 'Critical'
                        WHEN ${remainingRulCalc} <= 1.0 THEN 'Warning'
                        ELSE 'Healthy'
                    END
                WHEN category IN ('Sistem Telekomunikasi Gedung', 'Pencatatan Meter') THEN
                    CASE 
                        WHEN ${remainingRulCalc} <= 0.5 THEN 'Critical'
                        WHEN ${remainingRulCalc} <= 2.0 THEN 'Warning'
                        ELSE 'Healthy'
                    END
                WHEN category IN ('Mechanical', 'Electrical', 'Ventilasi Sistem', 'Sistem Transportasi Gedung', 'Sistem Energi') THEN
                    CASE 
                        WHEN ${remainingRulCalc} <= 1.0 THEN 'Critical'
                        WHEN ${remainingRulCalc} <= 3.0 THEN 'Warning'
                        ELSE 'Healthy'
                    END
                WHEN category IN ('Civil', 'Arsitektur', 'Plumbing', 'Distribusi Air') THEN
                    CASE 
                        WHEN ${remainingRulCalc} <= 2.0 THEN 'Critical'
                        WHEN ${remainingRulCalc} <= 5.0 THEN 'Warning'
                        ELSE 'Healthy'
                    END
                WHEN category = 'Latihan Balakar' THEN
                    CASE 
                        WHEN ${remainingRulCalc} <= 0.5 THEN 'Critical'
                        WHEN ${remainingRulCalc} <= 1.5 THEN 'Warning'
                        ELSE 'Healthy'
                    END
                ELSE 'Healthy'
            END
        `;

        if (conditionsParam) {
            const activeConds = conditionsParam.split(",");
            const validConds = activeConds.filter(c => ["Critical", "Warning", "Healthy"].includes(c));

            if (validConds.length > 0) {
                const placeholders = validConds.map(() => "?").join(",");
                whereClauses.push(`(${conditionSql}) IN (${placeholders})`);
                queryParams.push(...validConds);
            }
        }

        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

        const totalCountResult = await query<{ total: number }>(
            `SELECT COUNT(*) as total FROM assets ${whereSql}`,
            queryParams
        );
        const totalItems = totalCountResult[0]?.total || 0;
        const totalPages = Math.ceil(totalItems / limit);

        const dataParams = [...queryParams];
        const dbAssets = await query<AssetDBRow>(
            `SELECT asset_id, asset_name, instalation_date, asset_type, building, floor, zone, predicted_rul, critical_level, category, (${conditionSql}) as derived_condition, ${remainingRulCalc} as remaining_rul 
             FROM assets 
             ${whereSql}
             ORDER BY 
                 CASE 
                     WHEN (${conditionSql}) = 'Critical' AND ${remainingRulCalc} >= 0 THEN 1
                     WHEN (${conditionSql}) = 'Warning' AND ${remainingRulCalc} >= 0 THEN 2
                     WHEN (${conditionSql}) = 'Healthy' AND ${remainingRulCalc} >= 0 THEN 3
                     WHEN (${conditionSql}) = 'Critical' AND ${remainingRulCalc} < 0 THEN 4
                     WHEN (${conditionSql}) = 'Warning' AND ${remainingRulCalc} < 0 THEN 5
                     WHEN (${conditionSql}) = 'Healthy' AND ${remainingRulCalc} < 0 THEN 6
                     ELSE 7
                 END ASC,
                 CASE WHEN predicted_rul IS NULL THEN 1 ELSE 0 END, 
                 ${remainingRulCalc} ASC
             LIMIT ${limit} OFFSET ${offset}`,
            dataParams
        );

        return NextResponse.json({
            success: true,
            data: dbAssets,
            pagination: {
                totalItems,
                totalPages,
                currentPage: page,
                limit
            }
        });
    } catch (error) {
        console.error("[GET_PAGINATED_ASSETS_ERROR]", error);
        return NextResponse.json(
            { success: false, message: "Gagal memuat telemetry data dari server" },
            { status: 500 }
        );
    }
}

function formatDateForDB(dateStr: any): string | null {
    if (!dateStr) return null;
    let cleanStr = String(dateStr).trim();
    if (!cleanStr) return null;

    // Check for DD/MM/YYYY or DD-MM-YYYY
    const dmyRegex = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/;
    const match = cleanStr.match(dmyRegex);
    if (match) {
        const [_, day, month, year, hour = '00', minute = '00', second = '00'] = match;
        const pad = (s: string) => s.padStart(2, '0');
        return `${year}-${pad(month)}-${pad(day)} ${pad(hour)}:${pad(minute)}:${pad(second)}`;
    }

    // Try normal Date parsing
    const d = new Date(cleanStr);
    if (!isNaN(d.getTime())) {
        const pad = (n: number) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    }

    // Fallback: if it's already YYYY-MM-DD format, return it
    if (/^\d{4}-\d{2}-\d{2}/.test(cleanStr)) {
        return cleanStr;
    }

    return null;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const {
            asset_name,
            asset_brand,
            asset_model,
            category,
            sub_category,
            asset_type,
            building,
            floor,
            zone,
            critical_level,
            instalation_date,
            operational_hours,
            total_komplain,
            total_biaya_perbaikan,
            complaints
        } = body;

        // Validasi kolom-kolom wajib (sesuai aturan NOT NULL database)
        if (!asset_name || !asset_type || !category || !building || !floor || !instalation_date) {
            return NextResponse.json(
                { success: false, message: "Missing required fields (name, type, category, building, floor, instalation_date)" },
                { status: 400 }
            );
        }

        // 🌟 QUERY INSERT SEKARANG MENCAKUP SEMUA KOLOM DI DATABASE ANDA
        const insertQuery = `
            INSERT INTO assets (
                asset_name, asset_brand, asset_model, category, sub_category, 
                asset_type, building, floor, zone, critical_level, 
                instalation_date, operational_hours, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Aktif')
        `;

        const result = await query(insertQuery, [
            asset_name,
            asset_brand || null,
            asset_model || null,
            category,
            sub_category || null,
            asset_type,
            building,
            Number(floor),
            zone || null,
            critical_level || 'Healthy',
            typeof instalation_date === 'string' ? instalation_date.split('T')[0] : instalation_date, // Pastikan format DATE murni YYYY-MM-DD
            operational_hours ? parseFloat(operational_hours) : 0.0
        ]);

        // mysql2 returns ResultSetHeader for INSERT (not a row array),
        // but our query() helper casts it as T[]. Access insertId directly.
        const newAssetId = (result as any).insertId ?? (result as any)[0]?.insertId;

        if (!newAssetId) {
            throw new Error("Gagal mendapatkan auto_increment ID dari database.");
        }

        // Insert complaints from CSV if present
        if (complaints && Array.isArray(complaints) && complaints.length > 0) {
            for (const comp of complaints) {
                // technician_id has FK constraint to users table — CSV values won't match, so default to null
                const technician_id = null;
                const planned_date = comp.planned_date ? formatDateForDB(comp.planned_date) : null;
                const started_date = comp.started_date ? formatDateForDB(comp.started_date) : null;
                const completed_date = comp.completed_date ? formatDateForDB(comp.completed_date) : null;
                const issue_type = comp.issue_type || null;
                const severity = comp.severity || null;
                const root_cause = comp.root_cause || null;
                const spare_parts_used = comp.spare_parts_used || null;
                const repair_cost = comp.repair_cost ? parseFloat(comp.repair_cost) : null;
                const is_embedded = comp.is_embedded !== undefined ? Number(comp.is_embedded) : 0;

                await query(
                    `INSERT INTO maintenance_logs (
                        asset_id, technician_id, planned_date, started_date, completed_date,
                        issue_type, severity, root_cause, spare_parts_used, repair_cost, is_embedded
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        newAssetId,
                        technician_id,
                        planned_date,
                        started_date,
                        completed_date,
                        issue_type,
                        severity,
                        root_cause,
                        spare_parts_used,
                        repair_cost,
                        is_embedded
                    ]
                );
            }
        }

        // Hit External API (FastAPI) untuk menghitung RUL dan mengupdate DB secara internal
        const aiEngineUrl = "http://localhost:8000/api/predict-xgboost-rul";

        let calculatedOperatingHours = 0.0;
        if (instalation_date && operational_hours) {
            const installDate = new Date(instalation_date);
            const today = new Date();
            const diffTime = today.getTime() - installDate.getTime();
            const diffDays = diffTime > 0 ? diffTime / (1000 * 60 * 60 * 24) : 0;
            calculatedOperatingHours = parseFloat(operational_hours) * diffDays * (5 / 7);
        }

        const aiResponse = await fetch(aiEngineUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                asset_id: newAssetId,
                tipe: asset_type,
                "lokasi_gedung": building,
                "lokasi_lantai": Number(floor),
                "lokasi_zona": zone || "",
                "operating_hours": calculatedOperatingHours,
                "total_komplain": Number(total_komplain || 0),
                "total_biaya_perbaikan": parseFloat(total_biaya_perbaikan || 0)
            })
        });

        const aiData = await aiResponse.json();

        if (!aiResponse.ok) {
            console.error("[AI_ENGINE_WARNING]", aiData);
            return NextResponse.json({
                success: true,
                asset_id: newAssetId,
                message: "Asset berhasil dibuat, tetapi~ gagal memicu kalkulasi otomatis AI Engine."
            });
        }

        if (aiData.predicted_rul !== undefined) {
            await query(
                `UPDATE assets SET predicted_rul = ? WHERE asset_id = ?`,
                [aiData.predicted_rul, newAssetId]
            );
        }

        return NextResponse.json({
            success: true,
            asset_id: newAssetId,
            predicted_rul: aiData.predicted_rul,
            message: "Asset berhasil ditambahkan dan nilai RUL berhasil diprediksi oleh AI Engine!"
        });

    } catch (error: any) {
        console.error("[POST_ASSET_ERROR]", error);
        return NextResponse.json(
            { success: false, message: error.message || "Gagal menyimpan asset baru" },
            { status: 500 }
        );
    }
}