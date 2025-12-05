import { redirect } from "next/navigation";
import { checkSubscription } from "@/lib/checkSubscription";

export default async function DashboardPage() {
  // Fetch the logged-in user from server-side cookie
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/me`, {
    cache: "no-store",
  });

  const data = await res.json();
  const user = data.user;

  // Not logged in → redirect to login
  if (!user || !user.uid) {
    redirect("/login");
  }

  // Check subscription on the server
  const active = await checkSubscription(user.uid);

  if (!active) {
    redirect("/subscribe");
  }

  // Success → user authenticated + subscribed
  return (
    <div style={{ padding: 40 }}>
      <h1>Dashboard</h1>
      <p>Welcome! Your subscription is active.</p>
    </div>
  );
}
