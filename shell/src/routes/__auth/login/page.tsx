import { useEffect } from "react";
import {
  useActionData,
  useLoaderData,
  useNavigate,
  useNavigation,
  useSubmit,
} from "@modern-js/runtime/router";
import { Helmet } from "@modern-js/runtime/head";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AuthShell } from "@/components/auth-shell";
import type { LoginData, LoginActionData } from "./page.data";

export default function LoginRoute() {
  const { redirectTo } = useLoaderData() as LoginData;
  const actionData = useActionData() as LoginActionData | undefined;
  const submit = useSubmit();
  const navigate = useNavigate();
  const navigation = useNavigation();
  const busy = navigation.state !== "idle";

  useEffect(() => {
    if (actionData?.next) navigate(actionData.next);
  }, [actionData, navigate]);

  return (
    <AuthShell
      title="Welcome back"
      description="Sign in to your Northwind account to continue."
      footer={
        <>
          New to Northwind?{" "}
          <span className="font-medium text-foreground">Open an account</span> in minutes.
        </>
      }
    >
      <Helmet>
        <title>Sign in · Northwind Bank</title>
      </Helmet>
      <form
        method="post"
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          submit(e.currentTarget, { method: "post" });
        }}
      >
        <input type="hidden" name="redirectTo" value={redirectTo} />
        {actionData?.error ? (
          <Alert variant="destructive">
            <AlertDescription>{actionData.error}</AlertDescription>
          </Alert>
        ) : null}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            placeholder="alex.morgan@example.com"
            defaultValue="alex.morgan@example.com"
            required
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <span className="text-xs text-muted-foreground">Forgot password?</span>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••••"
            defaultValue="demo-password"
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : null}
          Continue
        </Button>
        <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
          Demo: any email and password are accepted. You’ll confirm with a one-time code on the
          next step.
        </p>
      </form>
    </AuthShell>
  );
}
