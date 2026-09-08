import { useEffect } from "react";
import {
  Link,
  useActionData,
  useLoaderData,
  useNavigate,
  useNavigation,
  useSubmit,
} from "@modern-js/runtime/router";
import { Helmet } from "@modern-js/runtime/head";
import { DEMO_2FA_CODE } from "@/mock";
import { AuthShell } from "@/components/auth-shell";
import { TwoFactorChallenge } from "twofactor/TwoFactorChallenge";
import type { VerifyData, VerifyActionData } from "./page.data";

export default function VerifyRoute() {
  const { email } = useLoaderData() as VerifyData;
  const actionData = useActionData() as VerifyActionData | undefined;
  const submit = useSubmit();
  const navigate = useNavigate();
  const navigation = useNavigation();

  useEffect(() => {
    if (actionData?.next) navigate(actionData.next);
  }, [actionData, navigate]);

  return (
    <AuthShell
      title="Verify it’s you"
      description="Two-factor authentication keeps your account protected."
      footer={
        <>
          Lost your device?{" "}
          <Link
            to="/login"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Use a recovery code
          </Link>
        </>
      }
    >
      <Helmet>
        <title>Verify it’s you · Northwind Bank</title>
      </Helmet>
      <TwoFactorChallenge
        email={email}
        demoCode={DEMO_2FA_CODE}
        pending={navigation.state !== "idle"}
        error={actionData?.error}
        onSubmit={(code: string) => submit({ code }, { method: "post" })}
      />
    </AuthShell>
  );
}
