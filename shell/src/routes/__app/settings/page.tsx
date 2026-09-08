import { useFetcher, useLoaderData } from "@modern-js/runtime/router";
import { Helmet } from "@modern-js/runtime/head";
import { Check } from "lucide-react";
import { type Account, type Profile } from "@/mock";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PendingButton, PageHeader, SectionCard } from "@/components/patterns/kit";
import type { SettingsData } from "./page.data";

export default function SettingsPage() {
  const { profile, accounts } = useLoaderData() as SettingsData;
  return (
    <>
      <Helmet>
        <title>Settings · Northwind Bank</title>
      </Helmet>
      <PageHeader title="Settings" description="Your profile, alert preferences and account names." />
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ProfileForm profile={profile} />
        <div className="space-y-6">
          <PrefsForm profile={profile} />
          <NicknamesForm accounts={accounts} />
        </div>
      </div>
    </>
  );
}

function Saved({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <span className="inline-flex items-center gap-1 text-xs text-[color:var(--pos)]">
      <Check className="size-3" /> Saved
    </span>
  );
}

function ProfileForm({ profile }: { profile: Profile }) {
  const fetcher = useFetcher<{ saved?: string }>();
  const p = (fetcher.data as { profile?: Profile })?.profile ?? profile;
  const busy = fetcher.state !== "idle" && fetcher.formData?.get("intent") === "profile";
  return (
    <SectionCard
      title="Profile"
      action={<Saved show={fetcher.data?.saved === "profile"} />}
      bodyClassName="p-0"
    >
      <fetcher.Form method="post" className="space-y-4 p-5">
        <input type="hidden" name="intent" value="profile" />
        <Field name="name" label="Full name" defaultValue={p.name} />
        <Field name="email" label="Email" type="email" defaultValue={p.email} />
        <Field name="phone" label="Phone" defaultValue={p.phone} />
        <Field name="address" label="Mailing address" defaultValue={p.address} />
        <PendingButton type="submit" pending={busy}>
          Save profile
        </PendingButton>
      </fetcher.Form>
    </SectionCard>
  );
}

function Field({
  name,
  label,
  defaultValue,
  type = "text",
}: {
  name: string;
  label: string;
  defaultValue: string;
  type?: string;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} defaultValue={defaultValue} />
    </div>
  );
}

function PrefsForm({ profile }: { profile: Profile }) {
  const fetcher = useFetcher<{ saved?: string; profile?: Profile }>();
  const p = fetcher.data?.profile ?? profile;
  const save = (patch: Partial<Pick<Profile, "marketingEmails" | "pushAlerts">>) =>
    fetcher.submit(
      {
        intent: "prefs",
        marketingEmails: String(patch.marketingEmails ?? p.marketingEmails),
        pushAlerts: String(patch.pushAlerts ?? p.pushAlerts),
      },
      { method: "post" },
    );
  return (
    <SectionCard
      title="Alert preferences"
      action={<Saved show={fetcher.data?.saved === "prefs"} />}
      bodyClassName="space-y-3"
    >
      <Toggle
        label="Push alerts"
        hint="Payments, sign-ins and card activity"
        checked={p.pushAlerts}
        onChange={(v) => save({ pushAlerts: v })}
      />
      <Toggle
        label="Product emails"
        hint="Occasional news about new features"
        checked={p.marketingEmails}
        onChange={(v) => save({ marketingEmails: v })}
      />
    </SectionCard>
  );
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function NicknamesForm({ accounts }: { accounts: Account[] }) {
  const fetcher = useFetcher<{ saved?: string; profile?: Profile }>();
  const nicknames = fetcher.data?.profile?.accountNicknames;
  const savingId =
    fetcher.state !== "idle" ? (fetcher.formData?.get("accountId") as string | null) : null;
  return (
    <SectionCard
      title="Account names"
      description="A nickname shows in place of the bank name everywhere."
      bodyClassName="space-y-3"
    >
      {accounts.map((a) => (
        <fetcher.Form key={a.id} method="post" className="flex items-end gap-2">
          <input type="hidden" name="intent" value="nickname" />
          <input type="hidden" name="accountId" value={a.id} />
          <div className="grid flex-1 gap-1.5">
            <Label htmlFor={`nick-${a.id}`} className="text-xs text-muted-foreground">
              {a.name} · {a.mask}
            </Label>
            <Input
              id={`nick-${a.id}`}
              name="nickname"
              placeholder="Add a nickname"
              defaultValue={nicknames?.[a.id] ?? a.nickname ?? ""}
            />
          </div>
          <Button type="submit" variant="outline" size="sm" disabled={savingId === a.id}>
            Save
          </Button>
        </fetcher.Form>
      ))}
    </SectionCard>
  );
}
