import { Component, type ReactNode } from "react";
import { RefreshCw } from "@masterlms/shared";
import { Button } from "./Button";

export class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError)
      return (
        <div className="flex min-h-screen items-center justify-center bg-paper px-4">
          <div className="w-full max-w-md border border-rule bg-paper-raised p-6 text-center">
            <h1 className="text-lg font-semibold text-ink">The panel hit an error</h1>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              A component failed to render. Reloading usually clears it. If it keeps happening,
              check the browser console and the backend logs.
            </p>
            <Button
              variant="primary"
              className="mt-5"
              onClick={() => window.location.reload()}
            >
              <RefreshCw size={15} strokeWidth={2.5} aria-hidden /> Reload the panel
            </Button>
          </div>
        </div>
      );
    return this.props.children;
  }
}