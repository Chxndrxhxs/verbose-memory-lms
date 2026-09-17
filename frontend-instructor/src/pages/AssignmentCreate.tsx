import { InstructorHeader } from "../components/InstructorHeader";
import { AssignmentCreateContainer } from "../containers/AssignmentCreate.container";

export default function AssignmentCreate() {
  return (
    <div className="min-h-screen bg-[#f6f5f1]">
      <InstructorHeader />
      <div className="w-full px-4 py-6 sm:px-6">
        <div className="rounded-[20px] bg-white p-6 shadow-sm">
          <h1 className="text-xl font-bold">Create Assignment</h1>
          <p className="text-sm text-zinc-500">
            Set up a new assessment with AI-powered question generation.
          </p>
          <div className="mt-4">
            <AssignmentCreateContainer />
          </div>
        </div>
      </div>
    </div>
  );
}
