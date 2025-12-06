import "./globals.css";

export const metadata = {
  title: "CarDealer AI",
  description: "AI-powered tools for automotive dealerships"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
