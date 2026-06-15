import { NextResponse } from "next/server";
import db from "@/app/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    // =========================
    // FILTERS
    // =========================
    const type = searchParams.get("type") || "daily";
    const date = searchParams.get("date") || "";
    const month = searchParams.get("month") || "";
    const year = searchParams.get("year") || "";
    const br_id = searchParams.get("br_id");

    // =========================
    // VALIDATE BRANCH
    // =========================
    if (!br_id) {
      return NextResponse.json({
        success: false,
        message: "br_id is required",
      });
    }

    // =========================
    // WHERE CLAUSE (SECURE)
    // =========================
    let whereClause = "WHERE s.br_id = ?";
    let params: any[] = [br_id];

    // =========================
    // DAILY
    // =========================
    if (type === "daily") {
      const targetDate =
        date || new Date().toISOString().split("T")[0];

      whereClause += " AND DATE(s.sp_date) = ?";
      params.push(targetDate);
    }

    // =========================
    // MONTHLY
    // =========================
    else if (type === "monthly") {
      const now = new Date();

      const currentMonth =
        month ||
        `${now.getFullYear()}-${String(
          now.getMonth() + 1
        ).padStart(2, "0")}`;

      whereClause += " AND DATE_FORMAT(s.sp_date, '%Y-%m') = ?";
      params.push(currentMonth);
    }

    // =========================
    // YEARLY
    // =========================
    else if (type === "yearly") {
      const currentYear =
        year || String(new Date().getFullYear());

      whereClause += " AND YEAR(s.sp_date) = ?";
      params.push(currentYear);
    }

    // =========================
    // INVALID TYPE
    // =========================
    else {
      return NextResponse.json({
        success: false,
        message: "Invalid filter type",
      });
    }

    // ==========================================
    // QUERY 1: GROUPS SUMMARY (إحصائيات المجموعات المفلترة)
    // ==========================================
    const [groupsRows]: any = await db.execute(
      `
      SELECT
        s.sp_gat_id,
        COALESCE(g.sp_gat_name, 'غير محدد') AS sp_gat_name,
        COUNT(s.sp_id) AS count,
        SUM(COALESCE(s.sp_total, 0)) AS total
      FROM spend s
      LEFT JOIN spend_gat g
        ON s.sp_gat_id = g.sp_gat_id
      ${whereClause}
      GROUP BY
        s.sp_gat_id,
        g.sp_gat_name
      ORDER BY total DESC
      `,
      params
    );

    // ==========================================
    // QUERY 2: DETAILED SPENDS (تفاصيل المصروفات المفلترة للجدول)
    // ==========================================
    const [spendRows]: any = await db.execute(
      `
      SELECT 
        s.sp_id,
        s.sp_no,
        s.sp_total,
        s.sp_date,
        s.sp_detail,
        s.sp_gat_id,
        COALESCE(g.sp_gat_name, 'غير محدد') AS sp_gat_name,
        COALESCE(s.user_name, '-') AS user_name
      FROM spend s
      LEFT JOIN spend_gat g ON s.sp_gat_id = g.sp_gat_id
      ${whereClause}
      ORDER BY s.sp_date DESC, s.sp_id DESC
      `,
      params
    );

    // =========================
    // GRAND TOTAL
    // =========================
    const grandTotal = groupsRows.reduce(
      (sum: number, item: any) =>
        sum + Number(item.total || 0),
      0
    );

    // =========================
    // RESPONSE
    // =========================
    return NextResponse.json({
      success: true,
      report_type: type,
      total: grandTotal,
      groups_count: groupsRows.length,
      filters: {
        date,
        month,
        year,
        br_id,
      },
      data: groupsRows,     // بيانات الكروت
      spend: spendRows,     // بيانات الجدول المفلترة تماماً
    });

  } catch (error) {
    console.error("SPEND REPORT API ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}