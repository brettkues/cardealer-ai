import { NextResponse } from "next/server";
import { adminStorage } from "@/lib/firebaseAdmin";

export async function POST(req) {
  try {
    const form = await req.formData();
    const files = form.getAll("logos");

    if (!files.length) {
      return NextResponse.json(
        { message: "No files uploaded." },
        { status: 200 }
      );
    }

    const uploaded = [];

    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const filename = `logos/${Date.now()}-${file.name}`;
      const bucket = adminStorage.bucket();
      const fileRef = bucket.file(filename);

      await fileRef.save(buffer, { contentType: file.type });

      const [signedUrl] = await fileRef.getSignedUrl({
        action: "read",
        expires: "03-01-2035",
      });

      uploaded.push(signedUrl);
    }

    return NextResponse.json(
      { message: "Logos uploaded.", urls: uploaded },
      { status: 200 }
    );

  } catch (error) {
    return NextResponse.json(
      { message: "Error uploading logos." },
      { status: 500 }
    );
  }
}
