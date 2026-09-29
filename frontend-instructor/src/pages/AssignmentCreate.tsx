import { InstructorHeader } from "../components/InstructorHeader";
import { AssignmentCreateContainer } from "../containers/AssignmentCreate.container";
import { builderPageClass } from "../lib/builder";

export default function AssignmentCreate() {
  return (
    <div className="min-h-screen bg-[#f6f5f1]">
      <InstructorHeader />
      <div className={builderPageClass}>
        <AssignmentCreateContainer />
      </div>
    </div>
  );
}
