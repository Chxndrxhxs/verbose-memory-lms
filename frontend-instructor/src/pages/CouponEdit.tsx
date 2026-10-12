import { useParams } from "react-router-dom";
import { InstructorHeader } from "../components/InstructorHeader";
import { CouponFormContainer } from "../containers/CouponForm.container";
import { PageShell } from "../components/Panel";

export default function CouponEdit() {
  const { id } = useParams<{ id: string }>();
  return (
    <div className="min-h-screen bg-slate-ground">
      <InstructorHeader />
      <PageShell>
        <CouponFormContainer existingId={id ?? ""} />
      </PageShell>
    </div>
  );
}
