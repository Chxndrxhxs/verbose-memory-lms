import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Clock, HelpCircle } from "@masterlms/shared";
import {
  type AssignmentCatalogItem,
  type ExamBoard,
  type PackListItem,
} from "@masterlms/shared";
import { cn } from "../lib/utils";
import { TopNav } from "./TopNav";

type Props = {
  boards: ExamBoard[];
  assignments: AssignmentCatalogItem[];
  ownedPacks: PackListItem[];
  packsForSale: PackListItem[];
  isLoading: boolean;
  error: Error | null;
  boardId: number | null;
  onSelectBoard: (id: number) => void;
  onReset: () => void;
};

const selectClass = cn(
  "rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none",
  "focus:border-zinc-900 disabled:opacity-40",
);

const backLink = cn(
  "inline-flex items-center gap-1.5 text-xs font-semibold",
  "text-zinc-500 hover:text-zinc-900",
);

const rowCard = cn(
  "group flex items-center gap-4 rounded-2xl border bg-white p-4",
  "transition hover:border-zinc-400 hover:shadow-sm",
);

function SkeletonCard() {
  return (
    <div className="flex animate-pulse items-center gap-4 rounded-2xl border bg-white p-4">
      <div className="min-w-0 flex-1 space-y-2">
        <div className="h-4 w-2/3 rounded bg-zinc-100" />
        <div className="h-3 w-1/3 rounded bg-zinc-100" />
      </div>
      <div className="h-8 w-20 shrink-0 rounded-full bg-zinc-100" />
    </div>
  );
}

export function AssignmentCatalog({
  boards,
  assignments,
  ownedPacks,
  packsForSale,
  isLoading,
  error,
  boardId,
  onSelectBoard,
  onReset,
}: Props) {
  const filtered = boardId !== null;
  const myTests = assignments.length + ownedPacks.length;

  return (
    <div className="min-h-screen bg-[#f6f5f1]">
      <TopNav />
      <div className="w-full px-3 py-6 sm:px-4">
        <div className="rounded-[28px] bg-white p-8 shadow-sm sm:p-10">
          <Link to="/" className={backLink}>
            <ArrowLeft size={14} strokeWidth={2.5} /> Back to home
          </Link>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Tests</h1>
              <p className="mt-1 text-sm text-zinc-500">
                {myTests === 0
                  ? "Pick a subject to find something to take."
                  : `${myTests} test${myTests === 1 ? "" : "s"} ready for you.`}
              </p>
            </div>
            {filtered && (
              <button
                onClick={onReset}
                className={cn(
                  "rounded-full bg-zinc-100 px-3.5 py-1.5 text-xs font-semibold",
                  "text-zinc-600 hover:bg-zinc-200",
                )}
              >
                Clear filters
              </button>
            )}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <label className="min-w-52 flex-1 text-xs font-semibold text-zinc-500">
              Exam board
              <select
                value={boardId ?? ""}
                onChange={(e) =>
                  e.target.value ? onSelectBoard(Number(e.target.value)) : onReset()
                }
                className={cn(selectClass, "mt-1 w-full")}
              >
                <option value="">All boards</option>
                {boards.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <h2 className="mt-8 text-sm font-bold">
            My tests{" "}
            <span className="font-normal text-zinc-400">
              · {assignments.length + ownedPacks.length}
            </span>
          </h2>

          {isLoading && (
            <div className="mt-4 grid gap-3">
              {[0, 1, 2].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          )}
          {error && (
            <p className="mt-4 text-sm text-red-600">
              Unable to load tests: {error.message}
            </p>
          )}
          {!isLoading && !error && myTests === 0 && (
            <p
              className={cn(
                "mt-4 rounded-2xl border border-dashed border-zinc-300 p-8",
                "text-center text-sm text-zinc-500",
              )}
            >
              Nothing here yet
              {filtered ? " for these filters — try clearing them." : "."}
            </p>
          )}
          {!isLoading && !error && myTests > 0 && (
            <div className="mt-4 grid gap-3">
              {assignments.map((assignment) => (
                <Link
                  key={`a-${assignment.id}`}
                  to={`/assignments/${assignment.id}`}
                  className={rowCard}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold group-hover:underline">
                      {assignment.title}
                    </p>
                    <p
                      className={cn(
                        "mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5",
                        "text-xs text-zinc-500",
                      )}
                    >
                      <span className="inline-flex items-center gap-1">
                        <HelpCircle size={12} /> {assignment.questions_count}{" "}
                        questions
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock size={12} /> {assignment.duration_label}
                      </span>
                      {assignment.models_preview.length > 0 && (
                        <span>
                          {assignment.models_preview.map((m) => m.name).join(" · ")}
                        </span>
                      )}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "inline-flex shrink-0 items-center gap-1 rounded-full",
                      "bg-zinc-900 px-3.5 py-1.5 text-xs font-semibold text-white",
                    )}
                  >
                    Start <ArrowRight size={13} />
                  </span>
                </Link>
              ))}
              {ownedPacks.map((pack) => (
                <Link
                  key={`p-${pack.id}`}
                  to={`/packs/${pack.id}`}
                  className={rowCard}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold group-hover:underline">
                      {pack.title}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {pack.question_count} questions
                      {pack.attempts_left != null &&
                        ` · ${pack.attempts_left} attempts left`}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full bg-emerald-100 px-3 py-1.5",
                      "text-xs font-bold text-emerald-800",
                    )}
                  >
                    Owned
                  </span>
                </Link>
              ))}
            </div>
          )}

          {!isLoading && !error && packsForSale.length > 0 && (
            <div className="mt-10">
              <h2 className="text-sm font-bold">
                Test packages{" "}
                <span className="font-normal text-zinc-400">
                  · {packsForSale.length}
                </span>
              </h2>
              <p className="mt-1 text-xs text-zinc-500">
                Curated question bundles — buy once, take in any enabled module.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {packsForSale.map((pack) => (
                  <Link
                    key={pack.id}
                    to={`/packs/${pack.id}`}
                    className={cn(
                      "flex items-center gap-4 rounded-2xl border bg-[#fbfaf7] p-4",
                      "transition hover:border-zinc-400 hover:shadow-sm",
                    )}
                  >
                    {pack.cover ? (
                      <img
                        src={pack.cover}
                        alt=""
                        className={cn(
                          "h-14 w-11 shrink-0 rounded-lg border border-zinc-200",
                          "object-cover",
                        )}
                      />
                    ) : null}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{pack.title}</p>
                      <p className="mt-0.5 text-xs text-zinc-500">
                        {pack.question_count} questions ·{" "}
                        {pack.allowed_modules.length}{" "}
                        {pack.allowed_modules.length === 1 ? "module" : "modules"}
                      </p>
                    </div>
                    {pack.is_free ? (
                      <span
                        className={cn(
                          "shrink-0 rounded-full bg-emerald-100 px-3 py-1",
                          "text-xs font-bold text-emerald-800",
                        )}
                      >
                        Free
                      </span>
                    ) : (
                      <span
                        className={cn(
                          "shrink-0 rounded-full bg-[#0f172a] px-3 py-1",
                          "text-xs font-bold text-white",
                        )}
                      >
                        ₹{Number(pack.price).toLocaleString("en-IN")}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
