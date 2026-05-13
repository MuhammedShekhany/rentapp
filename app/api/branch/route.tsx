import { NextResponse } from "next/server";
import pool from "@/app/lib/db";

// ======================
// GET ALL BRANCH
// ======================
export async function GET() {
  try {
    const [rows]: any = await pool.execute(
      `SELECT 
        br_id, 
        br_name, 
        br_phone, 
        br_add, 
        createat, 
        br_logo,
        br_header   -- ✅ جديد
       FROM branch
       ORDER BY br_id DESC`
    );

    return NextResponse.json({
      success: true,
      branch: rows,
    });
  } catch (error) {
    console.error("GET BRANCH ERROR:", error);
    return NextResponse.json({
      success: false,
      message: "Server error",
    });
  }
}

// ======================
// ADD BRANCH
// ======================
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { br_name, br_phone, br_add, br_logo, br_header } = body;

    if (!br_name || !br_phone || !br_add) {
      return NextResponse.json({
        success: false,
        message: "Please fill all required fields",
      });
    }

    await pool.execute(
      `INSERT INTO branch 
        (br_id, br_name, br_phone, br_add, createat, br_logo, br_header)
       VALUES 
        (UUID(), ?, ?, ?, NOW(), ?, ?)`,
      [
        br_name,
        br_phone,
        br_add,
        br_logo || "",
        br_header || "", // ✅ جديد
      ]
    );

    return NextResponse.json({
      success: true,
      message: "Branch added successfully",
    });
  } catch (error) {
    console.error("ADD BRANCH ERROR:", error);
    return NextResponse.json({
      success: false,
      message: "Server error",
    });
  }
}