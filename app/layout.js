import "./globals.css";

export const metadata = {
  title: "Dealer Platform",
  description: "Tools for dealership management and advertising.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
