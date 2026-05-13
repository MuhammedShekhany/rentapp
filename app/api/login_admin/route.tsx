import { NextResponse } from "next/server";
import pool from "@/app/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { user_name, user_password } = body;

    if (!user_name || !user_password) {
      return NextResponse.json({
        success: false,
        message: "Missing required fields",
      });
    }

    // =========================
    // ADMIN ONLY LOGIN
    // =========================
    const [rows]: any = await pool.execute(
      `
      SELECT 
        user_id,
        user_name,
        user_fullname,
        user_role
      FROM user
      WHERE user_name = ?
        AND user_password = ?
        AND user_role = 'admin'
      LIMIT 1
      `,
      [user_name, user_password]
    );

    if (rows.length === 0) {
      return NextResponse.json({
        success: false,
        message: "Invalid admin credentials",
      });
    }

    const user = rows[0];

    return NextResponse.json({
      success: true,
      user: {
        user_id: user.user_id,
        user_name: user.user_name,
        user_fullname: user.user_fullname,
        user_role: user.user_role,
      },
    });

  } catch (error) {
    console.error("ADMIN LOGIN ERROR:", error);

    return NextResponse.json({
      success: false,
      message: "Server error",
    });
  }
}