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

    // ==========================================
    // 1. BUILD FILTERS FOR ORDERS AND PAYMENTS
    // ==========================================
    let orderWhere = "WHERE 1=1";
    let paymentWhere = "WHERE 1=1";
    
    const orderParams: any[] = [];
    const paymentParams: any[] = [];

    // Branch Filter
    if (br_id) {
      orderWhere += " AND o.br_id = ?";
      orderParams.push(br_id);

      paymentWhere += " AND p.br_id = ?";
      paymentParams.push(br_id);
    }

    // Date/Time Filters
    if (type === "daily" && date) {
      orderWhere += " AND DATE(o.or_date) = ?";
      orderParams.push(date);

      paymentWhere += " AND DATE(p.pay_date) = ?";
      paymentParams.push(date);
    } 
    else if (type === "monthly" && month) {
      orderWhere += " AND DATE_FORMAT(o.or_date, '%Y-%m') = ?";
      orderParams.push(month);

      paymentWhere += " AND DATE_FORMAT(p.pay_date, '%Y-%m') = ?";
      paymentParams.push(month);
    } 
    else if (type === "yearly" && year) {
      orderWhere += " AND YEAR(o.or_date) = ?";
      orderParams.push(year);

      paymentWhere += " AND YEAR(p.pay_date) = ?";
      paymentParams.push(year);
    }

    // ==========================================
    // 2. QUERY ONE: ORDERS REPORT
    // ==========================================
    // Fetching orders matching the timeframe + their overall lifetime totals
    const orderSql = `
      SELECT
        o.or_id,
        o.or_no,
        o.or_date,
        o.or_total,
        o.or_cus_name,
        o.or_cus_phone,
        o.or_delivery,
        o.or_receipt,
        o.or_preparing,
        o.br_id,
        u.user_name,
        IFNULL(p_total.paid_total, 0) AS paid_total,
        (o.or_total - IFNULL(p_total.paid_total, 0)) AS remaining
      FROM \`order\` o
      LEFT JOIN user u ON o.user_id = u.user_id
      LEFT JOIN (
        SELECT or_id, SUM(pay_total) AS paid_total 
        FROM payment 
        GROUP BY or_id
      ) p_total ON o.or_id = p_total.or_id
      ${orderWhere}
      ORDER BY o.or_date DESC, o.or_no DESC
    `;

    // ==========================================
    // 3. QUERY TWO: DETAILED PAYMENTS REPORT
    // ==========================================
    // Fetching independent payments made inside this specific timeframe
    const paymentSql = `
      SELECT 
        p.pay_id,
        p.or_id,
        p.pay_total,
        p.pay_date,
        p.br_id,
        o.or_no,
        o.or_cus_name
      FROM payment p
      LEFT JOIN \`order\` o ON p.or_id = o.or_id
      ${paymentWhere}
      ORDER BY p.pay_date DESC, p.pay_id DESC
    `;

    // Execute queries concurrently for performance
    const [ordersPromise, paymentsPromise] = await Promise.all([
      db.execute(orderSql, orderParams),
      db.execute(paymentSql, paymentParams)
    ]);

    const [orders]: any = ordersPromise;
    const [payments]: any = paymentsPromise;

    // ==========================================
    // 4. RETURN SUMMARY + TABLES
    // ==========================================
    return NextResponse.json({
      success: true,
      summary: {
        total_orders_revenue: orders.reduce((sum: number, o: any) => sum + Number(o.or_total || 0), 0),
        total_payments_collected: payments.reduce((sum: number, p: any) => sum + Number(p.pay_total || 0), 0),
      },
      orders: orders,
      payments: payments // Ready to be mapped perfectly into a table layout!
    });

  } catch (error) {
    console.error("API ERROR:", error);
    return NextResponse.json({
      success: false,
      message: "Server error",
      error: String(error),
    }, { status: 500 });
  }
}