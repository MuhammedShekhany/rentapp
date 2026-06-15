import { NextRequest, NextResponse } from "next/server";
import db from "@/app/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const br_id = searchParams.get("br_id") || "";
    const type = searchParams.get("type") || "daily";
    const date = searchParams.get("date") || "";
    const month = searchParams.get("month") || "";
    const year = searchParams.get("year") || "";

    let where = "WHERE 1=1";
    const params: any[] = [];

    // =========================
    // BRANCH FILTER
    // =========================
    if (br_id) {
      where += " AND o.br_id = ?";
      params.push(br_id);
    }

    // =========================
    // DATE FILTERS
    // =========================
    if (type === "daily" && date) {
      where += " AND DATE(o.or_date) = ?";
      params.push(date);
    }

    if (type === "monthly" && month) {
      where += " AND DATE_FORMAT(o.or_date,'%Y-%m') = ?";
      params.push(month);
    }

    if (type === "yearly" && year) {
      where += " AND YEAR(o.or_date) = ?";
      params.push(year);
    }

    // =========================================================
    // 1. ORDERS (NO PAYMENT SUM HERE)
    // =========================================================
    const [orders]: any = await db.execute(
      `
      SELECT
        o.or_id,
        o.or_no,
        o.or_date,
        o.or_total,
        o.or_cus_name,
        o.or_cus_phone,
        o.or_cus_phone2,
        o.or_delivery,
        o.or_receipt,
        o.or_preparing,
        o.or_note,
        o.br_id,
        o.user_id,
        o.createat,
        o.or_prepare_date,
        o.or_vip,
        o.or_delayed,
        o.or_date_reserve,
        u.user_name
      FROM \`order\` o
      LEFT JOIN user u ON o.user_id = u.user_id
      ${where}
      ORDER BY o.or_date DESC, o.or_no DESC
      `,
      params
    );

    // =========================================================
    // 2. PAYMENTS (ALL PAYMENTS FOR SAME PERIOD)
    // =========================================================
    const [payments]: any = await db.execute(
      `
      SELECT
        p.pay_id,
        p.or_id,
        p.pay_total,
        p.pay_date,
        p.pay_method,
        o.br_id
      FROM payment p
      INNER JOIN \`order\` o ON p.or_id = o.or_id
      ${where}
      ORDER BY p.pay_date DESC
      `,
      params
    );

    // =========================================================
    // RESPONSE
    // =========================================================
    return NextResponse.json({
      success: true,
      orders,
      payments,
    });

  } catch (error) {
    console.error("GET order report error:", error);

    return NextResponse.json({
      success: false,
      message: "Server error",
    });
  }
}