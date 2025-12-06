import { NextResponse } from "next/server";
import { saveSalesTraining } from "@/lib/ai/vector-store-sales";
import { adminStorage } from "@/lib/firebaseAdmin";

export async function POST(req) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    const text = form.get("text");

    let fileUrl = null;

    // Handle uploaded PDF
    if (file) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const filename = `sales-training/${Date.now()}-${file.name}`;
      const bucket = adminStorage.bucket();
      const fileRef = bucket.file(filename);

      await fileRef.save(buffer, {
        contentType: file.type,
      });

      const [signedUrl] = await fileRef.getSignedUrl({
        action: "read",
        expires: "03-01-2035",
      });

      fileUrl = signedUrl;
    }

    // Handle typed text input
    if (text) {
      await saveSalesTraining({ text, fileUrl });
    }

    return NextResponse.json({ message: "Sales training saved." }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: "Error saving training." },
      { status: 500 }
    );
  }
}
