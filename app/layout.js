// app/layout.js
import "./globals.css";

export const metadata = {
  title: "CarDealer AI",
  description: "AI tools for car dealerships to generate images, promotions, and more.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head />
      <body>{children}</body>
    </html>
  );
}
