import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({
        success: false,
        message: "No file",
      });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // 🔥 خذ الامتداد الحقيقي
    const ext = path.extname(file.name);

    const cleanName = `file-${Date.now()}-${randomUUID()}${ext}`;

    const uploadDir = "/home/deploy/myapps/rentimages/";

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, cleanName);

    await fs.promises.writeFile(filePath, buffer);

    return NextResponse.json({
      success: true,
      url:`/rentimages/${cleanName}`,
    });

  } catch (error) {
    console.error(error);

    return NextResponse.json({
      success: false,
      message: "Upload failed",
    });
  }
}