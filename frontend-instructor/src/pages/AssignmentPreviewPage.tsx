import { useParams } from "react-router-dom";
import { InstructorHeader } from "../components/InstructorHeader";
import { useAssignment } from "../hooks/useAssignments";
import { AssignmentPreviewStep } from "../components/AssignmentPreview";
import { createEmptyAssignment } from "../types/assignment";

export default function AssignmentPreviewPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useAssignment(id || "");
  const assignment = data ?? createEmptyAssignment();

  return (
    <div className="min-h-screen bg-[#f6f5f1]">
      <InstructorHeader />
      <div className="w-full px-4 py-6 sm:px-6">
        <div className="rounded-[20px] bg-white p-6 shadow-sm">
          <h1 className="text-xl font-bold">Assignment Preview</h1>
          <p className="text-sm text-zinc-500">
            See how this assignment appears to students.
          </p>
          <div className="mt-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-20 text-sm text-zinc-500">
                Loading…
              </div>
            ) : (
              <AssignmentPreviewStep assignment={assignment} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
