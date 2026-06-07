import { NextRequest, NextResponse } from "next/server";
import db from "@/app/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const from = searchParams.get("from") || "";
    const to = searchParams.get("to") || "";
    const customer = searchParams.get("customer") || "";
    const payment_status = searchParams.get("payment_status") || "all";

    let where = "WHERE 1=1";
    const params: any[] = [];

    if (from) {
      where += " AND o.or_date >= ?";
      params.push(from);
    }

    if (to) {
      where += " AND o.or_date <= ?";
      params.push(to);
    }

    if (customer) {
      where += " AND o.or_cus_name LIKE ?";
      params.push(`%${customer}%`);
    }

    const [rows]: any = await db.execute(
      `
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
        o.or_note,
        b.br_name,
        u.user_name,
        IFNULL(SUM(p.pay_total), 0) AS paid_total,
        (o.or_total - IFNULL(SUM(p.pay_total), 0)) AS remaining
      FROM \`order\` o
      LEFT JOIN branch b ON o.br_id = b.br_id
      LEFT JOIN user u ON o.user_id = u.user_id
      LEFT JOIN payment p ON o.or_id = p.or_id
      ${where}
      GROUP BY 
        o.or_id,
        o.or_no,
        o.or_date,
        o.or_total,
        o.or_cus_name,
        o.or_cus_phone,
        o.or_delivery,
        o.or_receipt,
        o.or_preparing,
        o.or_note,
        b.br_name,
        u.user_name
      ORDER BY o.or_date ASC, o.or_no ASC
      `,
      params
    );

    let filteredRows = rows;

    if (payment_status === "paid") {
      filteredRows = rows.filter((r: any) => Number(r.remaining) === 0);
    } else if (payment_status === "partial") {
      filteredRows = rows.filter(
        (r: any) =>
          Number(r.paid_total) > 0 && Number(r.remaining) > 0
      );
    } else if (payment_status === "unpaid") {
      filteredRows = rows.filter((r: any) => Number(r.paid_total) === 0);
    }

    // =========================
    // Summary
    // =========================
    const total_orders = filteredRows.length;
    const order_total = filteredRows.reduce(
      (sum: number, item: any) => sum + Number(item.or_total || 0),
      0
    );
    const paid_total = filteredRows.reduce(
      (sum: number, item: any) => sum + Number(item.paid_total || 0),
      0
    );
    const remaining_total = filteredRows.reduce(
      (sum: number, item: any) => sum + Number(item.remaining || 0),
      0
    );
    const avg_order = total_orders > 0 ? order_total / total_orders : 0;

    // =========================
    // Chart 1: Sales by Date
    // =========================
    const salesByDateMap: Record<
      string,
      { date: string; total: number; paid: number; remaining: number }
    > = {};

    filteredRows.forEach((item: any) => {
      const date = item.or_date;

      if (!salesByDateMap[date]) {
        salesByDateMap[date] = {
          date,
          total: 0,
          paid: 0,
          remaining: 0,
        };
      }

      salesByDateMap[date].total += Number(item.or_total || 0);
      salesByDateMap[date].paid += Number(item.paid_total || 0);
      salesByDateMap[date].remaining += Number(item.remaining || 0);
    });

    const sales_by_date = Object.values(salesByDateMap);

    // =========================
    // Chart 2: Payment Status
    // =========================
    let paid_count = 0;
    let partial_count = 0;
    let unpaid_count = 0;

    filteredRows.forEach((item: any) => {
      const paid = Number(item.paid_total || 0);
      const remaining = Number(item.remaining || 0);

      if (remaining === 0) paid_count++;
      else if (paid > 0 && remaining > 0) partial_count++;
      else unpaid_count++;
    });

    const payment_status_chart = [
      { name: "Paid", value: paid_count },
      { name: "Partial", value: partial_count },
      { name: "Unpaid", value: unpaid_count },
    ];

    // =========================
    // Chart 3: Top Customers
    // =========================
    const customerMap: Record<
      string,
      { customer: string; total: number; orders: number }
    > = {};

    filteredRows.forEach((item: any) => {
      const name = item.or_cus_name?.trim() || "Unknown";

      if (!customerMap[name]) {
        customerMap[name] = {
          customer: name,
          total: 0,
          orders: 0,
        };
      }

      customerMap[name].total += Number(item.or_total || 0);
      customerMap[name].orders += 1;
    });

    const top_customers = Object.values(customerMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    return NextResponse.json({
      success: true,
      summary: {
        total_orders,
        order_total,
        paid_total,
        remaining_total,
        avg_order,
      },
      charts: {
        sales_by_date,
        payment_status_chart,
        top_customers,
      },
      orders: filteredRows.reverse(), // latest first in table
    });
  } catch (error) {
    console.error("GET order report error:", error);
    return NextResponse.json({
      success: false,
      message: "Server error",
    });
  }
}