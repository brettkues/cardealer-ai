import { redirect } from "next/navigation";
import { checkSubscription } from "@/lib/checkSubscription";

// Dashboard must run ONLY on server
export const dynamic = "force-dynamic";

async function getUIDFromSession() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/session/me`, {
      cache: "no-store",
      method: "GET",
    });

    if (!res.ok) return null;

    const data = await res.json();
    return data.uid || null;
  } catch {
    return null;
  }
}

export default async function DashboardPage() {
  // Get UID from our session API
  const uid = await getUIDFromSession();

  // If no uid → not logged in
  if (!uid) {
    redirect("/login");
  }

  // Check subscription status
  const subscribed = await checkSubscription(uid);

  if (!subscribed) {
    redirect("/subscribe");
  }

  // Render dashboard
  return (
    <div style={{ padding: 40 }}>
      <h1>Dashboard</h1>
      <p>Welcome! Your subscription is active.</p>
    </div>
  );
}
