import { Link, isRouteErrorResponse, useRouteError } from "react-router-dom";

export function RouteError() {
  const error = useRouteError();
  const message = isRouteErrorResponse(error)
    ? error.statusText
    : "Something went wrong while opening this page.";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-ground p-6">
      <section className="max-w-md border border-rule bg-slate-panel p-8 text-center">
        <h1 className="text-2xl font-semibold text-ink">Unable to open this page</h1>
        <p className="mt-2 text-sm text-ink-muted">{message}</p>
        <Link
          to="/assignments"
          className="mt-6 inline-flex rounded-sm bg-ink px-4 py-2 text-sm font-semibold text-ink-inverse"
        >
          Return to assignments
        </Link>
      </section>
    </main>
  );
}
