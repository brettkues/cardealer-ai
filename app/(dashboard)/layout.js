export const dynamic = "force-dynamic";

import "../../globals.css";
import Sidebar from "@/components/Sidebar.js";

export const metadata = {
  title: "Dashboard",
};

export default function DashboardLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-gray-100 text-black">
      <Sidebar />
      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  );
}
