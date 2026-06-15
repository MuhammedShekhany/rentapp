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

    // ================= ORDERS =================
    let where = "WHERE 1=1";
    const params: any[] = [];

    if (br_id) {
      where += " AND o.br_id = ?";
      params.push(br_id);
    }

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

    const sqlOrders = `
      SELECT
        o.or_id,
        o.or_no,
        o.or_date,
        o.or_total,
        o.or_cus_name,
        o.or_cus_phone,
        o.or_vip,
        u.user_name,

        IFNULL(p.paid_total,0) AS paid_total,
        (o.or_total - IFNULL(p.paid_total,0)) AS remaining

      FROM \`order\` o
      LEFT JOIN user u ON o.user_id = u.user_id

      LEFT JOIN (
        SELECT or_id, SUM(pay_total) AS paid_total
        FROM payment
        GROUP BY or_id
      ) p ON o.or_id = p.or_id

      ${where}

      ORDER BY o.or_date DESC, o.or_no DESC
    `;

    // ================= PAYMENTS (SEPARATE TABLE) =================
    let pWhere = "WHERE 1=1";
    const pParams: any[] = [];

    if (br_id) {
      pWhere += " AND br_id = ?";
      pParams.push(br_id);
    }

    if (type === "daily" && date) {
      pWhere += " AND DATE(pay_date) = ?";
      pParams.push(date);
    }

    if (type === "monthly" && month) {
      pWhere += " AND DATE_FORMAT(pay_date,'%Y-%m') = ?";
      pParams.push(month);
    }

    if (type === "yearly" && year) {
      pWhere += " AND YEAR(pay_date) = ?";
      pParams.push(year);
    }

    const sqlPayments = `
      SELECT
        pay_id,
        pay_no,
        pay_date,
        pay_total,
        or_id
      FROM payment
      ${pWhere}
      ORDER BY pay_date DESC
    `;

    const [orders]: any = await db.execute(sqlOrders, params);
    const [payments]: any = await db.execute(sqlPayments, pParams);

    return NextResponse.json({
      success: true,
      order: orders,
      payments: payments,
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      message: "Server error",
    });
  }
}