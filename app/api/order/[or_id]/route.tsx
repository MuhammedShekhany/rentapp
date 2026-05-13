import { NextResponse } from "next/server";
import db from "@/app/lib/db";

type Params = {
  params: Promise<{ or_id: string }>;
};

// ======================
// GET ORDER FULL DETAIL
// ======================
export async function GET(req: Request, { params }: Params) {
  try {
    const { or_id } = await params;

    // ======================
    // LOAD ORDER HEADER
    // ======================
    const [orders]: any = await db.execute(
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

        o.or_note,

        o.or_prepare_date,
        o.or_date_reserve,
        o.tamin,

        o.or_vip,

        o.br_id,
        o.user_id,

        o.createat,

        b.br_name,
        b.br_header,
        u.user_name,

        IFNULL(SUM(p.pay_total),0) AS paid_total,
        (o.or_total - IFNULL(SUM(p.pay_total),0)) AS remaining

      FROM \`order\` o

      LEFT JOIN branch b 
        ON o.br_id = b.br_id

      LEFT JOIN user u 
        ON o.user_id = u.user_id

      LEFT JOIN payment p 
        ON o.or_id = p.or_id

      WHERE o.or_id = ?

      GROUP BY o.or_id
      `,
      [or_id]
    );

    if (!orders.length) {
      return NextResponse.json({
        success: false,
        message: "Order not found",
      });
    }

    // ======================
    // LOAD ORDER DETAILS
    // ======================
    const [details]: any = await db.execute(
      `
      SELECT
        od.pro_id,
        p.pro_name,
        od.ord_qt,
        od.ord_price,
        od.ord_total

      FROM order_detail od

      LEFT JOIN product p
        ON od.pro_id = p.pro_id

      WHERE od.or_id = ?
      `,
      [or_id]
    );

    return NextResponse.json({
      success: true,
      order: orders[0],
      details: details,
    });

  } catch (error) {

    console.error(error);

    return NextResponse.json({
      success: false,
      message: "Server error",
    });
  }
}





// ======================
// PUT UPDATE ORDER (FIXED)
// ======================
// ======================
// PUT UPDATE ORDER
// ======================
export async function PUT(req: Request, { params }: Params) {

  const conn = await db.getConnection();

  try {

    const { or_id } = await params;

    const body = await req.json();

    const {
      or_date,
      or_total,

      or_cus_name,
      or_cus_phone,
      or_cus_phone2,

      or_delivery,
      or_receipt,
      or_preparing,
      or_delayed,
      tamin,
      or_note,

      or_prepare_date,
      or_date_reserve,

      or_vip,

      br_id,
      user_id,

      details,
    } = body;

    await conn.beginTransaction();

    // ======================
    // UPDATE ORDER HEADER
    // ======================
    await conn.execute(
      `
      UPDATE \`order\` SET

        or_date         = COALESCE(?, or_date),
        or_total        = COALESCE(?, or_total),

        or_cus_name     = COALESCE(?, or_cus_name),
        or_cus_phone    = COALESCE(?, or_cus_phone),
        or_cus_phone2   = COALESCE(?, or_cus_phone2),

        or_delivery     = COALESCE(?, or_delivery),
        or_receipt      = COALESCE(?, or_receipt),
        or_preparing    = COALESCE(?, or_preparing),
        or_delayed      = COALESCE(?, or_delayed),

        or_note         = COALESCE(?, or_note),

        or_prepare_date = COALESCE(?, or_prepare_date),
        or_date_reserve = COALESCE(?, or_date_reserve),
        tamin = COALESCE(?, tamin),

        or_vip          = COALESCE(?, or_vip),

        br_id           = COALESCE(?, br_id),
        user_id         = COALESCE(?, user_id)

      WHERE or_id = ?
      `,
      [
        or_date ?? null,
        or_total ?? null,

        or_cus_name ?? null,
        or_cus_phone ?? null,
        or_cus_phone2 ?? null,

        or_delivery ?? null,
        or_receipt ?? null,
        or_preparing ?? null,
        or_delayed ?? null,

        or_note ?? null,

        or_prepare_date ?? null,
        or_date_reserve ?? null,
        tamin ?? null,

        or_vip ?? null,

        br_id ?? null,
        user_id ?? null,

        or_id,
      ]
    );

    // ======================
    // UPDATE DETAILS ONLY
    // IF DETAILS SENT
    // ======================
    if (Array.isArray(details)) {

      // delete old details
      await conn.execute(
        `DELETE FROM order_detail WHERE or_id = ?`,
        [or_id]
      );

      // insert new details
      for (const d of details) {

        await conn.execute(
          `
          INSERT INTO order_detail
          (
            or_id,
            pro_id,
            ord_qt,
            ord_price,
            ord_total
          )
          VALUES (?, ?, ?, ?, ?)
          `,
          [
            or_id,
            d.pro_id,
            d.ord_qt,
            d.ord_price,
            d.ord_total,
          ]
        );
      }
    }

    await conn.commit();

    return NextResponse.json({
      success: true,
      message: "Order updated successfully",
    });

  } catch (error) {

    await conn.rollback();

    console.error("PUT ORDER ERROR:", error);

    return NextResponse.json({
      success: false,
      message: "Server error",
    });

  } finally {

    conn.release();
  }
}

// ======================
// DELETE ORDER
// ======================
export async function DELETE(req: Request, { params }: Params) {
  const conn = await db.getConnection();

  try {
    const { or_id } = await params;

    await conn.beginTransaction();

    await conn.execute("DELETE FROM payment WHERE or_id = ?", [or_id]);
    await conn.execute("DELETE FROM order_detail WHERE or_id = ?", [or_id]);
    await conn.execute("DELETE FROM `order` WHERE or_id = ?", [or_id]);

    await conn.commit();

    return NextResponse.json({
      success: true,
      message: "Order deleted successfully",
    });

  } catch (error) {
    await conn.rollback();
    console.error(error);

    return NextResponse.json({
      success: false,
      message: "Server error",
    });

  } finally {
    conn.release();
  }
}