import { redirect } from "next/navigation";

export const dynamic = "force-dynamic"; // ensure fresh SSR

export default async function DashboardPage() {
  // 1. Get current session
  const sessionRes = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/me`,
    { cache: "no-store" }
  );

  const session = await sessionRes.json();

  // 2. No session → redirect to login
  if (!session.loggedIn || !session.uid) {
    redirect("/login");
  }

  // 3. Check subscription
  const subRes = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/subscription`,
    {
      method: "POST",
      body: JSON.stringify({ uid: session.uid }),
    }
  );

  const subData = await subRes.json();

  if (!subData.active) {
    redirect("/subscribe");
  }

  // 4. Authorized view
  return (
    <div style={{ padding: 40 }}>
      <h1>Dashboard</h1>
      <p>Your subscription is active.</p>
    </div>
  );
}
