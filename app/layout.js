import "./globals.css";

export const metadata = {
  title: "Dealer Platform",
  description: "AI tools for automotive dealers",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
