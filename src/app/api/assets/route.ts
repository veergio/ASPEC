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

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);

        const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
        const limit = parseInt(searchParams.get("limit") || "10");
        const search = searchParams.get("search")?.trim().toLowerCase() || "";
        const conditionsParam = searchParams.get("conditions") || "";

        const offset = (page - 1) * limit;
        const queryParams: any[] = [];
        let whereClauses: string[] = [];

        // 1. Filter Search (Nama Asset / Lokasi Gedung / Zona)
        if (search) {
            whereClauses.push("(LOWER(asset_name) LIKE ? OR LOWER(building) LIKE ? OR LOWER(zone) LIKE ?)");
            const searchWildcard = `%${search}%`;
            queryParams.push(searchWildcard, searchWildcard, searchWildcard);
        }

        // 2. 🔴 FILTER KONDISI: Sekarang menggunakan RUL Thresholds (Derived Condition)
        const conditionSql = `
            CASE 
                -- Kelompok 1: Safety & Security
                WHEN category IN ('Sistem Pemadam Kebakaran', 'Sistem Proteksi Kebakaran Aktif', 'Security Sistem') THEN
                    CASE 
                        WHEN predicted_rul <= 0.25 THEN 'Critical'
                        WHEN predicted_rul <= 1.0 THEN 'Warning'
                        ELSE 'Healthy'
                    END
                -- Kelompok 2: IT & Telecom
                WHEN category IN ('Sistem Telekomunikasi Gedung', 'Pencatatan Meter') THEN
                    CASE 
                        WHEN predicted_rul <= 0.5 THEN 'Critical'
                        WHEN predicted_rul <= 2.0 THEN 'Warning'
                        ELSE 'Healthy'
                    END
                -- Kelompok 3: Core Operations (M&E)
                WHEN category IN ('Mechanical', 'Electrical', 'Ventilasi Sistem', 'Sistem Transportasi Gedung', 'Sistem Energi') THEN
                    CASE 
                        WHEN predicted_rul <= 1.0 THEN 'Critical'
                        WHEN predicted_rul <= 3.0 THEN 'Warning'
                        ELSE 'Healthy'
                    END
                -- Kelompok 4: Sipil & Plumbing
                WHEN category IN ('Civil', 'Arsitektur', 'Plumbing', 'Distribusi Air') THEN
                    CASE 
                        WHEN predicted_rul <= 2.0 THEN 'Critical'
                        WHEN predicted_rul <= 5.0 THEN 'Warning'
                        ELSE 'Healthy'
                    END
                -- Kelompok 5: Lainnya (Latihan Balakar)
                WHEN category = 'Latihan Balakar' THEN
                    CASE 
                        WHEN predicted_rul <= 0.5 THEN 'Critical'
                        WHEN predicted_rul <= 1.5 THEN 'Warning'
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

        // ── Query 1: Hitung Total Baris (Penting untuk Pagination) ──────
        const totalCountResult = await query<{ total: number }>(
            `SELECT COUNT(*) as total FROM assets ${whereSql}`,
            queryParams
        );
        const totalItems = totalCountResult[0]?.total || 0;
        const totalPages = Math.ceil(totalItems / limit);

        // ── Query 2: Ambil Data Spesifik Halaman Terkait ────────────────
        // Urutkan NULL di akhir agar data ber-RUL tampil rapi di atas, dilanjutkan sorting ASC
        const dataParams = [...queryParams, limit, offset];
        const dbAssets = await query<AssetDBRow>(
            `SELECT asset_id, asset_name, building, floor, zone, predicted_rul, critical_level, category, (${conditionSql}) as derived_condition 
             FROM assets 
             ${whereSql}
             ORDER BY CASE WHEN predicted_rul IS NULL THEN 1 ELSE 0 END, predicted_rul ASC
             LIMIT ? OFFSET ?`,
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

// ── POST: Tambah Asset Baru ke Database ─────────────────────────────
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { asset_name, building, floor, zone, predicted_rul, critical_level } = body;

        if (!asset_name || !building) {
            return NextResponse.json(
                { success: false, message: "Nama asset dan Gedung wajib diisi" },
                { status: 400 }
            );
        }

        const insertQuery = `
            INSERT INTO assets (
                asset_name, 
                building, 
                floor, 
                zone, 
                predicted_rul, 
                status, 
                critical_level, 
                instalation_date
            ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        `;

        const values = [
            asset_name.trim(),                                      // 1. asset_name
            building.trim(),                                        // 2. building
            floor ? Number(floor) : null,                           // 3. floor (Gunakan null jika tidak diisi agar clean)
            zone ? zone.trim() : null,                              // 4. zone
            predicted_rul !== undefined && predicted_rul !== "" ? Number(predicted_rul) : null, // 5. predicted_rul
            "Aktif",                                                // 6. status default untuk data baru
            critical_level || "Minor"                               // 7. critical_level dikirim dinamis dari form dialog
        ];

        const result = await query<{ insertId: number }>(insertQuery, values);
        const insertId = result[0]?.insertId;

        return NextResponse.json({
            success: true,
            message: "Asset berhasil disimpan",
            asset_id: insertId,
        });
    } catch (error) {
        console.error("[POST_ASSET_ERROR]", error);
        return NextResponse.json(
            { success: false, message: "Internal server error saat menyimpan asset" },
            { status: 500 }
        );
    }
}