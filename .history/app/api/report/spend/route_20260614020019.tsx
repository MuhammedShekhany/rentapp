import { NextResponse } from "next/server";
import db from "@/app/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const type = searchParams.get("type") || "day";
    const date = searchParams.get("date") || "";
    const month = searchParams.get("month") || "";
    const year = searchParams.get("year") || "";
    const br_id = searchParams.get("br_id") || "";

    let dateFilter = "";
    const params: any[] = [];

    // =========================
    // DATE FILTER
    // =========================
    if (type === "day" && date) {
      dateFilter = "DATE(sp.sp_date) = ?";
      params.push(date);
    } else if (type === "month" && month) {
      dateFilter = "DATE_FORMAT(sp.sp_date, '%Y-%m') = ?";
      params.push(month);
    } else if (type === "year" && year) {
      dateFilter = "YEAR(sp.sp_date) = ?";
      params.push(year);
    } else {
      dateFilter = "1=1"; // fallback (no filter)
    }

    // =========================
    // BRANCH FILTER
    // =========================
    let branchFilter = "";
    if (br_id) {
      branchFilter = "AND sp.br_id = ?";
      params.push(br_id);
    }

    // =========================
    // CATEGORY GROUP REPORT
    // =========================
    const [rows]: any = await db.query(
      `
      SELECT 
        sp.sp_gat_id,
        sg.sp_gat_name,
        SUM(sp.sp_total) AS total_amount,
        COUNT(sp.sp_id) AS total_count
      FROM spend sp
      LEFT JOIN spend_gat sg 
        ON sp.sp_gat_id = sg.sp_gat_id
      WHERE ${dateFilter} ${branchFilter}
      GROUP BY sp.sp_gat_id, sg.sp_gat_name
      ORDER BY total_amount DESC
      `,
      params
    );

    // =========================
    // GRAND TOTAL (SAFE FIX)
    // =========================
    const [totalRows]: any = await db.query(
      `
      SELECT COALESCE(SUM(sp_total),0) AS grand_total
      FROM spend sp
      WHERE ${dateFilter} ${branchFilter}
      `,
      params
    );

    const grand_total = totalRows?.[0]?.grand_total || 0;

    // =========================
    // RESPONSE
    // =========================
    return NextResponse.json({
      success: true,
      type,
      data: rows,
      grand_total,
    });

  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 }
    );
  }
}