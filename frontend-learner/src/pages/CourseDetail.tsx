import { Link } from "react-router-dom";
import { ArrowLeft } from "@masterlms/shared";
import { TopNav } from "../components/TopNav";
import { CourseDetailContainer } from "../containers/CourseDetail.container";
import { PageShell } from "../components/Panel";

export default function CourseDetail() {
  return (
    <div className="min-h-screen bg-room">
      <TopNav />
      <PageShell>
        <Link to="/courses" className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-muted transition-colors hover:text-ink"><ArrowLeft size={14} strokeWidth={2.5} aria-hidden /> Back to courses</Link>
        <div className="mt-4 border border-rule bg-room-raised p-6 sm:p-8">
          <CourseDetailContainer />
        </div>
      </PageShell>
    </div>
  );
}
