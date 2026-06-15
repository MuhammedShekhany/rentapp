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

    let where = "WHERE 1=1";
    const params: any[] = [];

    // =========================
    // ORDER FILTER
    // =========================
    if (br_id) {
      where += " AND o.br_id = ?";
      params.push(br_id);
    }

    if (type === "daily" && date) {
      where += " AND DATE(o.or_date) = ?";
      params.push(date);
    }

    if (type === "monthly" && month) {
      where += " AND (
        DATE_FORMAT(o.or_date,'%Y-%m') = ?
        OR EXISTS (
          SELECT 1 FROM payment p2
          WHERE p2.or_id = o.or_id
          AND DATE_FORMAT(p2.pay_date,'%Y-%m') = ?
        )
      )";
      params.push(month, month);
    }

    if (type === "yearly" && year) {
      where += " AND (
        YEAR(o.or_date) = ?
        OR EXISTS (
          SELECT 1 FROM payment p2
          WHERE p2.or_id = o.or_id
          AND YEAR(p2.pay_date) = ?
        )
      )";
      params.push(year, year);
    }

    // =========================
    // PAYMENT SUM (ALL TIME FOR ORDER)
    // =========================
    let paymentWhere = "WHERE 1=1";
    const paymentParams: any[] = [];

    if (br_id) {
      paymentWhere += " AND br_id = ?";
      paymentParams.push(br_id);
    }

    const sql = `
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

        IFNULL(p.paid_total, 0) AS paid_total,
        (o.or_total - IFNULL(p.paid_total, 0)) AS remaining

      FROM \`order\` o
      LEFT JOIN user u ON o.user_id = u.user_id

      LEFT JOIN (
        SELECT
          or_id,
          SUM(pay_total) AS paid_total
        FROM payment
        ${paymentWhere}
        GROUP BY or_id
      ) p ON o.or_id = p.or_id

      ${where}

      ORDER BY o.or_date DESC, o.or_no DESC
    `;

    const [orders]: any = await db.execute(sql, [
      ...paymentParams,
      ...params,
    ]);

    return NextResponse.json({
      success: true,
      order: orders,
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({
      success: false,
      message: "Server error",
    });
  }
}