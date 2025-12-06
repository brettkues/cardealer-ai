import "../globals.css";

export const metadata = {
  title: "Account | CarDealership AI",
};

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 text-black p-8">
      <div className="w-full max-w-md bg-white p-8 rounded shadow-xl border border-gray-200">
        {children}
      </div>
    </div>
  );
}
