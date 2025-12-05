import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { checkSubscription } from "@/lib/checkSubscription";

export default async function DashboardPage() {
  // 1. Read uid from cookie (server-side, safe)
  const uid = cookies().get("uid")?.value || null;

  if (!uid) {
    redirect("/login");
  }

  // 2. Check subscription through Firebase Admin
  const active = await checkSubscription(uid);

  if (!active) {
    redirect("/subscribe");
  }

  // 3. Render dashboard normally
  return (
    <div style={{ padding: 40 }}>
      <h1>Dashboard</h1>
      <p>Your subscription is active. Welcome!</p>
    </div>
  );
}
