import { redirect } from "next/navigation";

async function getSession() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/me`, {
    method: "GET",
    cache: "no-store",
  });

  return res.json();
}

async function checkSub(uid) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/subscription`, {
    method: "POST",
    cache: "no-store",
    body: JSON.stringify({ uid }),
  });

  return res.json();
}

export default async function DashboardPage() {
  // 1. Check login
  const session = await getSession();

  if (!session.loggedIn || !session.uid) {
    redirect("/login");
  }

  // 2. Check subscription
  const sub = await checkSub(session.uid);

  if (!sub.active) {
    redirect("/subscribe");
  }

  // 3. User is allowed → show dashboard
  return (
    <div style={{ padding: 40 }}>
      <h1>Dashboard</h1>
      <p>Welcome! Your subscription is active.</p>
    </div>
  );
}
