import { NextResponse } from "next/server";
import db from "@/app/lib/db";

type ParamsType = { params: Promise<{ pay_id: string }> };

// ======================
// POST add payment
// ======================
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { or_id, pay_total, pay_detail, pay_date,pay_receipt, br_id, user_id } = body;

    // if (!or_id || !pay_total || !br_id || !user_id || !pay_date) {
    //   return NextResponse.json({
    //     success: false,
    //     message: "Please fill all required fields",
    //   });
    // }

    const [result]: any = await db.execute(
      `INSERT INTO payment
      (pay_total, pay_detail,pay_receipt, pay_date, or_id, br_id, user_id)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [Number(pay_total), pay_detail || "",0, pay_date, or_id, br_id, user_id]
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

// ======================
// PUT update payment
// ======================
export async function PUT(req: Request, { params }: ParamsType) {
  try {
    const { pay_id } = await params; // ✅ unwrap the promise
   const body = await req.json();

const {
  pay_total,
  pay_detail,
  pay_receipt,
  pay_date,
} = body;


    const [result]: any = await db.execute(
  `
  UPDATE payment 
  SET 
    pay_total = COALESCE(?, pay_total),
    pay_detail = COALESCE(?, pay_detail),
    pay_receipt = COALESCE(?, pay_receipt),
    pay_date = COALESCE(?, pay_date)
  WHERE pay_id = ?
  `,
  [
    pay_total ?? null,
    pay_detail ?? null,
    pay_receipt ?? null,
    pay_date ?? null,
    pay_id,
  ]
);

    if (result.affectedRows === 0) {
      return NextResponse.json({
        success: false,
        message: "Payment not found or not updated",
      });
    }

    return NextResponse.json({
      success: true,
      message: "Payment updated successfully",
    });
  } catch (error) {
    console.error("PUT payment error:", error);
    return NextResponse.json({
      success: false,
      message: "Server error",
    });
  }
}

// ======================
// DELETE payment
// ======================
export async function DELETE(req: Request, { params }: ParamsType) {
  try {
    const { pay_id } = await params; // ✅ unwrap the promise

    if (!pay_id) {
      return NextResponse.json({
        success: false,
        message: "Payment ID missing",
      });
    }

    const [result]: any = await db.execute(
      "DELETE FROM payment WHERE pay_id = ?",
      [pay_id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({
        success: false,
        message: "Payment not found or not deleted",
      });
    }

    return NextResponse.json({
      success: true,
      message: "Payment deleted successfully",
    });
  } catch (error) {
    console.error("DELETE payment error:", error);
    return NextResponse.json({
      success: false,
      message: "Server error",
    });
  }
}