import { InstructorHeader } from "../components/InstructorHeader";
import { CouponListContainer } from "../containers/CouponList.container";
import { PageShell } from "../components/Panel";

export default function Coupons() {
  return (
    <div className="min-h-screen bg-slate-ground">
      <InstructorHeader />
      <PageShell wide>
        <CouponListContainer />
      </PageShell>
    </div>
  );
}
