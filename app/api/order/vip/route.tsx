import { NextResponse } from "next/server";
import db from "@/app/lib/db"; // your db connection

export async function GET() {
  try {
    // Orders that are READY but NOT delivered yet
    const [rows] = await db.query(`
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
        o.or_delayed,

        o.or_note,

        o.or_prepare_date,
        o.or_date_reserve,

        o.or_vip,

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
       WHERE o.or_date_reserve = CURDATE() and  o.or_vip=1
       ORDER BY o.or_date DESC
    `);

    return NextResponse.json({
      success: true,
      orders: rows,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: "Server error",
    });
  }
}