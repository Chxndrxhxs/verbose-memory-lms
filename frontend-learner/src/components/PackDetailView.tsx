import { Link } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  FileText,
  HelpCircle,
  Lock,
  type ExamModule,
  type PackDetail,
} from "@masterlms/shared";
import { TopNav } from "./TopNav";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { Panel } from "./Panel";

type Props = {
  pack: PackDetail | undefined;
  isLoading: boolean;
  error: Error | null;
  selectedModule: ExamModule;
  onSelectModule: (module: ExamModule) => void;
  onClaim: () => void;
  onBuy: () => void;
  onStart: () => void;
  claiming: boolean;
  buying: boolean;
  starting: boolean;
  needsPurchase: boolean;
  toast: string | null;
};

export function PackDetailView({
  pack,
  isLoading,
  error,
  selectedModule,
  onSelectModule,
  onClaim,
  onBuy,
  onStart,
  claiming,
  buying,
  starting,
  needsPurchase,
  toast,
}: Props) {
  return (
    <div className="min-h-screen bg-room">
      <TopNav />
      <div className="mx-auto w-full max-w-3xl px-4 pb-12 pt-6 sm:px-6 sm:pt-8">
        {isLoading && (
          <Panel className="p-10 text-sm text-ink-muted">Loading package…</Panel>
        )}
        {error && (
          <Panel className="p-10 text-sm text-halt">{error.message}</Panel>
        )}
        {pack && (
          <div>
            <Panel className="p-8 sm:p-10">
              <Link
                to="/assignments"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-muted transition-colors hover:text-ink"
              >
                <ArrowLeft size={14} strokeWidth={2.5} aria-hidden /> All tests
              </Link>

              {pack.inter_category && (
                <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                  {[pack.inter_category.category.name, pack.inter_category.sub_category.name, pack.inter_category.name]
                    .filter(Boolean)
                    .join(" → ")}
                </p>
              )}
              <div className="mt-1 flex flex-wrap items-start justify-between gap-3">
                <h1 className="text-2xl font-semibold text-ink">{pack.title}</h1>
                {pack.is_free ? (
                  <Badge tone="live" showIcon={false} className="px-4 py-1.5 text-sm">Free</Badge>
                ) : (
                  <span className="tnum flex items-center gap-2">
                    {Number(pack.original_price) > Number(pack.price) && (
                      <span className="text-sm text-ink-faint line-through">
                        ₹{Number(pack.original_price).toLocaleString("en-IN")}
                      </span>
                    )}
                    <span className="tnum border border-ink bg-ink px-4 py-1.5 text-sm font-semibold text-ink-inverse">
                      ₹{Number(pack.price).toLocaleString("en-IN")}
                    </span>
                  </span>
                )}
              </div>
              {pack.description && (
                <p className="measure mt-2 font-serif text-sm leading-relaxed text-ink-muted">{pack.description}</p>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Badge tone="muted" showIcon={false} className="tnum">
                  <HelpCircle size={11} aria-hidden /> {pack.question_count} questions
                </Badge>
                <Badge tone="muted" showIcon={false} className="tnum">
                  <FileText size={11} aria-hidden /> {pack.total_marks} marks
                </Badge>
                {pack.max_attempts > 0 && (
                  <Badge tone="muted" showIcon={false} className="tnum">
                    <Clock size={11} aria-hidden />{" "}
                    {pack.attempts_left != null
                      ? `${pack.attempts_left} of ${pack.max_attempts} attempts left`
                      : `${pack.max_attempts} attempts`}
                  </Badge>
                )}
                {pack.owner_name && (
                  <Badge tone="muted" showIcon={false}>
                    by {pack.owner_name}
                  </Badge>
                )}
              </div>

              {pack.topics.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {pack.topics.map(([topic, count]) => (
                    <Badge
                      key={topic}
                      tone="muted"
                      showIcon={false}
                      className="tnum"
                    >
                      {topic} · {count}
                    </Badge>
                  ))}
                </div>
              )}
            </Panel>

            <h2 className="mt-8 px-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
              Choose a module
            </h2>
            <div className="mt-3 grid gap-3">
              {pack.modules.map((module) => {
                const active = selectedModule === module.code;
                return (
                  <button
                    key={module.code}
                    type="button"
                    aria-pressed={active}
                    onClick={() => onSelectModule(module.code)}
                    className={`flex w-full flex-wrap items-center justify-between gap-3 border bg-room-raised p-6 text-left transition-colors ${
                      active ? "border-ink bg-room-sunk" : "border-rule hover:border-rule-strong"
                    }`}
                  >
                    <div>
                      <p className="flex items-center gap-2 text-base font-semibold text-ink">
                        {module.label}
                        {active && <CheckCircle2 size={16} className="text-live" aria-hidden />}
                      </p>
                      <p className="mt-1 text-xs text-ink-muted">
                        {module.untimed
                          ? "Untimed · inline explanations"
                          : "Timed · proctored exam conditions"}
                      </p>
                    </div>
                    <Badge
                      tone={module.proctored ? "hold" : "live"}
                      showIcon={false}
                    >
                      <Lock size={11} aria-hidden /> {module.proctored ? "Proctored" : "No proctoring"}
                    </Badge>
                  </button>
                );
              })}
            </div>

            <Panel className="mt-6 p-6">
              {pack.owned ? (
                <Button
                  variant="primary"
                  size="lg"
                  block
                  onClick={onStart}
                  disabled={starting || (pack.attempts_left != null && pack.attempts_left <= 0)}
                >
                  {starting
                    ? "Starting…"
                    : pack.attempts_left != null && pack.attempts_left <= 0
                      ? "No attempts left"
                      : "Start now"}
                </Button>
              ) : pack.is_free ? (
                <Button variant="primary" size="lg" block onClick={onClaim} disabled={claiming}>
                  {claiming ? "Claiming…" : "Get for free"}
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="lg"
                  block
                  onClick={onBuy}
                  disabled={buying}
                  className="tnum"
                >
                  {buying
                    ? "Processing…"
                    : needsPurchase
                      ? `Buy to start · ₹${Number(pack.price).toLocaleString("en-IN")}`
                      : `Buy now · ₹${Number(pack.price).toLocaleString("en-IN")}`}
                </Button>
              )}
              {!pack.owned && !pack.is_free && (
                <p className="mt-2 text-center text-[11px] text-ink-muted">
                  One-time purchase · attempts shared across all modules
                </p>
              )}
            </Panel>
          </div>
        )}
      </div>

      {toast && (
        <div role="status" className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 border border-ink bg-ink px-5 py-2.5 text-sm text-ink-inverse shadow-xl">
          {toast}
        </div>
      )}
    </div>
  );
}
