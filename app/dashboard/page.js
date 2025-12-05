import { redirect } from "next/navigation";

// SERVER-SIDE SESSION LOOKUP
async function getSession() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/session/get`, {
    method: "GET",
    cache: "no-store",
  });

  if (!res.ok) return null;

  const data = await res.json();
  return data.session || null;
}

export default async function DashboardPage() {
  const session = await getSession();

  // Not logged in
  if (!session?.uid) {
    redirect("/login");
  }

  // Not subscribed
  if (!session.subscribed) {
    redirect("/subscribe");
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Dashboard</h1>
      <p>Your subscription is active.</p>
      <p>User ID: {session.uid}</p>
    </div>
  );
}
