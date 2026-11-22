// src/app/layout.tsx
import type { Metadata } from "next";
import "@xyflow/react/dist/style.css";
import "./globals.css";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

export const metadata: Metadata = {
  title: "DSA Execution Studio | Real Data Structures & Visual Debugger",
  description:
    "Step-by-step visual execution of real data structures, pointers, recursion, searching, sorting, and trees.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body className="app-shell">
        <div className="ambient ambient-one" />
        <div className="ambient ambient-two" />
        <ThemeToggle />
        {children}
      </body>
    </html>
  );
}