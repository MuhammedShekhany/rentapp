import { NextResponse } from "next/server";
import pool from "@/app/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const br_id = searchParams.get("br_id");

    if (!br_id) {
      return NextResponse.json({
        success: false,
        message: "br_id is required",
      });
    }

    // 1) get branch info
    const [branchRows]: any = await pool.execute(
      `SELECT br_id, br_name, br_phone, br_add, br_logo
       FROM branch
       WHERE br_id = ?`,
      [br_id]
    );

    if (branchRows.length === 0) {
      return NextResponse.json({
        success: false,
        message: "Branch not found",
      });
    }

    const branch = branchRows[0];

    // 2) check active subscription
    const [subRows]: any = await pool.execute(
      `SELECT sub_id, sub_s_date, sub_e_date, sub_amount, br_id, user_id
       FROM sub
       WHERE br_id = ?
       AND CURDATE() BETWEEN sub_s_date AND sub_e_date
       LIMIT 1`,
      [br_id]
    );

    const subscriptionActive = subRows.length > 0;
    const subscription = subscriptionActive ? subRows[0] : null;

    return NextResponse.json({
      success: true,
      branch,
      subscription,
      subscriptionActive,
    });
  } catch (error) {
    console.error("DB ERROR:", error);

    return NextResponse.json({
      success: false,
      message: "Server error",
    });
  }
}