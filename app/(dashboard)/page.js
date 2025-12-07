// app/(dashboard)/page.js

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-3xl font-semibold mb-4">Welcome</h1>
      <p>Select a tool from the sidebar to get started.</p>
    </div>
  );
}
