import { NextResponse } from "next/server";
import db from "@/app/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const type = searchParams.get("type");
    const date = searchParams.get("date");
    const month = searchParams.get("month");
    const year = searchParams.get("year");
    const br_id = searchParams.get("br_id");

    // =========================
    // REQUIRE BRANCH
    // =========================
    if (!br_id) {
      return NextResponse.json({
        success: false,
        message: "br_id is required",
      });
    }

    // =========================
    // BASE WHERE
    // =========================
    let where = "WHERE sp.br_id = ?";
    const params: any[] = [br_id];

    // =========================
    // FILTERS
    // =========================
    if (type === "daily" && date) {
      where += " AND DATE(sp.sp_date) = ?";
      params.push(date);
    }

    if (type === "monthly" && month) {
      where += " AND DATE_FORMAT(sp.sp_date,'%Y-%m') = ?";
      params.push(month);
    }

    if (type === "yearly" && year) {
      where += " AND YEAR(sp.sp_date) = ?";
      params.push(year);
    }

    // =========================
    // QUERY (FLAT LIKE YOUR EXAMPLE)
    // =========================
    const [rows]: any = await db.query(
      `
      SELECT
          sg.sp_gat_id,
          sg.sp_gat_name,

          sp.sp_id,
          sp.sp_no,
          sp.sp_total,
          sp.sp_date,
          sp.sp_detail,
          sp.br_id

      FROM spend sp

      INNER JOIN spend_gat sg
          ON sg.sp_gat_id = sp.sp_gat_id

      ${where}

      ORDER BY
          sg.sp_gat_name ASC,
          sp.sp_no DESC
      `,
      params
    );

    // =========================
    // GROUPING (SAME STYLE AS YOUR API)
    // =========================
    const grouped: any = {};

    for (const item of rows) {
      if (!grouped[item.sp_gat_id]) {
        grouped[item.sp_gat_id] = {
          sp_gat_id: item.sp_gat_id,
          sp_gat_name: item.sp_gat_name,
          total: 0,
          count: 0,
          spends: [],
        };
      }

      grouped[item.sp_gat_id].spends.push({
        sp_id: Number(item.sp_id),
        sp_no: Number(item.sp_no),
        sp_total: Number(item.sp_total),
        sp_date: item.sp_date,
        sp_detail: item.sp_detail,
        br_id: item.br_id,
        sp_gat_id: Number(item.sp_gat_id),
      });

      grouped[item.sp_gat_id].total += Number(item.sp_total);
      grouped[item.sp_gat_id].count += 1;
    }

    // =========================
    // RESPONSE
    // =========================
    return NextResponse.json({
      success: true,
      data: Object.values(grouped),
    });

  } catch (error) {
    console.log(error);

    return NextResponse.json({
      success: false,
      message: "Server Error",
    });
  }
}