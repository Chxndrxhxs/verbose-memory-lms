import { useEffect, useState } from "react";
import { Award, LinkIcon, Check } from "@masterlms/shared";
import { Button } from "./Button";

type Props = {
  learnerName: string;
  courseTitle: string;
  enrolledLabel: string;
  issuedLabel: string;
  certificateId: string;
  onClose: () => void;
  /** Render the sheet inline (the public /certificates/:id page)
   *  instead of as a modal overlay. */
  standalone?: boolean;
};

function GoldCorners() {
  const base = "pointer-events-none absolute h-10 w-10 border-gold/35";
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
  const [copied, setCopied] = useState(false);
  const shareUrl = `${window.location.origin}/certificates/${p.certificateId}`;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") p.onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [p]);

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      className={
        p.standalone
          ? undefined
          : "fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-4 backdrop-blur-sm print:static print:bg-transparent print:p-0"
      }
      onClick={p.standalone ? undefined : p.onClose}
    >
      <div
        className="w-full max-w-[760px] print:max-w-none"
        onClick={p.standalone ? undefined : (e) => e.stopPropagation()}
      >
        <div className="overflow-hidden border border-gold-deep/40 bg-room-deep p-2 shadow-2xl print:shadow-none">
          <div
            className="cert-sheet relative overflow-hidden border border-gold/35 bg-room-deep px-6 py-8 text-center text-ink-inverse sm:px-10"
            style={{
              backgroundImage:
                "radial-gradient(rgba(252,211,77,0.09) 1px, transparent 1px)",
              backgroundSize: "22px 22px",
            }}
          >
            <GoldCorners />
            <span className="pointer-events-none absolute -bottom-10 -right-4 select-none font-serif text-[180px] italic leading-none text-ink-inverse/[0.04]">
              Q
            </span>

            <div className="relative flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gold text-lg font-semibold text-ink">
                  Q
                </span>
                <span className="text-left">
                  <span className="block text-sm font-semibold tracking-[0.18em]">QTNXT</span>
                  <span className="block text-[10px] font-semibold uppercase tracking-[0.28em] text-gold/90">
                    Academy
                  </span>
                </span>
              </div>
              <span className="border border-gold/45 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-gold">
                Certificate
              </span>
            </div>

            <p className="relative mt-7 text-[11px] font-semibold uppercase tracking-[0.32em] text-gold/90">
              Certificate of Completion
            </p>
            <p className="relative mt-3 text-xs uppercase tracking-[0.2em] text-ink-inverse/50">
              This certifies that
            </p>
            <p className="relative mt-2 font-serif text-3xl font-semibold text-ink-inverse sm:text-4xl">
              {p.learnerName}
            </p>
            <div className="relative mx-auto mt-4 flex max-w-[280px] items-center gap-2">
              <span className="h-px flex-1 bg-gradient-to-r from-transparent to-gold/80" />
              <span className="h-1.5 w-1.5 rotate-45 bg-gold" />
              <span className="h-px flex-1 bg-gradient-to-l from-transparent to-gold/80" />
            </div>
            <p className="relative mt-4 text-sm text-ink-inverse/60">has successfully completed</p>
            <p className="relative mx-auto mt-1 max-w-[520px] text-xl font-semibold leading-snug text-ink-inverse sm:text-2xl">
              {p.courseTitle}
            </p>

            <div className="relative mx-auto mt-7 flex flex-col items-center gap-3">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gold">
                <Award size={26} strokeWidth={2.25} className="text-ink" aria-hidden />
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-gold/90">
                Verified Graduate
              </span>
            </div>

            <div className="relative mt-7 grid grid-cols-2 gap-3 text-left sm:grid-cols-4">
              {[
                ["Enrolled on", p.enrolledLabel],
                ["Completed on", p.issuedLabel],
                ["Certificate ID", p.certificateId],
                ["Verify at", shareUrl],
              ].map(([label, value]) => (
                <div key={label} className="border border-ink-inverse/10 bg-ink-inverse/5 px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-inverse/45">{label}</p>
                  <p className="mt-1 truncate font-mono text-[11px] font-semibold text-ink-inverse/90" title={value}>
                    {value}
                  </p>
                </div>
              ))}
            </div>

            <div className="relative mt-7 flex items-end justify-between border-t border-ink-inverse/10 pt-5 text-left">
              <div>
                <p className="font-serif text-lg italic text-ink-inverse">QTNXT Academy</p>
                <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-ink-inverse/40">
                  Official seal of completion
                </p>
              </div>
              <p className="text-right text-[10px] leading-relaxed text-ink-inverse/40">
                Issued on {p.issuedLabel}
                <br />
                Lifetime validity
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-center gap-2 print:hidden">
          <Button variant="gold" onClick={() => window.print()}>
            Print / Save PDF
          </Button>
          <Button variant="secondary" onClick={copyLink}>
            {copied ? <Check size={14} strokeWidth={2.5} aria-hidden /> : <LinkIcon size={14} strokeWidth={2.5} aria-hidden />}
            {copied ? " Copied" : " Copy link"}
          </Button>
          {!p.standalone && (
            <Button variant="secondary" onClick={p.onClose}>
              Close
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
