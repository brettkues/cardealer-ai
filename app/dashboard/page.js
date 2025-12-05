import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { checkSubscription } from "@/lib/checkSubscription";

export default async function DashboardPage() {
  // Read UID from secure cookie created at login
  const uid = cookies().get("session_uid")?.value;

  // If cookie missing → not logged in
  if (!uid) {
    redirect("/login");
  }

  // Check subscription status
  const subscribed = await checkSubscription(uid);

  if (!subscribed) {
    redirect("/subscribe");
  }

  // If valid → show dashboard
  return (
    <div style={{ padding: 40 }}>
      <h1>Dashboard</h1>
      <p>Your subscription is active. Welcome to your tools.</p>
    </div>
  );
}
