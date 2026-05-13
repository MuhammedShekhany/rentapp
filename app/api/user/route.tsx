import { NextResponse } from "next/server";
import pool from "@/app/lib/db";

// LOAD USERS
export async function GET() {
  try {
    const [rows] = await pool.query(`
      SELECT 
        u.user_id,
        u.user_name,
        u.user_password,
        u.user_fullname,
        u.br_id,
        u.user_role,
        b.br_name
      FROM \`user\` u
      LEFT JOIN branch b ON u.br_id = b.br_id
      ORDER BY u.user_id DESC
    `);

    return NextResponse.json({
      success: true,
      user: rows,
    });
  } catch (error) {
    console.error("GET USER ERROR:", error);
    return NextResponse.json({
      success: false,
      message: "Failed to load users",
    });
  }
}

// ADD USER
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      user_name,
      user_password,
      user_fullname,
      br_id,
      user_role,
    } = body;

    if (!user_name || !user_password || !user_fullname || !br_id || !user_role) {
      return NextResponse.json({
        success: false,
        message: "Please fill all required fields",
      });
    }

    await pool.query(
      `
      INSERT INTO \`user\` (
        user_name,
        user_password,
        user_fullname,
        br_id,
        user_role
      )
      VALUES (?, ?, ?, ?, ?)
      `,
      [user_name, user_password, user_fullname, br_id, user_role]
    );

    return NextResponse.json({
      success: true,
      message: "User added successfully",
    });
  } catch (error) {
    console.error("ADD USER ERROR:", error);
    return NextResponse.json({
      success: false,
      message: "Failed to add user",
    });
  }
}