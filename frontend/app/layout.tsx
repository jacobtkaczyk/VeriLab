import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "VeriLab",
  description: "Web-based Verilog IDE",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* Force dark mode background immediately */}
      <body className={`${inter.className} bg-[#1e1e1e] text-slate-300 h-screen w-screen overflow-hidden`}>
        {children}
      </body>
    </html>
  );
}