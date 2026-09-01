import { Link } from "react-router-dom";
import { InstructorHeader } from "../components/InstructorHeader";
import { CourseManageContainer } from "../containers/CourseManage.container";

export default function Courses() {
  return (
    <div className="min-h-screen bg-[#f6f5f1]">
      <InstructorHeader />
      <div className="mx-auto max-w-[1080px] px-3 py-6 sm:px-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-extrabold tracking-tight">Your courses</h1>
          <Link to="/courses/new" className="rounded-full bg-[#0f172a] px-4 py-2 text-sm font-semibold text-white">+ New course</Link>
        </div>
        <div className="mt-6 rounded-[20px] bg-white p-6 shadow-sm">
          <CourseManageContainer />
        </div>
      </div>
    </div>
  );
}
