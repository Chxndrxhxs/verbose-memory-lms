import { Link } from "react-router-dom";
import { ArrowLeft } from "@masterlms/shared";
import { TopNav } from "../components/TopNav";
import { CourseListContainer } from "../containers/CourseList.container";
import { PageShell } from "../components/Panel";

export default function Courses() {
  return (
    <div className="min-h-screen bg-room">
      <TopNav />
      <PageShell>
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-muted transition-colors hover:text-ink"><ArrowLeft size={14} strokeWidth={2.5} aria-hidden /> Back to home</Link>
        <h1 className="mt-3 text-2xl font-semibold text-ink">All courses</h1>
        <p className="mt-1 text-sm text-ink-muted">Browse our curated catalog.</p>
        <div className="mt-8">
          <CourseListContainer />
        </div>
      </PageShell>
    </div>
  );
}
