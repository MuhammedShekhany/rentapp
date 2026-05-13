import { NextResponse } from "next/server";
import db from "@/app/lib/db";
import fs from "fs";
import path from "path";

type Params = {
  params: Promise<{ br_id: string }>;
};

// ======================
// GET ONE
// ======================
export async function GET(req: Request, { params }: Params) {
  try {
    const { br_id } = await params;

    const [rows]: any = await db.execute(
      `SELECT 
        br_id, br_name, br_phone, br_add, 
        br_logo, br_header, createat
       FROM branch
       WHERE br_id = ?`,
      [br_id]
    );

    if (!rows.length) {
      return NextResponse.json({
        success: false,
        message: "Branch not found",
      });
    }

    return NextResponse.json({
      success: true,
      branch: rows[0],
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Server error" });
  }
}

// ======================
// UPDATE
// ======================
export async function PUT(req: Request, { params }: Params) {
  try {
    const { br_id } = await params;
    const body = await req.json();

    const {
      br_name,
      br_phone,
      br_add,
      br_logo,
      br_header,
      old_logo,
      old_header,
    } = body;

    if (!br_name || !br_phone || !br_add) {
      return NextResponse.json({
        success: false,
        message: "Please fill all fields",
      });
    }

    await db.execute(
      `UPDATE branch
       SET br_name=?, br_phone=?, br_add=?, br_logo=?, br_header=?
       WHERE br_id=?`,
      [br_name, br_phone, br_add, br_logo || "", br_header || "", br_id]
    );

    // delete old logo
    if (
      old_logo &&
      br_logo &&
      old_logo !== br_logo &&
      old_logo.startsWith("/uploads/")
    ) {
      const filePath = path.join(process.cwd(), "public", old_logo);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    // delete old header
    if (
      old_header &&
      br_header &&
      old_header !== br_header &&
      old_header.startsWith("/uploads/")
    ) {
      const filePath = path.join(process.cwd(), "public", old_header);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    return NextResponse.json({
      success: true,
      message: "Updated successfully",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Server error" });
  }
}

// ======================
// DELETE
// ======================
export async function DELETE(req: Request, { params }: Params) {
  try {
    const { br_id } = await params;

    const [rows]: any = await db.execute(
      `SELECT br_logo, br_header FROM branch WHERE br_id=?`,
      [br_id]
    );

    if (!rows.length) {
      return NextResponse.json({
        success: false,
        message: "Not found",
      });
    }

    const branch = rows[0];

    await db.execute(`DELETE FROM branch WHERE br_id=?`, [br_id]);

    // delete images
    [branch.br_logo, branch.br_header].forEach((img: string) => {
      if (img && img.startsWith("/uploads/")) {
        const filePath = path.join(process.cwd(), "public", img);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
    });

    return NextResponse.json({
      success: true,
      message: "Deleted successfully",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Server error" });
  }
}