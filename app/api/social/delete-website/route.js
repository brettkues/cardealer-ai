import { db } from "@/lib/firebaseAdmin";
import { doc, deleteDoc } from "firebase/firestore";

export async function POST(req) {
  try {
    const { id } = await req.json();

    await deleteDoc(doc(db, "websites", id));

    return Response.json({ success: true });
  } catch (error) {
    console.error("Delete failed:", error);
    return Response.json({ success: false, error: error.message });
  }
}
