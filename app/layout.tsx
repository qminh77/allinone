import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Tool Website - Supabase + Next.js",
  description: "Hệ thống quản lý tools với phân quyền động",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
