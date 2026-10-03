import { useQuery } from "@tanstack/react-query";
import { getAssignmentBoards } from "@masterlms/shared";
import { builderFieldClass, builderLabelClass } from "../lib/builder";

type Props = {
  /** Category id of the chosen exam board, or null when nothing is picked. */
  value: number | null;
  onChange: (value: number | null) => void;
  /** Shown under the select; used for the publish-blocking validation. */
  error?: string;
  label?: string;
};

/** Single "Exam board" select. The taxonomy is flat now — instructors pick a
 *  board (SSC, IBPS, UPSC, ...) and nothing deeper.
 */
export function ExamBoardPicker({ value, onChange, error, label = "Exam board" }: Props) {
  const boardsQuery = useQuery({
    queryKey: ["assignment-boards"],
    queryFn: getAssignmentBoards,
  });
  const boards = boardsQuery.data ?? [];

  return (
    <label className={builderLabelClass}>
      {label} <span className="text-halt">*</span>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
        className={builderFieldClass}
      >
        <option value="">Select a board…</option>
        {boards.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </select>
      {error && <p className="mt-1.5 text-xs text-halt">{error}</p>}
    </label>
  );
}
