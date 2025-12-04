import { redirect } from "next/navigation";
import { checkSubscription } from "@/lib/checkSubscription";

export default async function DashboardPage() {
  // Read UID from cookies or headers via server context
  const uid = ""; // <-- We will wire this up after we fix login

  // If uid is missing, redirect to login
  if (!uid) {
    redirect("/login");
  }

  // Check subscription server-side
  const subscribed = await checkSubscription(uid);

  if (!subscribed) {
    redirect("/subscribe");
  }

  // If subscribed, show dashboard
  return (
    <div style={{ padding: 40 }}>
      <h1>Dashboard</h1>
      <p>Welcome! Your subscription is active.</p>
    </div>
  );
}
