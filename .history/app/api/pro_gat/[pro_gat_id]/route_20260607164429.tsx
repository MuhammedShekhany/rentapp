import { NextResponse } from "next/server";
import db from "@/app/lib/db";

type Params = {
  params: Promise<{ pro_gat_id: string }>;
};

// ======================
// GET single product category
// ======================

export async function GET(
  req: Request,
  { params }: Params
) {
  try {
    const { pro_gat_id } =
      await params;

    const [rows]: any =
      await db.execute(
        `SELECT

        pg.pro_gat_id,
        pg.pro_gat_no,
        pg.pro_gat_name,

        pg.br_id,
        pg.user_id,

        pg.createat,

        b.br_name,

        u.user_name

      FROM pro_gat pg

      LEFT JOIN branch b
      ON pg.br_id = b.br_id

      LEFT JOIN user u
      ON pg.user_id = u.user_id

      WHERE pg.pro_gat_id = ?`,
        [pro_gat_id]
      );

    if (
      !rows ||
      rows.length === 0
    ) {
      return NextResponse.json({
        success: false,
        message:
          "Product category not found",
      });
    }

    return NextResponse.json({
      success: true,
      pro_gat: rows[0],
    });

  } catch (error) {

    console.error(
      "GET pro_gat by id error:",
      error
    );

    return NextResponse.json({
      success: false,
      message: "Server error",
    });

  }
}

// ======================
// PUT update product category
// ======================

export async function PUT(
  req: Request,
  { params }: Params
) {
  try {
    const { pro_gat_id } =
      await params;

    const body = await req.json();

    const {
      pro_gat_name,

      br_id,
      user_id,
    } = body;

    // ======================
    // VALIDATION
    // ======================

    if (
      !pro_gat_name ||
      !br_id ||
      !user_id
    ) {
      return NextResponse.json({
        success: false,
        message:
          "Please fill all required fields",
      });
    }

    // ======================
    // UPDATE
    // ======================

    const [result]: any =
      await db.execute(
        `UPDATE pro_gat
       SET
         pro_gat_name = ?,
         br_id = ?,
         user_id = ?
       WHERE pro_gat_id = ?`,
        [
          pro_gat_name,

          br_id,
          user_id,

          pro_gat_id,
        ]
      );

    if (
      result.affectedRows === 0
    ) {
      return NextResponse.json({
        success: false,
        message:
          "Product category not found or not updated",
      });
    }

    return NextResponse.json({
      success: true,
      message:
        "Product category updated successfully",
    });

  } catch (error) {

    console.error(
      "PUT pro_gat error:",
      error
    );

    return NextResponse.json({
      success: false,
      message: "Server error",
    });

  }
}

// ======================
// DELETE product category
// ======================

export async function DELETE(
  req: Request,
  { params }: Params
) {
  try {
    const { pro_gat_id } =
      await params;

    const [result]: any =
      await db.execute(
        "DELETE FROM pro_gat WHERE pro_gat_id = ?",
        [pro_gat_id]
      );

    if (
      result.affectedRows === 0
    ) {
      return NextResponse.json({
        success: false,
        message: "Delete failed",
      });
    }

    return NextResponse.json({
      success: true,
      message:
        "Product category deleted successfully",
    });

  } catch (error) {

    console.error(
      "DELETE pro_gat error:",
      error
    );

    return NextResponse.json({
      success: false,
      message: "Server error",
    });

  }
}