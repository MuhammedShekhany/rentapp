import { NextResponse } from "next/server";
import db from "@/app/lib/db";

// Helper function to get safe local date parts (avoids UTC timezone shift issues)
function getLocalDateParts() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return { year: String(year), month: `${year}-${month}`, daily: `${year}-${month}-${day}` };
}

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
    // VALIDATE BRANCH (Return 400 Bad Request)
    // =========================
    if (!br_id) {
      return NextResponse.json(
        { success: false, message: "br_id is required" },
        { status: 400 }
      );
    }

    const defaultDates = getLocalDateParts();
    let whereClause = "WHERE s.br_id = ?";
    let params: any[] = [br_id];

    // =========================
    // DAILY (Optimized Range)
    // =========================
    if (type === "daily") {
      const targetDate = date || defaultDates.daily;
      whereClause += " AND s.sp_date >= ? AND s.sp_date < ? + INTERVAL 1 DAY";
      params.push(targetDate, targetDate);
    }

    // =========================
    // MONTHLY (Optimized Range)
    // =========================
    else if (type === "monthly") {
      const targetMonth = month || defaultDates.month;
      const startDate = `${targetMonth}-01`;
      whereClause += " AND s.sp_date >= ? AND s.sp_date < ? + INTERVAL 1 MONTH";
      params.push(startDate, startDate);
    }

    // =========================
    // YEARLY (Optimized Range)
    // =========================
    else if (type === "yearly") {
      const targetYear = year || defaultDates.year;
      const startDate = `${targetYear}-01-01`;
      whereClause += " AND s.sp_date >= ? AND s.sp_date < ? + INTERVAL 1 YEAR";
      params.push(startDate, startDate);
    }

    // =========================
    // INVALID TYPE
    // =========================
    else {
      return NextResponse.json(
        { success: false, message: "Invalid filter type" },
        { status: 400 }
      );
    }

    // =========================
    // EXECUTE QUERY (Detailed View)
    // =========================
    const [rows]: any = await db.execute(
      `
      SELECT
        s.sp_id,
        s.sp_no,
        COALESCE(s.sp_total, 0) AS sp_total,
        s.sp_date,
        s.sp_detail,
        s.br_id,
        s.user_id,
        s.createat,
        s.sp_gat_id,
        COALESCE(b.br_name, 'غير محدد') AS br_name,
        COALESCE(u.user_name, 'غير محدد') AS user_name,
        COALESCE(sg.sp_gat_name, 'غير محدد') AS sp_gat_name
      FROM spend s
      LEFT JOIN branches b 
        ON s.br_id = b.br_id
      LEFT JOIN users u 
        ON s.user_id = u.user_id
      LEFT JOIN spend_gat sg 
        ON s.sp_gat_id = sg.sp_gat_id
      ${whereClause}
      ORDER BY s.sp_date DESC, s.sp_id DESC
      `,
      params
    );

    // =========================
    // GRAND TOTAL
    // =========================
    const grandTotal = rows.reduce(
      (sum: number, item: any) => sum + Number(item.sp_total || 0),
      0
    );

    // =========================
    // RESPONSE
    // =========================
    return NextResponse.json({
      success: true,
      report_type: type,
      total: grandTotal,
      records_count: rows.length,
      filters: {
        date: date || (type === "daily" ? defaultDates.daily : date),
        month: month || (type === "monthly" ? defaultDates.month : month),
        year: year || (type === "yearly" ? defaultDates.year : year),
        br_id,
      },
      data: rows,
    });

  } catch (error) {
    console.error("SPEND DETAILS API ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}