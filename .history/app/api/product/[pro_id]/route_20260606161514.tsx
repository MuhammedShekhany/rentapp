import { NextResponse } from "next/server";
import pool from "@/app/lib/db";

type Params = {
  params: Promise<{ pro_id: string }>;
};

// ======================
// GET ONE PRODUCT
// ======================
export async function GET(req: Request, { params }: Params) {
  try {
    const { pro_id } = await params;

    const [rows]: any = await pool.execute(
      `SELECT 
          p.pro_id,
          p.pro_no,
          p.pro_name,
          p.br_id,
          p.user_id,
          p.pro_price,
          p.pro_img,
          p.pro_gat_id,

          pg.pro_gat_name,
          b.br_name,
          b.br_header,
          u.user_name

       FROM product p
       LEFT JOIN pro_gat pg ON p.pro_gat_id = pg.pro_gat_id
       LEFT JOIN branch b ON p.br_id = b.br_id
       LEFT JOIN user u ON p.user_id = u.user_id
       WHERE p.pro_id = ?`,
      [pro_id]
    );

    if (rows.length === 0) {
      return NextResponse.json({
        success: false,
        message: "Product not found",
      });
    }

    return NextResponse.json({
      success: true,
      product: rows[0],
    });
  } catch (error) {
    console.error("GET ONE PRODUCT ERROR:", error);

    return NextResponse.json({
      success: false,
      message: "Server error",
    });
  }
}

// ======================
// UPDATE PRODUCT
// ======================
export async function PUT(req: Request, { params }: Params) {
  try {
    const { pro_id } = await params;

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

    await pool.execute(
      `UPDATE product
       SET 
          pro_name = ?,
          br_id = ?,
          user_id = ?,
          pro_price = ?,
          pro_gat_id = ?,
          pro_img = ?
       WHERE pro_id = ?`,
      [
        pro_name,
        br_id,
        user_id,
        pro_price,
        pro_gat_id,
        pro_img || "",
        pro_id,
      ]
    );

    return NextResponse.json({
      success: true,
      message: "Product updated successfully",
    });
  } catch (error) {
    console.error("UPDATE PRODUCT ERROR:", error);

    return NextResponse.json({
      success: false,
      message: "Server error",
    });
  }
}

// ======================
// DELETE PRODUCT
// ======================
export async function DELETE(req: Request, { params }: Params) {
  try {
    const { pro_id } = await params;

    await pool.execute(
      `DELETE FROM product WHERE pro_id = ?`,
      [pro_id]
    );

    return NextResponse.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("DELETE PRODUCT ERROR:", error);

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
  const body = await req.json();

  const {
    pro_name,
    br_id,
    user_id,
    pro_price,
    pro_gat_id,
    pro_img,
  } = body;

  if (!pro_name || !br_id || !user_id || !pro_gat_id || pro_price === undefined) {
    return NextResponse.json({
      success: false,
      message: "Please fill all required fields",
    });
  }

  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // 1. increase counter per branch
    await conn.execute(
      `UPDATE branch_product_counter
       SET last_pro_no = last_pro_no + 1
       WHERE br_id = ?`,
      [br_id]
    );

    // 2. get new number
    const [counter]: any = await conn.execute(
      `SELECT last_pro_no FROM branch_product_counter WHERE br_id = ?`,
      [br_id]
    );

    const pro_no = counter[0].last_pro_no;

    // 3. insert product
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
      message: "Product created successfully",
      pro_no,
    });

  } catch (error) {
    await conn.rollback();
    conn.release();

    console.error("CREATE PRODUCT ERROR:", error);

    return NextResponse.json({
      success: false,
      message: "Server error",
    });
  }
}