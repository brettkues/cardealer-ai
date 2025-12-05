// SERVER COMPONENT — SAFE FOR NEXT.JS + VERCEL
import { redirect } from "next/navigation";
import { adminDB } from "@/lib/firebaseAdmin";

// Helper function to get UID from cookies later (placeholder for now)
async function getUID() {
  // TODO: Replace with real session logic
  return null;
}

export default async function DashboardPage() {
  const uid = await getUID();

  // If no user → redirect to login
  if (!uid) {
    redirect("/login");
  }

  // Retrieve subscription using firebase-admin ONLY
  const snap = await adminDB.collection("users").doc(uid).get();

  if (!snap.exists || snap.data().subscribed !== true) {
    redirect("/subscribe");
  }

  // If subscribed → show dashboard
  return (
    <div style={{ padding: 40 }}>
      <h1>Dashboard</h1>
      <p>Welcome! Your subscription is active.</p>
    </div>
  );
}
