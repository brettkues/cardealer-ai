import { NextResponse } from "next/server";
import { adminStorage } from "../../../../lib/firebaseAdmin";

export async function GET() {
  try {
    const bucket = adminStorage.bucket();
    const [files] = await bucket.getFiles({ prefix: "logos/" });

    const urls = [];

    for (const file of files) {
      const [url] = await file.getSignedUrl({
        action: "read",
        expires: "03-01-2035",
      });
      urls.push(url);
    }

    return NextResponse.json({ logos: urls });
  } catch (err) {
    return NextResponse.json({ logos: [] });
  }
}
