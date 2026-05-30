import { NextResponse } from "next/server";
import pool from "@/app/lib/db";

// ======================
// GET ONLY ORDERS AFTER 2 DAYS
// ======================
export async function GET() {
  try {
    const [rows]: any = await pool.execute(
      `SELECT

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

      WHERE DATE(o.or_prepare_date) = CURDATE()
       `
    );

    return NextResponse.json({
      success: true,
      orders: rows,
    });
  } catch (error) {
    console.error("GET PREPARED ORDERS ERROR:", error);
    return NextResponse.json({
      success: false,
      message: "Server error",
    });
  }
}