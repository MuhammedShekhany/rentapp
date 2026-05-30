import { NextResponse } from "next/server";
import db from "@/app/lib/db";

// ======================
// GET orders by month (from UI)
// ======================
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const month = searchParams.get("month");

    let whereClause = "";
    let params: any[] = [];

    // ======================
    // FILTER BY MONTH
    // ======================
    if (month) {
      whereClause = `
        WHERE o.or_date >= ?
        AND o.or_date < DATE_ADD(?, INTERVAL 1 MONTH)
      `;

      params.push(`${month}-01`, `${month}-01`);
    }

    const [rows]: any = await db.execute(
      `
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
        o.tamin,

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

      ${whereClause} and o.or_delayed = 0

      ORDER BY o.or_id DESC
      `,
      params
    );

    return NextResponse.json({
      success: true,
      orders: rows,
    });

  } catch (error) {

    console.error("GET order error:", error);

    return NextResponse.json({
      success: false,
      message: "Server error",
    });
  }
}






// ======================
// POST add order + details
// ======================
export async function POST(req: Request) {
  const conn = await db.getConnection();

  try {
    const body = await req.json();

    const {
      or_date, or_total,
      or_delivery, or_receipt, or_preparing,
      or_note, or_cus_name, or_cus_phone,
      or_cus_phone2,
      or_prepare_date,
      or_date_reserve,
      tamin,
      or_vip,
      br_id, user_id, details,
    } = body;

    if (!or_date || !br_id || !user_id || !details || details.length === 0) {
      return NextResponse.json({
        success: false,
        message: "Please fill all required fields"
      });
    }

    await conn.beginTransaction();

    const [orderResult]: any = await conn.execute(
      `INSERT INTO \`order\`
      (
        or_date,
        or_total,
        or_cus_name,
        or_cus_phone,
        or_cus_phone2,
        or_delivery,
        or_receipt,
        or_preparing,
        or_delayed,
        or_note,
        or_prepare_date,
        or_date_reserve,
        tamin,
        or_vip,
        br_id,
        user_id,
        createat
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?, ?, ?, NOW())`,
      [
        or_date,
        Number(or_total || 0),
        or_cus_name || "",
        or_cus_phone || "",
        or_cus_phone2 || "",
        Number(or_delivery || 0),
        Number(or_receipt || 0),
        Number(or_preparing || 0),

        0, // or_delayed default

        or_note || "",
        or_prepare_date || null,
        or_date_reserve || null,
        tamin || "",
        or_vip ? 1 : 0,
        br_id,
        user_id,
      ]
    );

    const or_id = orderResult.insertId;

    for (const item of details) {
      await conn.execute(
        `INSERT INTO order_detail
        (or_id, ord_qt, ord_price, ord_total, createat, pro_id)
         VALUES (?, ?, ?, ?, NOW(), ?)`,
        [
          or_id,
          Number(item.ord_qt || 0),
          Number(item.ord_price || 0),
          Number(item.ord_total || 0),
          item.pro_id
        ]
      );
    }

    await conn.commit();

    return NextResponse.json({
      success: true,
      message: "Order added successfully",
      or_id
    });

  } catch (error) {
    await conn.rollback();

    console.error("POST order error:", error);

    return NextResponse.json({
      success: false,
      message: "Server error"
    });

  } finally {
    conn.release();
  }
}