import { NextResponse } from "next/server";
import db from "@/app/lib/db";

// ======================
// GET ALL CATEGORIES
// ======================
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

    // Cleaned up the query logic since br_id is guaranteed to exist here
    const query = `
      SELECT
        pg.pro_gat_id,
        pg.pro_gat_no, -- Added your custom sequential number column here
        pg.pro_gat_name,
        pg.br_id,
        pg.user_id,
        b.br_name,
        u.user_name
      FROM pro_gat pg
      LEFT JOIN branch b ON pg.br_id = b.br_id
      LEFT JOIN user u ON pg.user_id = u.user_id 
      WHERE pg.br_id = ?
      ORDER BY pg.pro_gat_id DESC`;

    const [rows]: any = await db.execute(query, [br_id]);
    
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

    if (!pro_gat_name || !br_id || !user_id) {
      return NextResponse.json({
        success: false,
        message: "Please fill all required fields",
      });
    }

    // Using the scoped subquery to securely fetch the max per-branch number and add 1
    await db.execute(
      `INSERT INTO pro_gat
        (
          pro_gat_name,
          br_id,
          user_id,
          pro_gat_no
        )
       VALUES (?, ?, ?, (SELECT COALESCE(MAX(pg.pro_gat_no), 0) + 1 FROM pro_gat pg WHERE pg.br_id = ?))`,
      [
        pro_gat_name,
        br_id,
        user_id,
        br_id // Maps to the subquery WHERE clause parameter
      ]
    );

    return NextResponse.json({
      success: true,
      message: "Category added successfully",
    });
  } catch (error) {
    console.error("ADD PRO GAT ERROR:", error);

    // Safeguard for duplicate simultaneous hits
    if ((error as any).code === 'ER_DUP_ENTRY') {
      return NextResponse.json({
        success: false,
        message: "Conflict detected due to simultaneous creation. Please try again."
      }, { status: 409 });
    }

    return NextResponse.json({
      success: false,
      message: "Server error",
    });
  }
}