import { adminDB } from "@/lib/firebaseAdmin";

export async function GET(request, { params }) {
  try {
    const uid = params.uid;

    const doc = await adminDB.collection("users").doc(uid).get();

    if (!doc.exists) {
      return Response.json({ role: "user" }); // default role
    }

    return Response.json(doc.data());
  } catch (error) {
    console.error("User role fetch error:", error);
    return Response.json({ role: "user" });
  }
}
