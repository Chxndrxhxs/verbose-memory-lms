import { Link } from "react-router-dom";
import { ArrowLeft } from "@masterlms/shared";
import { TopNav } from "../components/TopNav";
import { WishlistContainer } from "../containers/Wishlist.container";
import { PageShell } from "../components/Panel";

export default function Wishlist() {
  return (
    <div className="min-h-screen bg-room">
      <TopNav />
      <PageShell>
        <Link
          to="/profile"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-muted transition-colors hover:text-ink"
        >
          <ArrowLeft size={14} strokeWidth={2.5} aria-hidden /> Back to profile
        </Link>
        <h1 className="mt-3 text-2xl font-semibold text-ink">Your wishlist</h1>
        <p className="mt-1 text-sm text-ink-muted">Courses you've saved for later.</p>
        <WishlistContainer />
      </PageShell>
    </div>
  );
}
