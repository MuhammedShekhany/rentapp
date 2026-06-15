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
    const sp_gat_id = searchParams.get("sp_gat_id") || "";

    let where = "WHERE 1=1";
    const params: any[] = [];

    // =========================
    // DATE FILTER
    // =========================
    if (type === "day" && date) {
      where += " AND DATE(sp.sp_date) = ?";
      params.push(date);
    } else if (type === "month" && month) {
      where += " AND DATE_FORMAT(sp.sp_date,'%Y-%m') = ?";
      params.push(month);
    } else if (type === "year" && year) {
      where += " AND YEAR(sp.sp_date) = ?";
      params.push(year);
    }

    // =========================
    // BRANCH FILTER
    // =========================
    if (br_id) {
      where += " AND sp.br_id = ?";
      params.push(br_id);
    }

    // =========================
    // CATEGORY FILTER (for details only)
    // =========================
    let whereDetails = where;
    const paramsDetails = [...params];

    if (sp_gat_id) {
      whereDetails += " AND sp.sp_gat_id = ?";
      paramsDetails.push(sp_gat_id);
    }

    // =========================
    // GROUPED DATA
    // =========================
    const [groups]: any = await db.query(
      `
      SELECT 
        sp.sp_gat_id,
        sg.sp_gat_name,
        SUM(sp.sp_total) AS total_amount,
        COUNT(sp.sp_id) AS total_count
      FROM spend sp
      LEFT JOIN spend_gat sg 
        ON sp.sp_gat_id = sg.sp_gat_id
      ${where}
      GROUP BY sp.sp_gat_id, sg.sp_gat_name
      ORDER BY total_amount DESC
      `,
      params
    );

    // =========================
    // DETAILS DATA
    // =========================
    const [spends]: any = await db.query(
      `
      SELECT 
        sp.sp_id,
        sp.sp_no,
        sp.sp_total,
        sp.sp_date,
        sp.sp_detail,
        sp.sp_gat_id,
        sg.sp_gat_name
      FROM spend sp
      LEFT JOIN spend_gat sg 
        ON sp.sp_gat_id = sg.sp_gat_id
      ${whereDetails}
      ORDER BY sp.sp_date DESC
      `,
      paramsDetails
    );

    // =========================
    // GRAND TOTAL
    // =========================
    const [totalRows]: any = await db.query(
      `
      SELECT COALESCE(SUM(sp.sp_total),0) AS grand_total
      FROM spend sp
      ${where}
      `,
      params
    );

    return NextResponse.json({
      success: true,
      data: groups,
      spend: spends,
      grand_total: totalRows?.[0]?.grand_total || 0,
    });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}