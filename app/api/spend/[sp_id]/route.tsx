import { NextResponse } from "next/server";
import db from "@/app/lib/db";

type Params = {
  params: Promise<{ sp_id: string }>;
};

// ======================
// GET single spend
// ======================
export async function GET(req: Request, { params }: Params) {
  try {
    const { sp_id } = await params;

    const [rows]: any = await db.execute(
      `SELECT

        s.sp_id,
        s.sp_total,
        s.sp_date,
        s.sp_detail,

        s.br_id,
        s.user_id,

        s.createat,

        s.sp_gat_id,

        b.br_name,

        u.user_name,

        sg.sp_gat_name

      FROM spend s

      LEFT JOIN branch b
      ON s.br_id = b.br_id

      LEFT JOIN user u
      ON s.user_id = u.user_id

      LEFT JOIN spend_gat sg
      ON s.sp_gat_id = sg.sp_gat_id
      WHERE s.sp_id = ?`,
      [sp_id]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json({
        success: false,
        message: "Spend not found",
      });
    }

    return NextResponse.json({
      success: true,
      spend: rows[0],
    });
  } catch (error) {
    console.error("GET spend by id error:", error);
    return NextResponse.json({
      success: false,
      message: "Server error",
    });
  }
}

// ======================
// PUT update spend
// ======================
export async function PUT(req: Request, { params }: Params) {
  try {
    const { sp_id } = await params;
    const body = await req.json();

    const {
      sp_total,
      sp_date,
      sp_detail,
      br_id,
      user_id,
      sp_gat_id, // 🔥 ADD THIS
    } = body;

    if (!sp_total || !sp_date || !br_id || !user_id) {
      return NextResponse.json({
        success: false,
        message: "Please fill all required fields",
      });
    }

    const [result]: any = await db.execute(
      `UPDATE spend
       SET
         sp_total = ?,
         sp_date = ?,
         sp_detail = ?,
         sp_gat_id = ?,   -- 🔥 ADD THIS
         br_id = ?,
         user_id = ?
       WHERE sp_id = ?`,
      [
        Number(sp_total || 0),
        sp_date,
        sp_detail || "",
        sp_gat_id || null, // 🔥 ADD THIS
        br_id,
        user_id,
        sp_id,
      ]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({
        success: false,
        message: "Spend not found or not updated",
      });
    }

    return NextResponse.json({
      success: true,
      message: "Spend updated successfully",
    });
  } catch (error) {
    console.error("PUT spend error:", error);
    return NextResponse.json({
      success: false,
      message: "Server error",
    });
  }
}

// ======================
// DELETE spend
// ======================
export async function DELETE(req: Request, { params }: Params) {
  try {
    const { sp_id } = await params;

    const [result]: any = await db.execute(
      "DELETE FROM spend WHERE sp_id = ?",
      [sp_id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({
        success: false,
        message: "Delete failed",
      });
    }

    return NextResponse.json({
      success: true,
      message: "Spend deleted successfully",
    });
  } catch (error) {
    console.error("DELETE spend error:", error);
    return NextResponse.json({
      success: false,
      message: "Server error",
    });
  }
}