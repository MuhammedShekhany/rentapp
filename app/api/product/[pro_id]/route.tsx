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

       LEFT JOIN pro_gat pg 
         ON p.pro_gat_id = pg.pro_gat_id

       LEFT JOIN branch b 
         ON p.br_id = b.br_id

       LEFT JOIN user u 
         ON p.user_id = u.user_id

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