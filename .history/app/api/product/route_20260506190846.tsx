import { NextResponse } from "next/server";
import pool from "@/app/lib/db";

export async function GET() {
  try {
    const [rows]: any = await pool.execute(
      `SELECT 
          p.pro_id,
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

       LEFT JOIN pro_gat pg 
         ON p.pro_gat_id = pg.pro_gat_id

       LEFT JOIN branch b 
         ON p.br_id = b.br_id

       LEFT JOIN user u 
         ON p.user_id = u.user_id

       ORDER BY p.pro_id DESC`
    );

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

    await pool.execute(
      `INSERT INTO product
        (
          pro_name,
          br_id,
          user_id,
          pro_price,
          pro_gat_id,
          pro_img
        )
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        pro_name,
        br_id,
        user_id,
        pro_price,
        pro_gat_id,
        pro_img || "",
      ]
    );

    return NextResponse.json({
      success: true,
      message: "Product added successfully",
    });
  } catch (error) {
    console.error("ADD PRODUCT ERROR:", error);

    return NextResponse.json({
      success: false,
      message: "Server error",
    });
  }
}