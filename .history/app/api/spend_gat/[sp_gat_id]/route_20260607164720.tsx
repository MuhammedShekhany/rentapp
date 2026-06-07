import { NextResponse } from "next/server";
import db from "@/app/lib/db";

type Params = {
  params: Promise<{ sp_gat_id: string }>;
};

// ======================
// GET single spend_gat
// ======================
export async function GET(req: Request, { params }: Params) {
  try {
    const { sp_gat_id } = await params;

    const [rows]: any = await db.execute(
      `
      SELECT
        sg.sp_gat_id,
        sg.sp_gat_no,
        sg.sp_gat_name,
        sg.br_id,
        sg.user_id,
        sg.createat,

        b.br_name,
        u.user_name

      FROM spend_gat sg

      LEFT JOIN branch b ON sg.br_id = b.br_id
      LEFT JOIN user u ON sg.user_id = u.user_id

      WHERE sg.sp_gat_id = ?
      `,
      [sp_gat_id]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json({
        success: false,
        message: "Spend group not found",
      });
    }

    return NextResponse.json({
      success: true,
      spend_gat: rows[0],
    });

  } catch (error) {
    console.error("GET spend_gat by id error:", error);

    return NextResponse.json({
      success: false,
      message: "Server error",
    });
  }
}

// ======================
// PUT update spend_gat
// ======================
export async function PUT(req: Request, { params }: Params) {
  try {
    const { sp_gat_id } = await params;

    const body = await req.json();

    const {
      sp_gat_name,
      br_id,
      user_id,
    } = body;

    if (!sp_gat_name || !br_id || !user_id) {
      return NextResponse.json({
        success: false,
        message: "Please fill all required fields",
      });
    }

    const [result]: any = await db.execute(
      `
      UPDATE spend_gat
      SET
        sp_gat_name = ?,
        br_id = ?,
        user_id = ?
      WHERE sp_gat_id = ?
      `,
      [
        sp_gat_name,
        br_id,
        user_id,
        sp_gat_id,
      ]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({
        success: false,
        message: "Not found or not updated",
      });
    }

    return NextResponse.json({
      success: true,
      message: "Spend group updated successfully",
    });

  } catch (error) {
    console.error("PUT spend_gat error:", error);

    return NextResponse.json({
      success: false,
      message: "Server error",
    });
  }
}

// ======================
// DELETE spend_gat
// ======================
export async function DELETE(req: Request, { params }: Params) {
  try {
    const { sp_gat_id } = await params;

    const [result]: any = await db.execute(
      `DELETE FROM spend_gat WHERE sp_gat_id = ?`,
      [sp_gat_id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({
        success: false,
        message: "Delete failed",
      });
    }

    return NextResponse.json({
      success: true,
      message: "Deleted successfully",
    });

  } catch (error) {
    console.error("DELETE spend_gat error:", error);

    return NextResponse.json({
      success: false,
      message: "Server error",
    });
  }
}