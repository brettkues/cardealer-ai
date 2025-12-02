// app/page.js
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-4 bg-gray-100 text-center">
      <h1 className="text-4xl font-bold mb-6">Welcome to CarDealer AI</h1>
      <p className="mb-8 text-lg max-w-xl">
        Generate car images, create sales promotions, and automate your dealership's marketing with AI.
      </p>

      <div className="flex flex-col space-y-4">
        <Link href="/register" className="text-blue-600 underline">
          Register
        </Link>
        <Link href="/login" className="text-blue-600 underline">
          Login
        </Link>
        <Link href="/dashboard" className="text-blue-600 underline">
          Go to Dashboard
        </Link>
      </div>
    </main>
  );
}
