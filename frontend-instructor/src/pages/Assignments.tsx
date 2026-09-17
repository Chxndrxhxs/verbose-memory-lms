import { InstructorHeader } from "../components/InstructorHeader";
import { AssignmentListContainer } from "../containers/AssignmentList.container";

export default function Assignments() {
  return (
    <div className="min-h-screen bg-[#f6f5f1]">
      <InstructorHeader />
      <div className="w-full px-4 py-6 sm:px-6">
        <div className="rounded-[20px] bg-white p-6 shadow-sm">
          <h1 className="text-xl font-bold">Assignments</h1>
          <p className="text-sm text-zinc-500">
            Create, manage, and publish assessments for your students.
          </p>
          <div className="mt-6">
            <AssignmentListContainer />
          </div>
        </div>
      </div>
    </div>
  );
}
