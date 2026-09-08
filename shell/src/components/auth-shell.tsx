import { Landmark, ShieldCheck } from "lucide-react";

export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Landmark className="size-5" />
            </div>
            <span className="text-lg font-semibold tracking-tight">Northwind Bank</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
          <div className="mt-8">{children}</div>
          {footer ? <div className="mt-6 text-sm text-muted-foreground">{footer}</div> : null}
        </div>
      </div>
      <div className="relative hidden overflow-hidden bg-primary lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.18),transparent_45%),radial-gradient(circle_at_75%_75%,rgba(255,255,255,0.12),transparent_40%)]" />
        <div className="relative flex h-full flex-col justify-between p-12 text-primary-foreground">
          <div className="flex items-center gap-2 text-sm font-medium opacity-80">
            <ShieldCheck className="size-4" /> Bank-grade encryption
          </div>
          <div>
            <p className="text-2xl font-medium leading-snug">
              Every account, card, and payment — in one secure place.
            </p>
            <p className="mt-4 max-w-md text-sm opacity-80">
              Northwind Premier gives you real-time insights, instant transfers, and
              hardware-key two-factor protection on every sign-in.
            </p>
          </div>
          <dl className="grid grid-cols-3 gap-6 text-sm">
            <div>
              <dt className="opacity-70">Uptime</dt>
              <dd className="text-lg font-semibold">99.99%</dd>
            </div>
            <div>
              <dt className="opacity-70">Members</dt>
              <dd className="text-lg font-semibold">2.4M</dd>
            </div>
            <div>
              <dt className="opacity-70">Since</dt>
              <dd className="text-lg font-semibold">1998</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
