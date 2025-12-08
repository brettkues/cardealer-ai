import { adminDb } from "@/lib/firebaseAdmin";

export async function GET() {
  try {
    const adminUid = "AHOzcYo7lTedRczBr4PVRHAusn12";

    await adminDb
      .collection("users")
      .doc(adminUid)
      .set({ role: "admin" }, { merge: true });

    return Response.json({
      success: true,
      message: "Admin role assigned."
    });

  } catch (error) {
    console.error("Admin setup error:", error);
    return Response.json({
      success: false,
      message: error.message
    });
  }
}

export async function POST() {
  return GET();
}
