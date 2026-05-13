import { NextResponse } from "next/server";
import pool from "@/app/lib/db";

// GET SINGLE SUBSCRIPTION
export async function GET(
  req: Request,
  { params }: { params: Promise<{ sub_id: string }> }
) {
  try {
    const { sub_id } = await params;

    const [rows]: any = await pool.execute(
      `
      SELECT 
        sub_id,
        sub_s_date,
        sub_e_date,
        sub_amount,
        br_id,
        user_id
      FROM sub
      WHERE sub_id = ?
      `,
      [sub_id]
    );

    if (rows.length === 0) {
      return NextResponse.json({
        success: false,
        message: "Subscription not found",
      });
    }

    return NextResponse.json({
      success: true,
      subscription: rows[0],
    });
  } catch (error) {
    console.error("GET SINGLE SUBSCRIPTION ERROR:", error);
    return NextResponse.json({
      success: false,
      message: "Failed to load subscription",
    });
  }
}

// UPDATE SUBSCRIPTION
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ sub_id: string }> }
) {
  try {
    const { sub_id } = await params;
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
      UPDATE sub
      SET
        sub_s_date = ?,
        sub_e_date = ?,
        sub_amount = ?,
        br_id = ?,
        user_id = ?
      WHERE sub_id = ?
      `,
      [sub_s_date, sub_e_date, sub_amount, br_id, user_id, sub_id]
    );

    return NextResponse.json({
      success: true,
      message: "Subscription updated successfully",
    });
  } catch (error) {
    console.error("UPDATE SUBSCRIPTION ERROR:", error);
    return NextResponse.json({
      success: false,
      message: "Failed to update subscription",
    });
  }
}

// DELETE SUBSCRIPTION
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ sub_id: string }> }
) {
  try {
    const { sub_id } = await params;

    await pool.execute(
      `
      DELETE FROM sub
      WHERE sub_id = ?
      `,
      [sub_id]
    );

    return NextResponse.json({
      success: true,
      message: "Subscription deleted successfully",
    });
  } catch (error) {
    console.error("DELETE SUBSCRIPTION ERROR:", error);
    return NextResponse.json({
      success: false,
      message: "Failed to delete subscription",
    });
  }
}