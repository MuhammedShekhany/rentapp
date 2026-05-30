import { NextRequest, NextResponse } from "next/server";
import db from "@/app/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // =========================
    // FILTERS
    // =========================

    const br_id = searchParams.get("br_id") || "";
    const type = searchParams.get("type") || "daily";
    const date = searchParams.get("date") || "";
    const month = searchParams.get("month") || "";
    const year = searchParams.get("year") || "";

    let where = "WHERE 1=1";
    const params: any[] = [];

    // =========================
    // BRANCH FILTER (IMPORTANT)
    // =========================
    if (br_id) {
      where += " AND o.br_id = ?";
      params.push(br_id);
    }

    // =========================
    // DAILY
    // =========================
    if (type === "daily" && date) {
      where += " AND DATE(o.or_date) = ?";
      params.push(date);
    }

    // =========================
    // MONTHLY
    // =========================
    if (type === "monthly" && month) {
      where += " AND DATE_FORMAT(o.or_date,'%Y-%m') = ?";
      params.push(month);
    }

    // =========================
    // YEARLY
    // =========================
    if (type === "yearly" && year) {
      where += " AND YEAR(o.or_date) = ?";
      params.push(year);
    }

    // =========================
    // GROUP REPORT
    // =========================
    const [groupRows]: any = await db.execute(
      `
      SELECT

        o.or_gat_id,
        og.or_gat_name,

        COUNT(o.or_id) AS count,

        SUM(o.or_total) AS total,

        IFNULL(SUM(p.pay_total), 0) AS paid,

        (SUM(o.or_total) - IFNULL(SUM(p.pay_total), 0)) AS remaining

      FROM \`order\` o

      LEFT JOIN payment p
      ON o.or_id = p.or_id

      ${where}

      GROUP BY

      ORDER BY total DESC
      `,
      params
    );

    // =========================
    // ORDER DETAILS
    // =========================
    const [orders]: any = await db.execute(
      `
      SELECT

        o.or_id,
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

        IFNULL(SUM(p.pay_total), 0) AS paid_total,

        (o.or_total - IFNULL(SUM(p.pay_total), 0)) AS remaining

      FROM \`order\` o

      LEFT JOIN user u
      ON o.user_id = u.user_id

      LEFT JOIN payment p
      ON o.or_id = p.or_id

      ${where}

      GROUP BY
        o.or_id,
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

      ORDER BY
        o.or_date DESC,
        o.or_id DESC
      `,
      params
    );

    return NextResponse.json({
      success: true,
      data: groupRows,
      order: orders,
    });

  } catch (error) {
    console.error("GET order report error:", error);

    return NextResponse.json({
      success: false,
      message: "Server error",
    });
  }
}