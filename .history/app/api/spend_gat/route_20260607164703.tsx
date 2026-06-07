import { NextResponse } from "next/server";
import db from "@/app/lib/db";

// ======================
// GET ALL spend_gat
// ======================
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const br_id = searchParams.get("br_id");

    // Guardrail validation for GET request
    if (!br_id) {
      return NextResponse.json({
        success: false,
        message: "br_id is required",
      });
    }

    const [rows]: any = await db.execute(
      `
      SELECT
        sg.sp_gat_id,
        sg.sp_gat_no, -- Added your custom sequential number column here
        sg.sp_gat_name,
        sg.br_id,
        sg.user_id,
        sg.createat,

        b.br_name,
        u.user_name

      FROM spend_gat sg

      LEFT JOIN branch b
      ON sg.br_id = b.br_id

      LEFT JOIN user u
      ON sg.user_id = u.user_id

      WHERE sg.br_id = ?

      ORDER BY sg.sp_gat_id DESC
      `,
      [br_id]
    );

    return NextResponse.json({
      success: true,
      spend_gat: rows,
    });

  } catch (error) {
    console.error("GET spend_gat error:", error);
    return NextResponse.json({
      success: false,
      message: "Server error",
    });
  }
}

// ======================
// POST spend_gat
// ======================
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      sp_gat_name,
      br_id,
      user_id,
    } = body;

    // ======================
    // VALIDATION
    // ======================
    if (!sp_gat_name || !br_id || !user_id) {
      return NextResponse.json({
        success: false,
        message: "Please fill all required fields",
      });
    }

    // ======================
    // INSERT (With automatic per-branch counter)
    // ======================
    const [result]: any = await db.execute(
      `
      INSERT INTO spend_gat
      (
        sp_gat_name,
        br_id,
        user_id,
        createat,
        sp_gat_no
      )
      VALUES (?, ?, ?, NOW(), (SELECT COALESCE(MAX(sg.sp_gat_no), 0) + 1 FROM spend_gat sg WHERE sg.br_id = ?))
      `,
      [
        sp_gat_name,
        br_id,
        user_id,
        br_id // Provided here to match the subquery WHERE clause parameter
      ]
    );

    return NextResponse.json({
      success: true,
      message: "Spend group added successfully",
      sp_gat_id: result.insertId,
    });

  } catch (error) {
    console.error("POST spend_gat error:", error);

    // Trap parallel click concurrency overlap issues cleanly
    if ((error as any).code === 'ER_DUP_ENTRY') {
      return NextResponse.json({
        success: false,
        message: "Conflict detected due to simultaneous entry. Please try saving again.",
      }, { status: 409 });
    }

    return NextResponse.json({
      success: false,
      message: "Server error",
    });
  }
}