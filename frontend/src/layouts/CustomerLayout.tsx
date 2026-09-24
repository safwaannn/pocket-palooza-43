import { Outlet } from "react-router-dom";
import { CustomerSidebar } from "@/components/customer/CustomerSidebar";
import { CustomerNavbar } from "@/components/customer/CustomerNavbar";

export function CustomerLayout() {
  return (
    <div className="flex min-h-dvh bg-background">
      <CustomerNavbar />
      <div className="flex min-w-0 flex-1 flex-col">
        <CustomerSidebar />

        <main className="flex-1 overflow-x-hidden p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
