import { Link, isRouteErrorResponse, useRouteError } from "react-router-dom";

export function RouteError() {
  const error = useRouteError();
  const message = isRouteErrorResponse(error)
    ? error.statusText
    : "Something went wrong while opening this page.";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f5f1] p-6">
      <section className="max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-bold text-zinc-900">Unable to open this page</h1>
        <p className="mt-2 text-sm text-zinc-500">{message}</p>
        <Link
          to="/assignments"
          className="mt-6 inline-flex rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white"
        >
          Return to assignments
        </Link>
      </section>
    </main>
  );
}
