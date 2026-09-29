import { useParams } from "react-router-dom";
import { InstructorHeader } from "../components/InstructorHeader";
import { PackBuilderContainer } from "../containers/PackBuilder.container";
import { builderPageClass } from "../lib/builder";

export default function PackEdit() {
  const { id } = useParams<{ id: string }>();
  return (
    <div className="min-h-screen bg-[#f6f5f1]">
      <InstructorHeader />
      <div className={builderPageClass}>
        <PackBuilderContainer existingId={id} />
      </div>
    </div>
  );
}
