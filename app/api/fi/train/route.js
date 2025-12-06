import { NextResponse } from "next/server";
import { saveFITraining } from "../../../../lib/ai/vector-store-fi";
import { adminStorage } from "../../../../lib/firebaseAdmin";

export async function POST(req) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    const text = form.get("text");

    let fileUrl = null;

    // Handle uploaded PDF for training
    if (file) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const filename = `fi-training/${Date.now()}-${file.name}`;
      const bucket = adminStorage.bucket();
      const fileRef = bucket.file(filename);

      await fileRef.save(buffer, {
        contentType: file.type,
      });

      fileUrl = (await fileRef.getSignedUrl({
        action: "read",
        expires: "03-01-2035",
      }))[0];
    }

    // Save text training
    if (text) {
      await saveFITraining({ text, fileUrl });
    }

    return NextResponse.json({ message: "F&I training saved." });
  } catch (err) {
    return NextResponse.json({ message: "Error saving F&I training." }, { status: 500 });
  }
}
