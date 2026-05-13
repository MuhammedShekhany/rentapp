import { NextResponse } from "next/server";
import pool from "@/app/lib/db";

export async function GET() {
  try {
    const [rows]: any = await pool.execute(
      `
      SELECT 
        s.sub_id,
        s.sub_s_date,
        s.sub_e_date,
        s.sub_amount,
        s.br_id,
        s.user_id,
        b.br_name,
        u.user_name
      FROM sub s
      LEFT JOIN branch b ON s.br_id = b.br_id
      LEFT JOIN \`user\` u ON s.user_id = u.user_id
      ORDER BY s.sub_id DESC
      `
    );

    return NextResponse.json({
      success: true,
      subscription: rows,
    });
  } catch (error) {
    console.error("GET SUBSCRIPTION ERROR:", error);
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
      sub_s_date,
      sub_e_date,
      sub_amount,
      br_id,
      user_id,
    } = body;

    if (!sub_s_date || !sub_e_date || !sub_amount || !br_id || !user_id) {
      return NextResponse.json({
        success: false,
        message: "Please fill all required fields",
      });
    }

    await pool.execute(
      `
      INSERT INTO sub(
        sub_s_date,
        sub_e_date,
        sub_amount,
        br_id,
        user_id
      )
      VALUES (?, ?, ?, ?, ?)
      `,
      [sub_s_date, sub_e_date, sub_amount, br_id, user_id]
    );

    return NextResponse.json({
      success: true,
      message: "Subscription added successfully",
    });
  } catch (error) {
    console.error("ADD SUBSCRIPTION ERROR:", error);
    return NextResponse.json({
      success: false,
      message: "Server error",
    });
  }
}