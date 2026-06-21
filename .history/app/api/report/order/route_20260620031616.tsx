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
    // 1. START DATE (FOR PREVIOUS BALANCE)
    // =========================================================
    let startDate: string | null = null;

    if (type === "daily" && date) {
      startDate = `${date} 00:00:00`;
    } else if (type === "monthly" && month) {
      startDate = `${month}-01 00:00:00`;
    } else if (type === "yearly" && year) {
      startDate = `${year}-01-01 00:00:00`;
    }

    // fallback safety (IMPORTANT)
    if (!startDate) startDate = "1970-01-01 00:00:00";

    // =========================================================
    // 2. ORDERS (CURRENT PERIOD)
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

    const [orders]: any = await db.execute(
      `
      SELECT
        o.or_id,
        o.or_no,
        o.or_date,
        o.or_total,
        o.or_cus_name,
        o.or_cus_phone,
        o.or_vip,
        u.user_name,
        COALESCE(p.total_paid,0) AS paid_total,
        (o.or_total - COALESCE(p.total_paid,0)) AS remaining
      FROM \`order\` o
      LEFT JOIN user u ON o.user_id = u.user_id
      LEFT JOIN (
        SELECT or_id, SUM(pay_total) AS total_paid
        FROM payment
        GROUP BY or_id
      ) p ON o.or_id = p.or_id
      ${orderWhere}
      ORDER BY o.or_date DESC
      `,
      orderParams
    );

    // =========================================================
    // 3. PAYMENTS (CURRENT PERIOD)
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
        o.or_total,
        o.or_cus_name,
        u.user_name,
        (o.or_total - COALESCE(p_all.total_paid,0)) AS remaining
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
    // 4. SPEND (CURRENT PERIOD)
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
        s.sp_detail
      FROM spend s
      ${spendWhere}
      ORDER BY s.sp_date DESC
      `,
      spendParams
    );

    // =========================================================
    // 5. PREVIOUS BALANCE (SAFE FIX)
    // =========================================================

    const [prevPayRows]: any = await db.execute(
      `
      SELECT COALESCE(SUM(pay_total),0) AS total
      FROM payment
      WHERE br_id = ?
      AND pay_date < ?
      `,
      [br_id, startDate]
    );

    const [prevSpendRows]: any = await db.execute(
      `
      SELECT COALESCE(SUM(sp_total),0) AS total
      FROM spend
      WHERE br_id = ?
      AND sp_date < ?
      `,
      [br_id, startDate]
    );

    const prevPayTotal = prevPayRows?.[0]?.total || 0;
    const prevSpendTotal = prevSpendRows?.[0]?.total || 0;

    const previousBalance = prevPayTotal - prevSpendTotal;

    // =========================================================
    // RESPONSE
    // =========================================================
    return NextResponse.json({
      success: true,
      order: orders || [],
      payments: payments || [],
      spend: spend || [],
      previousBalance,
    });

  } catch (error) {
    console.error("API ERROR:", error);

    return NextResponse.json({
      success: false,
      message: "Server error",
    });
  }
}