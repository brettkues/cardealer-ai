// app/layout.js
import "./globals.css";

export const metadata = {
  title: "CarDealer AI",
  description: "AI tools for car dealerships to generate images and automate marketing",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-white text-gray-900">{children}</body>
    </html>
  );
}
