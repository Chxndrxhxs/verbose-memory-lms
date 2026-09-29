import { Link } from "react-router-dom";
import { InstructorHeader } from "../components/InstructorHeader";
import { AssignmentListContainer } from "../containers/AssignmentList.container";

export default function Assignments() {
  return (
    <div className="min-h-screen bg-[#f6f5f1]">
      <InstructorHeader />
      <div className="w-full px-4 py-6 sm:px-6">
        <div className="rounded-[20px] bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold">Assignments</h1>
              <p className="text-sm text-zinc-500">
                Create, manage, and publish assessments for your students.
              </p>
            </div>
            <Link
              to="/packs"
              className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
            >
              Question packs →
            </Link>
          </div>
          <div className="mt-6">
            <AssignmentListContainer />
          </div>
        </div>
      </div>
    </div>
  );
}
