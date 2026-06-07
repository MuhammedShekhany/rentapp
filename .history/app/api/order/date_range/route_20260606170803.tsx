import { NextResponse } from "next/server";
import db from "@/app/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const br_id = searchParams.get("br_id");
    const from_date = searchParams.get("from_date");
    const to_date = searchParams.get("to_date");

    if (!br_id) {
      return NextResponse.json({
        success: false,
        message: "br_id required",
      });
    }

    if (!from_date || !to_date) {
      return NextResponse.json({
        success: false,
        message: "from_date and to_date are required",
      });
    }

    let sql = `
      SELECT 
        o.or_id,
        o.or_no,
        o.or_date,
        o.or_total,

        o.or_cus_name,
        o.or_cus_phone,

        o.or_delivery,
        o.or_receipt,
        o.or_preparing,

        o.or_prepare_date,
        o.or_date_reserve,

        o.or_note,

        o.br_id,
        o.user_id,
        o.createat,

        b.br_name,
        u.user_fullname,

        IFNULL(paid.sum_paid, 0) AS paid_total,
        (o.or_total - IFNULL(paid.sum_paid, 0)) AS remaining

      FROM \`order\` o

      LEFT JOIN branch b
        ON o.br_id = b.br_id

      LEFT JOIN user u
        ON o.user_id = u.user_id

      LEFT JOIN (
        SELECT
          or_id,
          SUM(pay_total) AS sum_paid
        FROM payment
        GROUP BY or_id
      ) paid
        ON paid.or_id = o.or_id

      WHERE
        o.br_id = ?
        AND o.or_date_reserve >= ?
        AND o.or_date_reserve <= ?

      ORDER BY o.or_date_reserve DESC, o.or_id DESC
    `;

    const params = [br_id, from_date, to_date];

    const [rows]: any = await db.execute(sql, params);

    return NextResponse.json({
      success: true,
      orders: rows,
    });

  } catch (error) {
    console.error("GET report orders error:", error);

    return NextResponse.json({
      success: false,
      message: "Server error",
    });
  }
}