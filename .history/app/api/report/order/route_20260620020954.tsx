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

    // =========================================================
    // 1. ORDERS FILTER
    // =========================================================
    let orderWhere = "WHERE 1=1";
    const orderParams: any[] = [];

    if (br_id) {
      orderWhere += " AND o.br_id = ?";
      orderParams.push(br_id);
    }

    if (type === "daily" && date) {
      orderWhere += " AND DATE(o.or_date) = ?";
      orderParams.push(date);
    } else if (type === "monthly" && month) {
      orderWhere += " AND DATE_FORMAT(o.or_date,'%Y-%m') = ?";
      orderParams.push(month);
    } else if (type === "yearly" && year) {
      orderWhere += " AND YEAR(o.or_date) = ?";
      orderParams.push(year);
    }

    // ORDERS QUERY
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
        u.user_name,
        COALESCE(p_sum.total_paid, 0) AS paid_total,
        (o.or_total - COALESCE(p_sum.total_paid, 0)) AS remaining
      FROM \`order\` o
      LEFT JOIN user u ON o.user_id = u.user_id
      LEFT JOIN (
        SELECT or_id, SUM(pay_total) AS total_paid 
        FROM payment 
        GROUP BY or_id
      ) p_sum ON o.or_id = p_sum.or_id
      ${orderWhere}
      ORDER BY o.or_date DESC, o.or_no DESC
      `,
      orderParams
    );

    // =========================================================
    // 2. PAYMENTS FILTER
    // =========================================================
    let paymentWhere = "WHERE 1=1";
    const paymentParams: any[] = [];

    if (br_id) {
      paymentWhere += " AND o.br_id = ?";
      paymentParams.push(br_id);
    }

    if (type === "daily" && date) {
      paymentWhere += " AND DATE(p.pay_date) = ?";
      paymentParams.push(date);
    } else if (type === "monthly" && month) {
      paymentWhere += " AND DATE_FORMAT(p.pay_date,'%Y-%m') = ?";
      paymentParams.push(month);
    } else if (type === "yearly" && year) {
      paymentWhere += " AND YEAR(p.pay_date) = ?";
      paymentParams.push(year);
    }

    const [payments]: any = await db.execute(
      `
      SELECT
        p.pay_id,
        p.or_id,
        p.pay_total,
        p.pay_date,
        o.or_no,
        o.br_id,
        o.or_cus_name,
        o.or_total,
        (o.or_total - COALESCE(p_all.total_paid, 0)) AS remaining,
        u.user_name
      FROM payment p
      INNER JOIN \`order\` o ON p.or_id = o.or_id
      LEFT JOIN user u ON o.user_id = u.user_id
      LEFT JOIN (
        SELECT or_id, SUM(pay_total) AS total_paid 
        FROM payment 
        GROUP BY or_id
      ) p_all ON o.or_id = p_all.or_id
      ${paymentWhere}
      ORDER BY p.pay_date DESC
      `,
      paymentParams
    );

    // =========================================================
    // 3. SPEND FILTER (NEW)
    // =========================================================
    let spendWhere = "WHERE 1=1";
    const spendParams: any[] = [];

    if (br_id) {
      spendWhere += " AND s.br_id = ?";
      spendParams.push(br_id);
    }

    if (type === "daily" && date) {
      spendWhere += " AND DATE(s.sp_date) = ?";
      spendParams.push(date);
    } else if (type === "monthly" && month) {
      spendWhere += " AND DATE_FORMAT(s.sp_date,'%Y-%m') = ?";
      spendParams.push(month);
    } else if (type === "yearly" && year) {
      spendWhere += " AND YEAR(s.sp_date) = ?";
      spendParams.push(year);
    }

    const [spend]: any = await db.execute(
      `
      SELECT
        s.sp_id,
        s.sp_total,
        s.sp_date,
        s.sp_detail,
        s.br_id,
        s.user_id,
        s.sp_gat_id,
        s.sp_no
      FROM spend s
      ${spendWhere}
      ORDER BY s.sp_date DESC
      `,
      spendParams
    );

    // =========================================================
    // RESPONSE
    // =========================================================
    return NextResponse.json({
      success: true,
      order: orders,
      payments: payments,
      spend: spend,
    });

  } catch (error) {
    console.error("GET order report error:", error);

    return NextResponse.json({
      success: false,
      message: "Server error",
    });
  }
}