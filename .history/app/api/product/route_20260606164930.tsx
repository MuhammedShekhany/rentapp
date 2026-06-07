import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      pro_name,
      br_id,
      user_id,
      pro_price,
      pro_gat_id,
      pro_img,
    } = body;

    if (
      !pro_name ||
      !br_id ||
      !user_id ||
      !pro_gat_id ||
      pro_price === undefined
    ) {
      return NextResponse.json({
        success: false,
        message: "Please fill all required fields",
      });
    }

    // The subquery now searches for the max pro_no *for this specific branch*
    await pool.execute(
      `INSERT INTO product
        (
          pro_name,
          br_id,
          user_id,
          pro_price,
          pro_gat_id,
          pro_img,
          pro_no
        )
       VALUES (?, ?, ?, ?, ?, ?, (SELECT COALESCE(MAX(p.pro_no), 0) + 1 FROM product p WHERE p.br_id = ?))`,
      [
        pro_name,
        br_id,
        user_id,
        pro_price,
        pro_gat_id,
        pro_img || "",
        br_id // Passed a second time for the subquery WHERE clause
      ]
    );

    return NextResponse.json({
      success: true,
      message: "Product added successfully",
    });
  } catch (error) {
    console.error("ADD PRODUCT ERROR:", error);

    if ((error as any).code === 'ER_DUP_ENTRY') {
      return NextResponse.json({
        success: false,
        message: "Conflict detected due to simultaneous entry. Please try again.",
      }, { status: 409 });
    }

    return NextResponse.json({
      success: false,
      message: "Server error",
    });
  }
}