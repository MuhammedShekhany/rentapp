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
        pay_no, -- Added your custom sequential number column here
        pay_total,
        pay_date,
        pay_detail,
        pay_receipt,
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
  // Get a specific connection instance to manage the transaction state safely
  const conn = await db.getConnection();

  try {
    const body = await req.json();

    const { or_id, pay_total, pay_detail, pay_receipt, br_id, user_id } = body;

    // Validation guardrails
    if (!or_id || !br_id || !pay_total || Number(pay_total) <= 0) {
      conn.release();
      return NextResponse.json({
        success: false,
        message: "Please enter valid payment data, including br_id",
      });
    }

    // Begin the transaction block
    await conn.beginTransaction();

    // 1) Get order total (FOR UPDATE locks the order record until this commit finishes)
    const [orders]: any = await conn.execute(
      `SELECT or_total FROM \`order\` WHERE or_id = ? FOR UPDATE`,
      [or_id]
    );

    if (!orders || orders.length === 0) {
      await conn.rollback();
      return NextResponse.json({
        success: false,
        message: "Order not found",
      });
    }

    const orderTotal = Number(orders[0].or_total || 0);

    // 2) Get current paid total
    const [sumRows]: any = await conn.execute(
      `SELECT IFNULL(SUM(pay_total), 0) AS paid_total
       FROM payment
       WHERE or_id = ? FOR UPDATE`,
      [or_id]
    );

    const paidTotal = Number(sumRows[0].paid_total || 0);
    const newPaidTotal = paidTotal + Number(pay_total);

    // 3) Prevent concurrent overpayment exploits
    if (newPaidTotal > orderTotal) {
      await conn.rollback();
      return NextResponse.json({
        success: false,
        message: "Payment exceeds order total",
      });
    }

    // 4) Insert payment with atomic sequential per-branch fallback incrementation
    const [result]: any = await conn.execute(
      `INSERT INTO payment
      (
        pay_total,
        pay_date,
        pay_detail,
        pay_receipt,
        or_id,
        br_id,
        user_id,
        pay_no
      )
      VALUES (?, NOW(), ?, ?, ?, ?, ?, (SELECT COALESCE(MAX(p.pay_no), 0) + 1 FROM payment p WHERE p.br_id = ?))`,
      [
        Number(pay_total),
        pay_detail || "",
        Number(pay_receipt || 0),
        or_id,
        br_id,
        user_id || null,
        br_id // Maps to the subquery WHERE filter parameter
      ]
    );

    // Everything is validated and safe, save the transaction state
    await conn.commit();

    return NextResponse.json({
      success: true,
      message: "Payment added successfully",
      pay_id: result.insertId,
    });
  } catch (error) {
    // If anything fails or conflicts occur, erase all step changes
    await conn.rollback();
    console.error("POST payment error:", error);

    if ((error as any).code === 'ER_DUP_ENTRY') {
      return NextResponse.json({
        success: false,
        message: "Conflict detected due to simultaneous processing. Please try saving again.",
      }, { status: 409 });
    }

    return NextResponse.json({
      success: false,
      message: "Server error",
    });
  } finally {
    // Return connection resource slot back to pool cleanly
    conn.release();
  }
}