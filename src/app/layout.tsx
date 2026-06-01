"use client";
import "./globals.css";
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AppTopbar } from "@/components/app-topbar";
import { AiChatbot } from "@/components/ai-chatbot";
import { Toaster } from "@/components/ui/sonner";
import { useRole } from "@/lib/role";
import { usePathname } from "next/navigation";

function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login";

  return (
    <>
      {isAuthPage ? (
        children
      ) : (
        <SidebarProvider>
          <div className="flex min-h-screen w-full bg-background">
            <AppSidebar />
            <SidebarInset className="flex flex-1 flex-col bg-background">
              <AppTopbar />
              <main className="flex-1 p-4 md:p-8">{children}</main>
            </SidebarInset>
          </div>
        </SidebarProvider>
      )}
      <Toaster />
    </>
  );
}

function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      <Shell>{children}</Shell>
      <AiChatbot />
    </QueryClientProvider>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>ASPEC — AI-Powered Predictive Maintenance</title>
        <meta name="description" content="ASPEC industrial AI dashboard for predictive maintenance" />
        <link rel="icon" type="image/png" href="/favicon.png" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}