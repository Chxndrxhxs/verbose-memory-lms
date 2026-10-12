import { InstructorHeader } from "../components/InstructorHeader";
import { CouponFormContainer } from "../containers/CouponForm.container";
import { PageShell } from "../components/Panel";

export default function CouponNew() {
  return (
    <div className="min-h-screen bg-slate-ground">
      <InstructorHeader />
      <PageShell>
        <CouponFormContainer />
      </PageShell>
    </div>
  );
}
