export default function AdminPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold">Admin Panel</h1>
      <p className="mt-4">Select a tool below.</p>

      <div className="mt-6 space-y-4">
        <a href="/admin/users" className="block p-4 bg-gray-100 rounded shadow">
          User Management
        </a>

        <a href="/admin/system" className="block p-4 bg-gray-100 rounded shadow">
          System Activity
        </a>

        <a href="/admin/ai-review" className="block p-4 bg-gray-100 rounded shadow">
          AI Training Review
        </a>
      </div>
    </div>
  );
}
