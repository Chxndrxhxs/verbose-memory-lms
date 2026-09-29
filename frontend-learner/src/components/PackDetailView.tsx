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
    <div className="min-h-screen bg-[#f6f5f1]">
      <TopNav />
      <div className="w-full px-3 py-6 sm:px-4">
        {isLoading && (
          <div className="rounded-[28px] bg-white p-10 text-sm text-zinc-500">Loading package…</div>
        )}
        {error && (
          <div className="rounded-[28px] bg-white p-10 text-sm text-red-600">{error.message}</div>
        )}
        {pack && (
          <div className="mx-auto max-w-3xl">
            <div className="rounded-[28px] bg-white p-8 shadow-sm sm:p-10">
              <Link
                to="/assignments"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900"
              >
                <ArrowLeft size={14} strokeWidth={2.5} /> All tests
              </Link>

              {pack.inter_category && (
                <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  {[pack.inter_category.category.name, pack.inter_category.sub_category.name, pack.inter_category.name]
                    .filter(Boolean)
                    .join(" → ")}
                </p>
              )}
              <div className="mt-1 flex flex-wrap items-start justify-between gap-3">
                <h1 className="text-2xl font-bold tracking-tight">{pack.title}</h1>
                {pack.is_free ? (
                  <span className="rounded-full bg-emerald-100 px-4 py-1.5 text-sm font-bold text-emerald-800">
                    Free
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    {Number(pack.original_price) > Number(pack.price) && (
                      <span className="text-sm text-zinc-400 line-through">
                        ₹{Number(pack.original_price).toLocaleString("en-IN")}
                      </span>
                    )}
                    <span className="rounded-full bg-[#0f172a] px-4 py-1.5 text-sm font-bold text-white">
                      ₹{Number(pack.price).toLocaleString("en-IN")}
                    </span>
                  </span>
                )}
              </div>
              {pack.description && (
                <p className="mt-2 text-sm leading-relaxed text-zinc-500">{pack.description}</p>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-zinc-600">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1">
                  <HelpCircle size={13} /> {pack.question_count} questions
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1">
                  <FileText size={13} /> {pack.total_marks} marks
                </span>
                {pack.max_attempts > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1">
                    <Clock size={13} />{" "}
                    {pack.attempts_left != null
                      ? `${pack.attempts_left} of ${pack.max_attempts} attempts left`
                      : `${pack.max_attempts} attempts`}
                  </span>
                )}
                {pack.owner_name && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1">
                    by {pack.owner_name}
                  </span>
                )}
              </div>

              {pack.topics.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {pack.topics.map(([topic, count]) => (
                    <span
                      key={topic}
                      className="rounded-full border border-zinc-200 px-2.5 py-1 text-[11px] font-medium text-zinc-600"
                    >
                      {topic} · {count}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <h2 className="mt-8 px-2 text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Choose a module
            </h2>
            <div className="mt-3 grid gap-3">
              {pack.modules.map((module) => {
                const active = selectedModule === module.code;
                return (
                  <button
                    key={module.code}
                    onClick={() => onSelectModule(module.code)}
                    className={`flex flex-wrap items-center justify-between gap-3 rounded-[24px] border bg-white p-6 text-left transition ${
                      active ? "border-zinc-900 shadow-sm" : "hover:border-zinc-300"
                    }`}
                  >
                    <div>
                      <p className="flex items-center gap-2 text-base font-bold">
                        {module.label}
                        {active && <CheckCircle2 size={16} className="text-emerald-600" />}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {module.untimed
                          ? "Untimed · inline explanations"
                          : "Timed · proctored exam conditions"}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                        module.proctored
                          ? "bg-amber-100 text-amber-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      <Lock size={11} /> {module.proctored ? "Proctored" : "No proctoring"}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 rounded-[24px] bg-white p-6 shadow-sm">
              {pack.owned ? (
                <button
                  onClick={onStart}
                  disabled={starting || (pack.attempts_left != null && pack.attempts_left <= 0)}
                  className="w-full rounded-full bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                >
                  {starting
                    ? "Starting…"
                    : pack.attempts_left != null && pack.attempts_left <= 0
                      ? "No attempts left"
                      : "Start now"}
                </button>
              ) : pack.is_free ? (
                <button
                  onClick={onClaim}
                  disabled={claiming}
                  className="w-full rounded-full bg-[#0f172a] px-5 py-3 text-sm font-bold text-white transition hover:bg-black disabled:opacity-60"
                >
                  {claiming ? "Claiming…" : "Get for free"}
                </button>
              ) : (
                <button
                  onClick={onBuy}
                  disabled={buying}
                  className={`w-full rounded-full px-5 py-3 text-sm font-bold text-white transition disabled:opacity-60 ${
                    needsPurchase ? "bg-amber-600 hover:bg-amber-700" : "bg-[#0f172a] hover:bg-black"
                  }`}
                >
                  {buying
                    ? "Processing…"
                    : needsPurchase
                      ? `Buy to start · ₹${Number(pack.price).toLocaleString("en-IN")}`
                      : `Buy now · ₹${Number(pack.price).toLocaleString("en-IN")}`}
                </button>
              )}
              {!pack.owned && !pack.is_free && (
                <p className="mt-2 text-center text-[11px] text-zinc-500">
                  One-time purchase · attempts shared across all modules
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-zinc-900 px-5 py-2.5 text-sm text-white shadow-xl">
          {toast}
        </div>
      )}
    </div>
  );
}
