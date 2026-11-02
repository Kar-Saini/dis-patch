"use client";

import { AuthGuard } from "@/components/AuthGuard";
import { Sidebar } from "@/components/Sidebar";

export default function CompanyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-background text-foreground">
        <Sidebar />

        <main className="min-w-0 flex-1 bg-background text-foreground md:ml-64">
          <div className="min-h-screen p-4 pt-16 md:p-8">{children}</div>
        </main>
      </div>
    </AuthGuard>
  );
}
