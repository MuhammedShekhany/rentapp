import { NextResponse } from "next/server";
import db from "@/app/lib/db";

// ======================
// GET payments by order id
// ======================
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const or_id = searchParams.get("or_id");

    if (!or_id) {
      return NextResponse.json({
        success: false,
        message: "Order ID is required",
      });
    }

    const [payments]: any = await db.execute(
      `SELECT 
        pay_id,
        pay_total,
        pay_date,
        pay_detail,
        or_id,
        br_id,
        user_id
       FROM payment
       WHERE or_id = ?
       ORDER BY pay_id DESC`,
      [or_id]
    );

    return NextResponse.json({
      success: true,
      payments,
    });
  } catch (error) {
    console.error("GET payment error:", error);
    return NextResponse.json({
      success: false,
      message: "Server error",
    });
  }
}

// ======================
// POST add payment
// ======================
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { or_id, pay_total, pay_detail,pay_receipt, br_id, user_id } = body;

    if (!or_id || !pay_total || Number(pay_total) <= 0) {
      return NextResponse.json({
        success: false,
        message: "Please enter valid payment data",
      });
    }

    // 1) Get order total
    const [orders]: any = await db.execute(
      `SELECT or_total FROM \`order\` WHERE or_id = ?`,
      [or_id]
    );

    if (!orders || orders.length === 0) {
      return NextResponse.json({
        success: false,
        message: "Order not found",
      });
    }

    const orderTotal = Number(orders[0].or_total || 0);

    // 2) Get current paid total
    const [sumRows]: any = await db.execute(
      `SELECT IFNULL(SUM(pay_total),0) AS paid_total
       FROM payment
       WHERE or_id = ?`,
      [or_id]
    );

    const paidTotal = Number(sumRows[0].paid_total || 0);
    const newPaidTotal = paidTotal + Number(pay_total);

    // 3) Prevent overpayment
    if (newPaidTotal > orderTotal) {
      return NextResponse.json({
        success: false,
        message: "Payment exceeds order total",
      });
    }

    // 4) Insert payment
    const [result]: any = await db.execute(
      `INSERT INTO payment
      (
        pay_total,
        pay_date,
        pay_detail,
        pay_receipt
        or_id,
        br_id,
        user_id
      )
      VALUES (?, NOW(), ?,?,?, ?, ?)`,
      [
        Number(pay_total),
        pay_detail || "",
        0,
        or_id,
        br_id || null,
        user_id || null,
      ]
    );

    return NextResponse.json({
      success: true,
      message: "Payment added successfully",
      pay_id: result.insertId,
    });
  } catch (error) {
    console.error("POST payment error:", error);
    return NextResponse.json({
      success: false,
      message: "Server error",
    });
  }
}