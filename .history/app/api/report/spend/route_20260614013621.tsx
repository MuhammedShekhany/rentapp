import { NextResponse } from "next/server";
import db from "@/app/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const br_id = searchParams.get("br_id");
    const sp_gat_id = searchParams.get("sp_gat_id");

    const type = searchParams.get("type") || "daily";
    const date = searchParams.get("date") || "";
    const month = searchParams.get("month") || "";
    const year = searchParams.get("year") || "";

    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (!br_id) {
      return NextResponse.json({
        success: false,
        message: "br_id is required",
      });
    }

    let whereClause = "WHERE s.br_id = ?";
    let params: any[] = [br_id];

    if (sp_gat_id) {
      whereClause += " AND s.sp_gat_id = ?";
      params.push(sp_gat_id);
    }

    // Range
    if (from && to) {
      whereClause += " AND DATE(s.sp_date) BETWEEN ? AND ?";
      params.push(from, to);
    }

    // Daily
    else if (type === "daily") {
      const targetDate =
        date || new Date().toISOString().split("T")[0];

      whereClause += " AND DATE(s.sp_date) = ?";
      params.push(targetDate);
    }

    // Monthly
    else if (type === "monthly") {
      const now = new Date();

      const currentMonth =
        month ||
        `${now.getFullYear()}-${String(
          now.getMonth() + 1
        ).padStart(2, "0")}`;

      whereClause +=
        " AND DATE_FORMAT(s.sp_date,'%Y-%m') = ?";
      params.push(currentMonth);
    }

    // Yearly
    else if (type === "yearly") {
      const currentYear =
        year || String(new Date().getFullYear());

      whereClause += " AND YEAR(s.sp_date) = ?";
      params.push(currentYear);
    }

    const [rows]: any = await db.execute(
      `
      SELECT
        s.sp_id,
        s.sp_date,
        s.sp_total,
        s.sp_note,
        s.createat,

        s.sp_gat_id,

        COALESCE(
          g.sp_gat_name,
          'غير محدد'
        ) AS sp_gat_name

      FROM spend s

      LEFT JOIN spend_gat g
      ON s.sp_gat_id = g.sp_gat_id

      ${whereClause}

      ORDER BY s.sp_date DESC, s.sp_id DESC
      `,
      params
    );

    const grandTotal = rows.reduce(
      (sum: number, item: any) =>
        sum + Number(item.sp_total || 0),
      0
    );

    return NextResponse.json({
      success: true,
      count: rows.length,
      total: grandTotal,
      data: rows,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}