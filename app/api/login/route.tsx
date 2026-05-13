import { NextResponse } from "next/server";
import pool from "@/app/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { user_name, user_password, br_id } = body;

    if (!user_name || !user_password || !br_id) {
      return NextResponse.json({
        success: false,
        message: "Missing required fields",
      });
    }

    const [rows]: any = await pool.execute(
      `SELECT 
    u.user_id,
    u.user_name,
    u.user_password,
    u.user_fullname,
    u.user_role,
    u.br_id,
    b.br_name,
    b.br_phone,
    b.br_add

FROM user u

LEFT JOIN branch b 
ON u.br_id = b.br_id
WHERE user_name = ?
       AND user_password = ?
       
       LIMIT 1`,
      [user_name, user_password]
    );

    if (rows.length === 0) {
      return NextResponse.json({
        success: false,
        message: "Invalid username or password",
      });
    }

    const user = rows[0];

    return NextResponse.json({
      success: true,
      user: {
        user_id: user.user_id,
        user_name: user.user_name,
        user_fullname: user.user_fullname, // ✅ الصحيح
        user_role: user.user_role,
        br_id: user.br_id,
      },
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);

    return NextResponse.json({
      success: false,
      message: "Server error",
    });
  }
}