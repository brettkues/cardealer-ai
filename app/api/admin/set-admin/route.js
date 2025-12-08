import { adminDb } from "@/lib/firebaseAdmin"; 
import { doc, setDoc } from "firebase/firestore";

export async function GET() {
  try {
    const adminUid = "AHOzcYo7lTedRczBr4PVRHAusn12";

    await setDoc(
      doc(adminDb, "users", adminUid),
      { role: "admin" },
      { merge: true }
    );

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
