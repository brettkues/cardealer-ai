import { redirect } from "next/navigation";

// Dashboard is a SERVER COMPONENT

export default async function DashboardPage() {
  // 1 — Get UID from secure cookie through API route
  const sessionRes = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/session/get`,
    { cache: "no-store" }
  );
  const session = await sessionRes.json();
  const uid = session.uid;

  // If no UID → not logged in
  if (!uid) {
    redirect("/login");
  }

  // 2 — Check subscription status
  const subRes = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/subscription`,
    {
      method: "POST",
      body: JSON.stringify({ uid }),
      cache: "no-store",
    }
  );
  const subData = await subRes.json();

  if (!subData.active) {
    redirect("/subscribe");
  }

  // 3 — Render dashboard (user is authenticated + subscribed)
  return (
    <div style={{ padding: 40 }}>
      <h1>Dashboard</h1>
      <p>You are logged in and your subscription is active.</p>
    </div>
  );
}
