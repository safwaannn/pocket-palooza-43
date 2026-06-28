import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  // Authentication disabled - direct login
  // beforeLoad: async () => {
  //   const { data, error } = await supabase.auth.getUser();
  //   if (error || !data.user) throw redirect({ to: "/auth" });
  //   return { user: data.user };
  // },
  component: () => <Outlet />,
});
