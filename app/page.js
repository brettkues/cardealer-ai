import { redirect } from "next/navigation";

export default function HomePage() {
  redirect("/login");
  return null; // fallback for React (never actually reached)
}
