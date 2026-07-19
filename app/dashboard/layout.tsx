"use client";

import { AuthGuard } from "@/components/AuthGuard";
import { Sidebar } from "@/components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="flex bg-black text-white">
        <Sidebar />
        <main className="flex-1 md:ml-64">
          <div className="min-h-screen p-4 md:p-8">{children}</div>
        </main>
      </div>
    </AuthGuard>
  );
}
