import { NextResponse } from "next/server";
import pool from "@/app/lib/db";

// ======================
// GET ALL CATEGORIES
// ======================
import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const br_id = searchParams.get("br_id");

    if (!br_id) {
      return NextResponse.json({
        success: false,
        message: "br_id is required",
      });
    }

    const [rows]: any = await pool.execute(
      `SELECT
          pg.pro_gat_id,
          pg.pro_gat_name,
          pg.br_id,
          pg.user_id,
          b.br_name,
          u.user_name
       FROM pro_gat pg
       LEFT JOIN branch b ON pg.br_id = b.br_id
       LEFT JOIN user u ON pg.user_id = u.user_id
       WHERE pg.br_id = ?
       ORDER BY pg.pro_gat_id DESC`,
      [br_id]
    );

    return NextResponse.json({
      success: true,
      pro_gat: rows,
    });
  } catch (error) {
    console.error("GET PRO GAT ERROR:", error);

    return NextResponse.json({
      success: false,
      message: "Server error",
    });
  }
}

// ======================
// ADD CATEGORY
// ======================
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      pro_gat_name,
      br_id,
      user_id,
    } = body;

    if (
      !pro_gat_name ||
      !br_id ||
      !user_id
    ) {
      return NextResponse.json({
        success: false,
        message: "Please fill all required fields",
      });
    }

    await pool.execute(
      `INSERT INTO pro_gat
        (
          pro_gat_name,
          br_id,
          user_id
        )
       VALUES (?, ?, ?)`,
      [
        pro_gat_name,
        br_id,
        user_id,
      ]
    );

    return NextResponse.json({
      success: true,
      message: "Category added successfully",
    });
  } catch (error) {
    console.error("ADD PRO GAT ERROR:", error);

    return NextResponse.json({
      success: false,
      message: "Server error",
    });
  }
}