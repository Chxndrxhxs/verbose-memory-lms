import { useParams } from "react-router-dom";
import { InstructorHeader } from "../components/InstructorHeader";
import { useAssignment } from "../hooks/useAssignments";
import { AssignmentPreviewStep } from "../components/AssignmentPreview";
import { createEmptyAssignment } from "../types/assignment";
import { PageShell, PageHeader } from "../components/Panel";

export default function AssignmentPreviewPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useAssignment(id || "");
  const assignment = data ?? createEmptyAssignment();

  return (
    <div className="min-h-screen bg-slate-ground">
      <InstructorHeader />
      <PageShell>
        <div className="space-y-6">
          <PageHeader
            eyebrow="Student view"
            title="Assignment preview"
            description="This is exactly what a learner sees when they sit the assignment."
          />
          {isLoading ? (
            <p className="py-20 text-center text-sm text-ink-muted">Loading the assignment…</p>
          ) : (
            <AssignmentPreviewStep assignment={assignment} />
          )}
        </div>
      </PageShell>
    </div>
  );
}