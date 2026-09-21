import { useEffect } from "react";
import { Award } from "@masterlms/shared";

type Props = {
  learnerName: string;
  courseTitle: string;
  enrolledLabel: string;
  issuedLabel: string;
  certificateId: string;
  onClose: () => void;
};

function GoldCorners() {
  const base = "pointer-events-none absolute h-10 w-10 border-amber-200/80";
  return (
    <>
      <span className={`${base} left-4 top-4 border-l-2 border-t-2`} />
      <span className={`${base} right-4 top-4 border-r-2 border-t-2`} />
      <span className={`${base} bottom-4 left-4 border-b-2 border-l-2`} />
      <span className={`${base} bottom-4 right-4 border-b-2 border-r-2`} />
    </>
  );
}

export function CertificateView(p: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") p.onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [p]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#060a18]/80 p-4 backdrop-blur-sm"
      onClick={p.onClose}
    >
      <div className="w-full max-w-[760px]" onClick={(e) => e.stopPropagation()}>
        <div className="overflow-hidden rounded-[24px] bg-[#0a1128] p-2 shadow-2xl ring-1 ring-amber-200/30">
          <div
            className="relative overflow-hidden rounded-[18px] border border-amber-200/40 bg-gradient-to-b from-[#101c44] via-[#0a1128] to-[#0a1128] px-6 py-8 text-center text-white sm:px-10"
            style={{
              backgroundImage:
                "radial-gradient(rgba(252,211,77,0.09) 1px, transparent 1px)",
              backgroundSize: "22px 22px",
            }}
          >
            <GoldCorners />
            <span className="pointer-events-none absolute -bottom-10 -right-4 select-none font-serif text-[180px] italic leading-none text-white/[0.04]">
              Q
            </span>

            <div className="relative flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 text-lg font-black text-[#0a1128] shadow-lg">
                  Q
                </span>
                <span className="text-left">
                  <span className="block text-sm font-black tracking-[0.18em]">QTNXT</span>
                  <span className="block text-[10px] font-semibold uppercase tracking-[0.28em] text-amber-200/90">
                    Academy
                  </span>
                </span>
              </div>
              <span className="rounded-full border border-amber-200/50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-amber-200">
                Certificate
              </span>
            </div>

            <p className="relative mt-7 text-[11px] font-semibold uppercase tracking-[0.32em] text-amber-200/90">
              Certificate of Completion
            </p>
            <p className="relative mt-3 text-xs uppercase tracking-[0.2em] text-white/50">
              This certifies that
            </p>
            <p className="relative mt-2 font-serif text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {p.learnerName}
            </p>
            <div className="relative mx-auto mt-4 flex max-w-[280px] items-center gap-2">
              <span className="h-px flex-1 bg-gradient-to-r from-transparent to-amber-300/80" />
              <span className="h-1.5 w-1.5 rotate-45 bg-amber-300" />
              <span className="h-px flex-1 bg-gradient-to-l from-transparent to-amber-300/80" />
            </div>
            <p className="relative mt-4 text-sm text-white/60">has successfully completed</p>
            <p className="relative mx-auto mt-1 max-w-[520px] text-xl font-extrabold leading-snug tracking-tight text-white sm:text-2xl">
              {p.courseTitle}
            </p>

            <div className="relative mx-auto mt-7 flex flex-col items-center gap-3">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 shadow-[0_0_36px_rgba(252,211,77,0.35)] ring-4 ring-amber-200/25">
                <Award size={26} strokeWidth={2.25} className="text-[#0a1128]" />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-200/90">
                Verified Graduate
              </span>
            </div>

            <div className="relative mt-7 grid grid-cols-2 gap-3 text-left sm:grid-cols-4">
              {[
                ["Enrolled on", p.enrolledLabel],
                ["Completed on", p.issuedLabel],
                ["Certificate ID", p.certificateId],
                ["Verify at", `qtnxt.com/verify/${p.certificateId}`],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">{label}</p>
                  <p className="mt-1 truncate font-mono text-[11px] font-semibold text-white/90" title={value}>
                    {value}
                  </p>
                </div>
              ))}
            </div>

            <div className="relative mt-7 flex items-end justify-between border-t border-white/10 pt-5 text-left">
              <div>
                <p className="font-serif text-lg italic text-white">QTNXT Academy</p>
                <p className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-white/40">
                  Official seal of completion
                </p>
              </div>
              <p className="text-right text-[10px] leading-relaxed text-white/40">
                Issued on {p.issuedLabel}
                <br />
                Lifetime validity
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-center gap-2 print:hidden">
          <button
            onClick={() => window.print()}
            className="rounded-full bg-amber-300 px-5 py-2 text-xs font-bold text-zinc-900 shadow-lg hover:bg-amber-200"
          >
            Print / Save PDF
          </button>
          <button
            onClick={p.onClose}
            className="rounded-full border border-white/25 px-5 py-2 text-xs font-semibold text-white hover:bg-white/10"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
