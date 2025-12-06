import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { checkSubscription } from "@/lib/checkSubscription";

export default async function DashboardPage() {
  // Read uid from cookies (set at login)
  const uid = cookies().get("uid")?.value;

  if (!uid) {
    redirect("/login");
  }

  // Validate subscription on the server
  const active = await checkSubscription(uid);

  if (!active) {
    redirect("/subscribe");
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Dashboard</h1>
      <p>Welcome! Your subscription is active.</p>
    </div>
  );
}
