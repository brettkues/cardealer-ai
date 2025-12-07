import { NextResponse } from "next/server";
import { adminStorage, adminDB } from "@/lib/firebaseAdmin";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("logos");

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "No files uploaded." },
        { status: 400 }
      );
    }

    const bucket = adminStorage.bucket();
    const uploaded = [];

    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const filename = `logos/${Date.now()}-${file.name}`;
      const upload = bucket.file(filename);

      await upload.save(buffer, {
        contentType: file.type,
        public: true,
      });

      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;

      await adminDB.collection("logos").add({
        url: publicUrl,
        createdAt: Date.now(),
      });

      uploaded.push(publicUrl);
    }

    return NextResponse.json({
      message: "Logos uploaded.",
      urls: uploaded,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Logo upload failed." },
      { status: 500 }
    );
  }
}
