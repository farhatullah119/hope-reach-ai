import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { checkIsAdmin } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminGate,
});

function AdminGate() {
  const check = useServerFn(checkIsAdmin);
  const { data, isPending } = useQuery({ queryKey: ["is-admin"], queryFn: () => check() });

  if (isPending) {
    return (
      <div className="min-h-dvh grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!data?.isAdmin) {
    return (
      <div className="min-h-dvh grid place-items-center p-6">
        <div className="glass max-w-md rounded-2xl p-8 text-center">
          <ShieldAlert className="mx-auto h-10 w-10 text-destructive" />
          <h1 className="mt-4 text-xl font-bold">Administrator access required</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your account does not have the admin role. If you believe this is a mistake, contact the site owner.
          </p>
          <Link to="/dashboard" className="mt-6 inline-block">
            <Button>Back to my dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }
  return <Outlet />;
}