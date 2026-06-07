import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

function formatDateForDB(dateVal: any): string | null {
  if (!dateVal) return null;
  const d = new Date(dateVal);
  if (!isNaN(d.getTime())) {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }
  return null;
}

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const logsSql = `
      SELECT 
        m.ticket_id, 
        m.asset_id, 
        a.asset_name, 
        m.planned_date, 
        m.started_date, 
        m.completed_date, 
        m.issue_type, 
        m.severity, 
        m.root_cause, 
        m.spare_parts_used, 
        m.repair_cost, 
        m.is_embedded, 
        u.name as technician_name
      FROM maintenance_logs m
      LEFT JOIN assets a ON m.asset_id = a.asset_id
      LEFT JOIN users u ON m.technician_id = u.user_id
      ORDER BY COALESCE(m.completed_date, m.started_date, m.planned_date) DESC, m.ticket_id DESC
    `;

    const logs = await query(logsSql);

    return NextResponse.json({
      success: true,
      data: logs
    });
  } catch (error: any) {
    console.error("[GET_MAINTENANCE_ERROR]", error);
    return NextResponse.json(
      { success: false, message: error.message || "Gagal memuat riwayat laporan." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Silakan login terlebih dahulu." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      asset_id,
      planned_date,
      started_date,
      completed_date,
      issue_type,
      severity,
      root_cause,
      spare_parts_used,
      repair_cost
    } = body;

    if (!asset_id) {
      return NextResponse.json(
        { success: false, message: "Aset wajib dipilih." },
        { status: 400 }
      );
    }

    const plannedDateFormatted = formatDateForDB(planned_date);
    const startedDateFormatted = formatDateForDB(started_date);
    const completedDateFormatted = formatDateForDB(completed_date);

    // Filter non-digits from string cost, e.g. Rp 2.450.000 -> 2450000
    let cleanCost: number | null = null;
    if (repair_cost !== undefined && repair_cost !== null && repair_cost !== "") {
      const parsed = parseFloat(String(repair_cost).replace(/\D/g, ""));
      if (!isNaN(parsed)) {
        cleanCost = parsed;
      }
    }

    const insertQuery = `
      INSERT INTO maintenance_logs (
        asset_id, technician_id, planned_date, started_date, completed_date,
        issue_type, severity, root_cause, spare_parts_used, repair_cost, is_embedded
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `;

    const result = await query(insertQuery, [
      Number(asset_id),
      user.user_id,
      plannedDateFormatted,
      startedDateFormatted,
      completedDateFormatted,
      issue_type || null,
      severity || "Low",
      root_cause || null,
      spare_parts_used || null,
      cleanCost,
    ]);

    const newLogId = (result as any).insertId ?? (result as any)[0]?.insertId;

    // Hit API ChromaDB untuk insert ke vector database
    try {
      // Query dan asset_type dari table assets
      const assetRows: any = await query(
        `SELECT asset_type FROM assets WHERE asset_id = ?`,
        [Number(asset_id)]
      );
      const asset = Array.isArray(assetRows) && assetRows.length > 0 ? assetRows[0] : null;

      const chromaPayload = {
        records: [
          {
            ticket_id: newLogId,
            asset_id: Number(asset_id),
            asset_type: asset?.asset_type || "",
            issue_type: issue_type || "",
            root_cause: root_cause || "",
            spare_parts_used: spare_parts_used || "",
            repair_cost: cleanCost,
          },
        ],
      };

      const chromaRes = await fetch("http://localhost:8000/api/insert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(chromaPayload),
      });

      if (!chromaRes.ok) {
        console.error("[CHROMA_INSERT_FAILED]", chromaRes.status, await chromaRes.text());
      } else {
        console.log("[CHROMA_INSERT_SUCCESS] ticket_id:", newLogId);
      }
    } catch (chromaErr: any) {
      // Non-blocking: jangan gagalkan response utama jika ChromaDB error
      console.error("[CHROMA_INSERT_ERROR]", chromaErr.message || chromaErr);
    }

    return NextResponse.json({
      success: true,
      ticket_id: newLogId,
      message: "Laporan pemeliharaan berhasil disimpan!"
    });
  } catch (error: any) {
    console.error("[POST_MAINTENANCE_ERROR]", error);
    return NextResponse.json(
      { success: false, message: error.message || "Gagal menyimpan laporan pemeliharaan." },
      { status: 500 }
    );
  }
}
