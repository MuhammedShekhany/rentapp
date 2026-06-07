import { NextResponse } from "next/server";
import pool from "@/app/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const br_id = searchParams.get("br_id");

    let query = `
      SELECT 
          p.pro_id,
          p.pro_no,
          p.pro_name,
          p.pro_price,
          p.pro_img,
          p.pro_gat_id,
          p.br_id,
          p.user_id,
          pg.pro_gat_name,
          b.br_name,
          u.user_name
      FROM product p
      LEFT JOIN pro_gat pg ON p.pro_gat_id = pg.pro_gat_id
      LEFT JOIN branch b ON p.br_id = b.br_id
      LEFT JOIN user u ON p.user_id = u.user_id
    `;

    const params: any[] = [];

    if (br_id) {
      query += ` WHERE p.br_id = ?`;
      params.push(br_id);
    }

    query += ` ORDER BY p.pro_id DESC`;

    const [rows]: any = await pool.execute(query, params);

    return NextResponse.json({
      success: true,
      product: rows,
    });
  } catch (error) {
    console.error("GET PRODUCT ERROR:", error);

    return NextResponse.json({
      success: false,
      message: "Server error",
    });
  }
}




export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      pro_name,
      br_id,
      user_id,
      pro_price,
      pro_gat_id,
      pro_img,
    } = body;

    if (
      !pro_name ||
      !br_id ||
      !user_id ||
      !pro_gat_id ||
      pro_price === undefined
    ) {
      return NextResponse.json({
        success: false,
        message: "Please fill all required fields",
      });
    }

    // The subquery now searches for the max pro_no *for this specific branch*
    await pool.execute(
      `INSERT INTO product
        (
          pro_name,
          br_id,
          user_id,
          pro_price,
          pro_gat_id,
          pro_img,
          pro_no
        )
       VALUES (?, ?, ?, ?, ?, ?, (SELECT COALESCE(MAX(p.pro_no), 0) + 1 FROM product p WHERE p.br_id = ?))`,
      [
        pro_name,
        br_id,
        user_id,
        pro_price,
        pro_gat_id,
        pro_img || "",
        br_id // Passed a second time for the subquery WHERE clause
      ]
    );

    return NextResponse.json({
      success: true,
      message: "Product added successfully",
    });
  } catch (error) {
    console.error("ADD PRODUCT ERROR:", error);

    if ((error as any).code === 'ER_DUP_ENTRY') {
      return NextResponse.json({
        success: false,
        message: "Conflict detected due to simultaneous entry. Please try again.",
      }, { status: 409 });
    }

    return NextResponse.json({
      success: false,
      message: "Server error",
    });
  }
}