import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    const body = await request.json();

    const {
      old_asset_id,
      new_asset_id,
      new_asset_identifier,
      replacement_date,
      replacement_reason,
      replacement_cost,
    } = body;

    // Validation
    if (!old_asset_id || !replacement_date || !replacement_reason || replacement_cost === undefined) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    const insertQuery = `
      INSERT INTO asset_replacements (
        old_asset_id,
        new_asset_id,
        new_asset_identifier,
        replacement_date,
        replacement_reason,
        replacement_cost,
        created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await query(insertQuery, [
      old_asset_id,
      new_asset_id || null,
      new_asset_identifier || null,
      replacement_date,
      replacement_reason,
      replacement_cost,
      user?.user_id || null,
    ]);

    return NextResponse.json({
      success: true,
      message: "Data penggantian berhasil disimpan",
      data: result,
    });
  } catch (error: any) {
    console.error("[POST_ASSET_REPLACEMENT_ERROR]", error);
    return NextResponse.json(
      { success: false, message: error.message || "Gagal menyimpan data penggantian" },
      { status: 500 }
    );
  }
}
