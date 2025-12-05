import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminDB } from "@/lib/firebaseAdmin";

// Server-side subscription check
async function getSubscriptionStatus(uid) {
  try {
    const snap = await adminDB.collection("users").doc(uid).get();
    if (!snap.exists) return false;

    const data = snap.data();
    return data.subscribed === true;
  } catch (err) {
    console.error("Subscription check failed:", err);
    return false;
  }
}

export default async function DashboardPage() {
  // Read UID from session cookie
  const cookieStore = cookies();
  const uid = cookieStore.get("uid")?.value;

  // If not logged in → login
  if (!uid) {
    redirect("/login");
  }

  // Check subscription from Firestore (server-only)
  const active = await getSubscriptionStatus(uid);

  // If no subscription → subscribe page
  if (!active) {
    redirect("/subscribe");
  }

  // If valid subscription → show dashboard
  return (
    <div style={{ padding: 40 }}>
      <h1>Dashboard</h1>
      <p>Your subscription is active. Welcome!</p>
    </div>
  );
}
