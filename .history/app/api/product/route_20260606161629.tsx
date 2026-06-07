import { NextResponse } from "next/server";
import pool from "@/app/lib/db";

// ======================
// GET PRODUCTS
// ======================
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

    query += ` ORDER BY p.pro_no DESC`;

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

// ======================
// CREATE PRODUCT (WITH pro_no)
// ======================
export async function POST(req: Request) {
  const conn = await pool.getConnection();

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

    await conn.beginTransaction();

    // ======================
    // 1. INCREMENT COUNTER
    // ======================
    await conn.execute(
      `UPDATE branch_product_counter
       SET last_pro_no = last_pro_no + 1
       WHERE br_id = ?`,
      [br_id]
    );

    // ======================
    // 2. GET NEW NUMBER
    // ======================
    const [counter]: any = await conn.execute(
      `SELECT last_pro_no FROM branch_product_counter WHERE br_id = ?`,
      [br_id]
    );

    const pro_no = counter[0].last_pro_no;

    // ======================
    // 3. INSERT PRODUCT
    // ======================
    await conn.execute(
      `INSERT INTO product (
        pro_id,
        pro_no,
        pro_name,
        br_id,
        user_id,
        pro_price,
        pro_gat_id,
        pro_img
      ) VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?)`,
      [
        pro_no,
        pro_name,
        br_id,
        user_id,
        pro_price,
        pro_gat_id,
        pro_img || "",
      ]
    );

    await conn.commit();
    conn.release();

    return NextResponse.json({
      success: true,
      message: "Product added successfully",
      pro_no,
    });

  } catch (error) {
    await conn.rollback();
    conn.release();

    console.error("ADD PRODUCT ERROR:", error);

    return NextResponse.json({
      success: false,
      message: "Server error",
    });
  }
}