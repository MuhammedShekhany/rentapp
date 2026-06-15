import { NextRequest, NextResponse } from "next/server";
import db from "@/app/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const br_id = searchParams.get("br_id") || "";
    const type = searchParams.get("type") || "monthly";
    const date = searchParams.get("date") || "";
    const month = searchParams.get("month") || "";
    const year = searchParams.get("year") || "";

    let orderWhere = "WHERE 1=1";
    let paymentWhere = "WHERE 1=1";

    const orderParams: any[] = [];
    const paymentParams: any[] = [];

    // =====================
    // BRANCH
    // =====================
    if (br_id) {
      orderWhere += " AND o.br_id = ?";
      paymentWhere += " AND o.br_id = ?";

      orderParams.push(br_id);
      paymentParams.push(br_id);
    }

    // =====================
    // DAILY
    // =====================
    if (type === "daily" && date) {
      orderWhere += `
        AND (
          DATE(o.or_date)=?
          OR EXISTS (
            SELECT 1
            FROM payment p2
            WHERE p2.or_id=o.or_id
            AND DATE(p2.pay_date)=?
          )
        )
      `;

      orderParams.push(date, date);

      paymentWhere += " AND DATE(p.pay_date)=?";
      paymentParams.push(date);
    }

    // =====================
    // MONTHLY
    // =====================
    if (type === "monthly" && month) {
      orderWhere += `
        AND (
          DATE_FORMAT(o.or_date,'%Y-%m')=?
          OR EXISTS (
            SELECT 1
            FROM payment p2
            WHERE p2.or_id=o.or_id
            AND DATE_FORMAT(p2.pay_date,'%Y-%m')=?
          )
        )
      `;

      orderParams.push(month, month);

      paymentWhere += " AND DATE_FORMAT(p.pay_date,'%Y-%m')=?";
      paymentParams.push(month);
    }

    // =====================
    // YEARLY
    // =====================
    if (type === "yearly" && year) {
      orderWhere += `
        AND (
          YEAR(o.or_date)=?
          OR EXISTS (
            SELECT 1
            FROM payment p2
            WHERE p2.or_id=o.or_id
            AND YEAR(p2.pay_date)=?
          )
        )
      `;

      orderParams.push(year, year);

      paymentWhere += " AND YEAR(p.pay_date)=?";
      paymentParams.push(year);
    }

    // =====================
    // ORDERS
    // =====================
    const ordersSql = `
      SELECT
        o.*,
        u.user_name,

        IFNULL((
          SELECT SUM(pay_total)
          FROM payment pp
          WHERE pp.or_id=o.or_id
        ),0) AS paid_total,

        (
          o.or_total -
          IFNULL((
            SELECT SUM(pay_total)
            FROM payment pp
            WHERE pp.or_id=o.or_id
          ),0)
        ) AS remaining

      FROM \`order\` o
      LEFT JOIN user u
        ON o.user_id=u.user_id

      ${orderWhere}

      ORDER BY o.or_date DESC,o.or_no DESC
    `;

    const [orders]: any = await db.execute(
      ordersSql,
      orderParams
    );

    // =====================
    // PAYMENTS
    // =====================
    const paymentsSql = `
      SELECT
        p.pay_id,
        p.pay_date,
        p.pay_total,
        p.or_id,

        o.or_no,
        o.or_cus_name,
        o.or_total

      FROM payment p
      LEFT JOIN \`order\` o
        ON p.or_id=o.or_id

      ${paymentWhere}

      ORDER BY p.pay_date DESC,p.pay_id DESC
    `;

    const [payments]: any = await db.execute(
      paymentsSql,
      paymentParams
    );

    // =====================
    // TOTALS
    // =====================
    const totalOrders = orders.reduce(
      (sum: number, item: any) =>
        sum + Number(item.or_total || 0),
      0
    );

    const totalPaid = payments.reduce(
      (sum: number, item: any) =>
        sum + Number(item.pay_total || 0),
      0
    );

    const totalRemaining = orders.reduce(
      (sum: number, item: any) =>
        sum + Number(item.remaining || 0),
      0
    );

    return NextResponse.json({
      success: true,

      orders,
      payments,

      total_orders: totalOrders,
      total_paid: totalPaid,
      total_remaining: totalRemaining,
      payment_count: payments.length,
      order_count: orders.length,
    });

  } catch (error) {
    console.error(error);

    return NextResponse.json({
      success: false,
      message: "Server Error",
      error: String(error),
    });
  }
}