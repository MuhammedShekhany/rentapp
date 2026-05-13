import { NextResponse } from "next/server";
import db from "@/app/lib/db";

export async function GET() {
  try {
    const [rows]: any = await db.execute(
      `SELECT 
        o.or_id, 
        o.or_date, 
        o.or_total, 
        o.or_delivery, 
        o.or_receipt, 
        o.or_preparing, 
        o.or_note,
        o.or_cus_name,
        o.or_cus_phone,
        b.br_name, 
        u.user_name,
        IFNULL((SELECT SUM(pay_total) FROM payment p WHERE p.or_id=o.or_id),0) AS paid_total,
        (o.or_total - IFNULL((SELECT SUM(pay_total) FROM payment p WHERE p.or_id=o.or_id),0)) AS remaining
       FROM \`order\` o
       LEFT JOIN branch b ON o.br_id = b.br_id
       LEFT JOIN user u ON o.user_id = u.user_id
       ORDER BY o.or_id DESC`
    );

    return NextResponse.json(rows);
  } catch (error) {
    console.error("GET order list error:", error);
    return NextResponse.json({ success: false, message: "Server error" });
  }
}