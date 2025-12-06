import { NextResponse } from "next/server";
import { saveSalesTraining } from "../../../../lib/ai/vector-store-sales";
import { adminStorage } from "../../../../lib/firebaseAdmin";

export async function POST(req) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    const text = form.get("text");

    let fileUrl = null;

    // If a PDF was uploaded, store it
    if (file) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const filename = `sales-training/${Date.now()}-${file.name}`;
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

    // If user also typed training text
    if (text) {
      await saveSalesTraining({ text, fileUrl });
    }

    return NextResponse.json({ message: "Sales training saved." });
  } catch (err) {
    return NextResponse.json({ message: "Error saving training." }, { status: 500 });
  }
}
