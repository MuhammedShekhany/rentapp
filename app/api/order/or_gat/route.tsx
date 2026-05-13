import { NextResponse } from "next/server";
import db from "@/app/lib/db";

export async function GET() {
  const [rows]: any = await db.execute(
    `SELECT or_gat_id, or_gat_name FROM or_gat ORDER BY or_gat_name ASC`
  );
  return NextResponse.json({ success: true, gats: rows });
}