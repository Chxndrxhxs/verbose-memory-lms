import { Link } from "react-router-dom";
import { ArrowLeft } from "@masterlms/shared";
import { TopNav } from "../components/TopNav";
import { WishlistContainer } from "../containers/Wishlist.container";

export default function Wishlist() {
  return (
    <div className="min-h-screen bg-[#f6f5f1]">
      <TopNav />
      <div className="w-full px-3 py-6 sm:px-4">
        <div className="rounded-[28px] bg-white p-8 shadow-sm sm:p-10">
          <Link
            to="/courses"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900"
          >
            <ArrowLeft size={14} strokeWidth={2.5} /> Back to courses
          </Link>
          <h1 className="mt-3 text-2xl font-bold tracking-tight">Your wishlist</h1>
          <p className="mt-1 text-sm text-zinc-500">Courses you've saved for later.</p>
          <WishlistContainer />
        </div>
      </div>
    </div>
  );
}
