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

    // =========================
    // ORDERS FILTER
    // =========================
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

    // =========================
    // MAIN QUERY (ORDERS + PAYMENTS INSIDE EACH ORDER)
    // =========================
    const sql = `
      SELECT
        o.or_id,
        o.or_no,
        o.or_date,
        o.or_total,
        o.or_cus_name,
        o.or_cus_phone,
        o.or_cus_phone2,
        o.or_vip,
        o.br_id,
        o.user_id,
        u.user_name,

        IFNULL(p.paid_total, 0) AS paid_total,
        (o.or_total - IFNULL(p.paid_total, 0)) AS remaining,

        (
          SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
              'pay_id', pay_id,
              'pay_no', pay_no,
              'pay_date', pay_date,
              'pay_total', pay_total
            )
          )
          FROM payment p2
          WHERE p2.or_id = o.or_id
          ${br_id ? "AND p2.br_id = ?" : ""}
        ) AS payments

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

    // =========================
    // PARAMS HANDLING
    // =========================
    let finalParams: any[] = [...params];

    // for subquery br_id
    if (br_id) {
      finalParams.push(br_id);
    }

    const [orders]: any = await db.execute(sql, finalParams);

    return NextResponse.json({
      success: true,
      order: orders,
    });

  } catch (error) {
    console.error("ORDER REPORT ERROR:", error);

    return NextResponse.json({
      success: false,
      message: "Server error",
    });
  }
}