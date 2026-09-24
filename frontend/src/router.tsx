import { createBrowserRouter, RouterProvider } from "react-router-dom";

import { RootLayout } from "@/layouts/RootLayout";
import { AuthenticatedLayout } from "@/layouts/AuthenticatedLayout";
import { NotFound } from "@/components/NotFound";
import { RouteError } from "@/components/RouteError";

import { LandingPage } from "@/pages/landing";
import { AboutPage } from "@/pages/about";
import { LoginPage } from "@/pages/login";
import { SignUpPage } from "@/pages/signup";
import { ForgotPasswordPage } from "@/pages/forgot-password";
import { HelpPage } from "@/pages/help";
import { PrivacyPage } from "@/pages/privacy";
import { ResetPasswordPage } from "@/pages/reset-password";
import { TermsPage } from "@/pages/terms";

import { AdminPage } from "@/pages/admin";
import { AlertsPage } from "@/pages/alerts";
import { BudgetsPage } from "@/pages/budgets";
import { SubscriptionCalendarPage } from "@/pages/calendar";
import { CategoriesPage } from "@/pages/categories";
import { Dashboard as DashboardPage } from "@/pages/dashboard";
import { GoalsPage } from "@/pages/goals";
import { InsightsPage } from "@/pages/insights";
import { NotificationsPage } from "@/pages/notifications";
import { RecurringPage } from "@/pages/recurring";
import { ReportsPage } from "@/pages/reports";
import { SettingsPage } from "@/pages/settings";
import { SupportPage } from "@/pages/support";
import { TransactionsPage } from "@/pages/transactions";

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: "about", element: <AboutPage /> },
      { path: "login", element: <LoginPage /> },
      { path: "signup", element: <SignUpPage /> },
      { path: "forgot-password", element: <ForgotPasswordPage /> },
      { path: "help", element: <HelpPage /> },
      { path: "privacy", element: <PrivacyPage /> },
      { path: "reset-password", element: <ResetPasswordPage /> },
      { path: "terms", element: <TermsPage /> },

      // Protected pages — gated by AuthenticatedLayout below.
      {
        element: <AuthenticatedLayout />,
        children: [
          { path: "admin", element: <AdminPage /> },
          { path: "alerts", element: <AlertsPage /> },
          { path: "budgets", element: <BudgetsPage /> },
          { path: "calendar", element: <SubscriptionCalendarPage /> },
          { path: "categories", element: <CategoriesPage /> },
          { path: "dashboard", element: <DashboardPage /> },
          { path: "goals", element: <GoalsPage /> },
          { path: "insights", element: <InsightsPage /> },
          { path: "notifications", element: <NotificationsPage /> },
          { path: "recurring", element: <RecurringPage /> },
          { path: "reports", element: <ReportsPage /> },
          { path: "settings", element: <SettingsPage /> },
          { path: "support", element: <SupportPage /> },
          { path: "transactions", element: <TransactionsPage /> },
        ],
      },

      { path: "*", element: <NotFound /> },
    ],
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
