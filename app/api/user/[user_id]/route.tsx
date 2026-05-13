import { NextResponse } from "next/server";
import pool from "@/app/lib/db";

// GET SINGLE USER
export async function GET(
  req: Request,
  { params }: { params: Promise<{ user_id: string }> }
) {
  try {
    const { user_id } = await params;

    const [rows]: any = await pool.query(
      `
      SELECT 
        user_id,
        user_name,
        user_password,
        user_fullname,
        br_id,
        user_role
      FROM \`user\`
      WHERE user_id = ?
      `,
      [user_id]
    );

    if (rows.length === 0) {
      return NextResponse.json({
        success: false,
        message: "User not found",
      });
    }

    return NextResponse.json({
      success: true,
      user: rows[0],
    });
  } catch (error) {
    console.error("GET SINGLE USER ERROR:", error);
    return NextResponse.json({
      success: false,
      message: "Failed to load user",
    });
  }
}

// UPDATE USER
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ user_id: string }> }
) {
  try {
    const { user_id } = await params;
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
      UPDATE \`user\`
      SET
        user_name = ?,
        user_password = ?,
        user_fullname = ?,
        br_id = ?,
        user_role = ?
      WHERE user_id = ?
      `,
      [user_name, user_password, user_fullname, br_id, user_role, user_id]
    );

    return NextResponse.json({
      success: true,
      message: "User updated successfully",
    });
  } catch (error) {
    console.error("UPDATE USER ERROR:", error);
    return NextResponse.json({
      success: false,
      message: "Failed to update user",
    });
  }
}

// DELETE USER
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ user_id: string }> }
) {
  try {
    const { user_id } = await params;

    await pool.query(
      `
      DELETE FROM \`user\`
      WHERE user_id = ?
      `,
      [user_id]
    );

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("DELETE USER ERROR:", error);
    return NextResponse.json({
      success: false,
      message: "Failed to delete user",
    });
  }
}