import { NextResponse } from "next/server";
import { adminStorage } from "@/lib/firebaseAdmin";

export async function GET() {
  try {
    const bucket = adminStorage.bucket();
    const [files] = await bucket.getFiles({ prefix: "logos/" });

    const logos = [];

    for (const file of files) {
      const [signedUrl] = await file.getSignedUrl({
        action: "read",
        expires: "03-01-2035",
      });

      logos.push({
        name: file.name,
        url: signedUrl,
      });
    }

    return NextResponse.json(
      { logos },
      { status: 200 }
    );

  } catch (error) {
    return NextResponse.json(
      { logos: [] },
      { status: 200 }
    );
  }
}
