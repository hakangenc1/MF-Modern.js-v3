import { useRouteError, isRouteErrorResponse } from "@modern-js/runtime/router";
import { Button } from "@/components/ui/button";

export default function ErrorBoundary() {
  const error = useRouteError();
  const title = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : "Something went wrong";
  const detail = isRouteErrorResponse(error)
    ? error.data || "The page you’re looking for isn’t here."
    : error instanceof Error
      ? error.message
      : "An unexpected error occurred.";

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-sm font-medium text-muted-foreground">Northwind Bank</p>
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="max-w-md text-sm text-muted-foreground">{detail}</p>
      <Button asChild variant="outline">
        <a href="/">Back to dashboard</a>
      </Button>
    </div>
  );
}
