import { Component, type ReactNode } from "react";

export class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) return (
      <div role="alert" className="border border-halt/25 bg-halt-soft p-8 text-center text-sm text-halt">
        Something went wrong.
      </div>
    );
    return this.props.children;
  }
}
