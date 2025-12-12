import { redirect } from "next/navigation";

// Force Vercel rebuild — no functional change
export default function HomePage() {
  redirect("/dashboard");
}
