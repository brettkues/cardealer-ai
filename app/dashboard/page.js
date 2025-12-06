import { redirect } from "next/navigation";
import { checkSession } from "@/app/api/auth/session/get/route";

export default async function DashboardPage() {
  // Read session (server-side)
  const session = await checkSession();

  // If no session → redirect to login
  if (!session?.uid) {
    redirect("/login");
  }

  // Check subscription (server-side)
  const subscribed = await session?.subscribed;

  if (!subscribed) {
    redirect("/subscribe");
  }

  // If subscribed, render dashboard
  return (
    <div style={{ padding: 40 }}>
      <h1>Dashboard</h1>
      <p>Welcome! Your subscription is active.</p>
    </div>
  );
}
