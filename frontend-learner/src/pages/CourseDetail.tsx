import { Link } from "react-router-dom";
import { ArrowLeft } from "@masterlms/shared";
import { TopNav } from "../components/TopNav";
import { CourseDetailContainer } from "../containers/CourseDetail.container";

export default function CourseDetail() {
  return (
    <div className="min-h-screen bg-[#f6f5f1]">
      <TopNav />
      <div className="w-full px-3 py-6 sm:px-4">
        <div className="rounded-[28px] bg-white p-6 shadow-sm sm:p-8">
          <Link to="/courses" className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900"><ArrowLeft size={14} strokeWidth={2.5} /> Back to courses</Link>
          <div className="mt-4">
            <CourseDetailContainer />
          </div>
        </div>
      </div>
    </div>
  );
}
