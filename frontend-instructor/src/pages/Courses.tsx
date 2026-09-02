import { Link } from "react-router-dom";
import { InstructorHeader } from "../components/InstructorHeader";
import { CourseManageContainer } from "../containers/CourseManage.container";

export default function Courses() {
  return (
    <div className="min-h-screen bg-[#f6f5f1]">
      <InstructorHeader />
      <div className="w-full px-4 py-6 sm:px-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-extrabold tracking-tight">Your courses</h1>
          <Link to="/courses/create" className="rounded-full bg-[#0f172a] px-4 py-2 text-sm font-semibold text-white">+ New course</Link>
        </div>
        <div className="mt-6">
          <CourseManageContainer />
        </div>
      </div>
    </div>
  );
}
