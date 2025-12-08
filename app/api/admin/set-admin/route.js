import { db } from "@/lib/firebaseAdmin";
import { doc, setDoc } from "firebase/firestore";

async function assignAdmin() {
  const adminUid = "AHOzcYo7lTedRczBr4PVRHAusn12"; // Brett’s UID
  await setDoc(doc(db, "users", adminUid), { role: "admin" }, { merge: true });
  return Response.json({ success: true, message: "Admin role assigned." });
}

export async function GET() {
  return assignAdmin();
}

export async function POST() {
  return assignAdmin();
}
