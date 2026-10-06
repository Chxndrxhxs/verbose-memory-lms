import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Clock, HelpCircle } from "@masterlms/shared";
import {
  type AssignmentCatalogItem,
  type ExamBoard,
  type PackListItem,
} from "@masterlms/shared";
import { cn } from "../lib/utils";
import { TopNav } from "./TopNav";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { Select } from "./Controls";
import { PageShell } from "./Panel";

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

const backLink = cn(
  "inline-flex items-center gap-1.5 text-xs font-semibold",
  "text-ink-muted hover:text-ink transition-colors",
);

const rowCard = cn(
  "group flex items-center gap-4 border border-rule bg-room-raised p-4",
  "transition-colors hover:border-rule-strong hover:bg-room-sunk",
);

function SkeletonCard() {
  return (
    <div className="flex animate-pulse items-center gap-4 border border-rule bg-room-raised p-4">
      <div className="min-w-0 flex-1 space-y-2">
        <div className="h-4 w-2/3 bg-room-sunk" />
        <div className="h-3 w-1/3 bg-room-sunk" />
      </div>
      <div className="h-8 w-20 shrink-0 bg-room-sunk" />
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
    <div className="min-h-screen bg-room">
      <TopNav />
      <PageShell>
          <Link to="/" className={backLink}>
            <ArrowLeft size={14} strokeWidth={2.5} aria-hidden /> Back to home
          </Link>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h1 className="text-2xl font-semibold text-ink">Tests</h1>
              <p className="tnum mt-1 text-sm text-ink-muted">
                {myTests === 0
                  ? "Pick a subject to find something to take."
                  : `${myTests} test${myTests === 1 ? "" : "s"} ready for you.`}
              </p>
            </div>
            {filtered && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onReset}
              >
                Clear filters
              </Button>
            )}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <label className="min-w-52 flex-1 text-xs font-semibold text-ink-muted">
              Exam board
              <Select
                value={boardId ?? ""}
                onChange={(e) =>
                  e.target.value ? onSelectBoard(Number(e.target.value)) : onReset()
                }
                className="mt-1 w-full"
              >
                <option value="">All boards</option>
                {boards.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </Select>
            </label>
          </div>

          <h2 className="mt-8 text-sm font-semibold text-ink">
            My tests{" "}
            <span className="tnum font-normal text-ink-faint">
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
            <p role="alert" className="mt-4 text-sm text-halt">
              Unable to load tests: {error.message}
            </p>
          )}
          {!isLoading && !error && myTests === 0 && (
            <p
              className={cn(
                "mt-4 border border-dashed border-rule-strong p-8",
                "text-center text-sm text-ink-muted",
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
                    <p className="truncate text-sm font-semibold text-ink group-hover:underline">
                      {assignment.title}
                    </p>
                    <p
                      className={cn(
                        "tnum mt-1 flex flex-wrap items-center gap-x-3 gap-y-1",
                        "text-xs text-ink-muted",
                      )}
                    >
                      <span className="inline-flex items-center gap-1">
                        <HelpCircle size={12} aria-hidden /> {assignment.questions_count}{" "}
                        questions
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock size={12} aria-hidden /> {assignment.duration_label}
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
                      "inline-flex shrink-0 items-center gap-1 border border-ink bg-ink",
                      "px-3 py-1.5 text-xs font-semibold text-ink-inverse",
                    )}
                  >
                    Start <ArrowRight size={13} aria-hidden />
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
                    <p className="truncate text-sm font-semibold text-ink group-hover:underline">
                      {pack.title}
                    </p>
                    <p className="tnum mt-1 text-xs text-ink-muted">
                      {pack.question_count} questions
                      {pack.attempts_left != null &&
                        ` · ${pack.attempts_left} attempts left`}
                    </p>
                  </div>
                  <Badge tone="live" showIcon={false}>Owned</Badge>
                </Link>
              ))}
            </div>
          )}

          {!isLoading && !error && packsForSale.length > 0 && (
            <div className="mt-10">
              <h2 className="text-sm font-semibold text-ink">
                Test packages{" "}
                <span className="tnum font-normal text-ink-faint">
                  · {packsForSale.length}
                </span>
              </h2>
              <p className="mt-1 text-xs text-ink-muted">
                Curated question bundles — buy once, take in any enabled module.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {packsForSale.map((pack) => (
                  <Link
                    key={pack.id}
                    to={`/packs/${pack.id}`}
                    className={cn(
                      "flex items-center gap-4 border border-rule bg-room-sunk p-4",
                      "transition-colors hover:border-rule-strong hover:bg-room-raised",
                    )}
                  >
                    {pack.cover ? (
                      <img
                        src={pack.cover}
                        alt=""
                        className={cn(
                          "h-14 w-11 shrink-0 border border-rule",
                          "object-cover",
                        )}
                      />
                    ) : null}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">{pack.title}</p>
                      <p className="tnum mt-1 text-xs text-ink-muted">
                        {pack.question_count} questions ·{" "}
                        {pack.allowed_modules.length}{" "}
                        {pack.allowed_modules.length === 1 ? "module" : "modules"}
                      </p>
                    </div>
                    {pack.is_free ? (
                      <Badge tone="live" showIcon={false}>Free</Badge>
                    ) : (
                      <span
                        className={cn(
                          "tnum shrink-0 border border-ink bg-ink px-3 py-1",
                          "text-xs font-semibold text-ink-inverse",
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
      </PageShell>
    </div>
  );
}
