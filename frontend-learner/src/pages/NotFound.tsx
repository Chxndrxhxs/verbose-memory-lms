import { Link } from "react-router-dom";
import { Button } from "../components/Button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-room px-4">
      <div className="max-w-md text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-faint">
          404
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink">
          This page moved on.
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-muted">
          The page you are looking for does not exist — or never did. The
          catalogue is a good place to start again.
        </p>
        <Link to="/" className="mt-6 inline-block">
          <Button variant="primary" size="lg">Back to home</Button>
        </Link>
      </div>
    </div>
  );
}
