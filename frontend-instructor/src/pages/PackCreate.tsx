import { InstructorHeader } from "../components/InstructorHeader";
import { PackBuilderContainer } from "../containers/PackBuilder.container";
import { builderPageClass } from "../lib/builder";

export default function PackCreate() {
  return (
    <div className="min-h-screen bg-[#f6f5f1]">
      <InstructorHeader />
      <div className={builderPageClass}>
        <PackBuilderContainer />
      </div>
    </div>
  );
}
