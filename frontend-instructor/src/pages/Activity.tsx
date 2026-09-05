import { InstructorHeader } from "../components/InstructorHeader";
import { ActivityContainer } from "../containers/Activity.container";

export default function Activity() {
  return (
    <div className="min-h-screen bg-[#f6f5f1]">
      <InstructorHeader />
      <div className="w-full px-4 py-6 sm:px-6">
        <div className="rounded-[20px] bg-white p-6 shadow-sm sm:p-8">
          <ActivityContainer />
        </div>
      </div>
    </div>
  );
}
