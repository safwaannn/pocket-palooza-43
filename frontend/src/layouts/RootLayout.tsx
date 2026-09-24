import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, useLocation } from "react-router-dom";

import { Toaster } from "@/components/ui/sonner";
import { Footer } from "@/components/Footer";
import { AuthProvider } from "@/lib/auth-context";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 2 minutes — no refetch while fresh.
      staleTime: 2 * 60 * 1000,
      // Keep unused data in cache for 5 minutes before garbage collecting.
      gcTime: 5 * 60 * 1000,
      // Don't refetch just because the user clicked on another tab and came back.
      refetchOnWindowFocus: false,
      // Only retry once on failure (default is 3). Stops hammering the rate
      // limiter when the server is already returning 429.
      retry: 1,
    },
  },
});

export function RootLayout() {
  const { pathname } = useLocation();
  const showFooter = !["/login", "/signup", "/forgot-password", "/reset-password"].includes(pathname);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Outlet />
        {showFooter && <Footer />}
        <Toaster richColors position="top-right" />
      </AuthProvider>
    </QueryClientProvider>
  );
}
