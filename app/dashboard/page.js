import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { checkSubscription } from "@/lib/checkSubscription";

export default async function DashboardPage() {
  // Read the UID from the session cookie
  const cookieStore = cookies();
  const uid = cookieStore.get("uid")?.value || null;

  // No UID → user not logged in
  if (!uid) {
    redirect("/login");
  }

  // Verify subscription server-side
  const subscribed = await checkSubscription(uid);

  if (!subscribed) {
    redirect("/subscribe");
  }

  // If logged in AND subscribed → show dashboard
  return (
    <div style={{ padding: 40 }}>
      <h1>Dashboard</h1>
      <p>Your subscription is active.</p>
    </div>
  );
}
