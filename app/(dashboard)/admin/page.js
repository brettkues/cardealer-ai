export const dynamic = "force-dynamic";

export default function AdminPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Admin Panel</h1>
      <p>Only admins can access this page.</p>
    </div>
  );
}
