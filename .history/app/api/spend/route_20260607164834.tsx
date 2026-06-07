import { NextResponse } from "next/server";
import db from "@/app/lib/db";

// ======================
// GET SPEND
// ======================
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const month = searchParams.get("month");
    const br_id = searchParams.get("br_id");

    let whereConditions: string[] = [];
    let params: any[] = [];

    // ======================
    // FILTER BY BRANCH
    // ======================
    if (br_id) {
      whereConditions.push(`s.br_id = ?`);
      params.push(br_id);
    }

    // ======================
    // FILTER BY MONTH
    // ======================
    if (month) {
      whereConditions.push(`
        s.sp_date >= ?
        AND s.sp_date < DATE_ADD(?, INTERVAL 1 MONTH)
      `);

      params.push(
        `${month}-01`,
        `${month}-01`
      );
    }

    // ======================
    // BUILD WHERE
    // ======================
    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(" AND ")}`
        : "";

    // ======================
    // QUERY
    // ======================
    const [rows]: any = await db.execute(
      `
      SELECT
        s.sp_id,
        s.sp_no, -- Added your custom sequential number column here
        s.sp_total,
        s.sp_date,
        s.sp_detail,

        s.br_id,
        s.user_id,

        s.createat,

        s.sp_gat_id,

        b.br_name,

        u.user_name,

        sg.sp_gat_name

      FROM spend s

      LEFT JOIN branch b
      ON s.br_id = b.br_id

      LEFT JOIN user u
      ON s.user_id = u.user_id

      LEFT JOIN spend_gat sg
      ON s.sp_gat_id = sg.sp_gat_id

      ${whereClause}

      ORDER BY s.sp_id DESC
      `,
      params
    );

    return NextResponse.json({
      success: true,
      spend: rows,
    });

  } catch (error) {
    console.error("GET spend error:", error);
    return NextResponse.json({
      success: false,
      message: "Server error",
    });
  }
}

// ======================
// POST SPEND
// ======================
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      sp_total,
      sp_date,
      sp_detail,
      sp_gat_id,
      br_id,
      user_id,
    } = body;

    // ======================
    // VALIDATION
    // ======================
    if (
      !sp_total ||
      !sp_date ||
      !br_id ||
      !user_id
    ) {
      return NextResponse.json({
        success: false,
        message: "Please fill all required fields",
      });
    }

    // ======================
    // INSERT (With automatic per-branch counter)
    // ======================
    const [result]: any = await db.execute(
      `
      INSERT INTO spend
      (
        sp_total,
        sp_date,
        sp_detail,
        sp_gat_id,
        br_id,
        user_id,
        createat,
        sp_no
      )
      VALUES
      (
        ?, ?, ?, ?, ?, ?, NOW(), (SELECT COALESCE(MAX(s.sp_no), 0) + 1 FROM spend s WHERE s.br_id = ?)
      )
      `,
      [
        Number(sp_total || 0),
        sp_date,
        sp_detail || "",
        sp_gat_id || null,
        br_id,
        user_id,
        br_id // Maps to the subquery WHERE clause parameter to get the correct max sequence
      ]
    );

    return NextResponse.json({
      success: true,
      message: "Spend added successfully",
      sp_id: result.insertId,
    });

  } catch (error) {
    console.error("POST spend error:", error);

    // Trap parallel click concurrency overlap issues cleanly
    if ((error as any).code === 'ER_DUP_ENTRY') {
      return NextResponse.json({
        success: false,
        message: "Conflict detected due to simultaneous entry. Please try saving again.",
      }, { status: 409 });
    }

    return NextResponse.json({
      success: false,
      message: "Server error",
    });
  }
}