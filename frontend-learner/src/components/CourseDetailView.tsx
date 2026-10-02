import { useState } from "react";
import { Link } from "react-router-dom";
import { LESSON_KIND_BADGE, Minus, Plus } from "@masterlms/shared";
import type { CourseDetail } from "../types/course";
import type {
  CouponQuote,
  GiftInput,
  GiftOutcome,
  RedeemOutcome,
} from "../types/promotions";

type Props = {
  data: CourseDetail;
  enrolled: boolean;
  progress?: number;
  processing: boolean;
  open: number;
  toast: string | null;
  onOpen: (i: number) => void;
  onEnroll: () => void;
  onNotify: (msg: string) => void;
  coupon: CouponQuote | null;
  onValidateCoupon: (code: string) => Promise<CouponQuote>;
  onRemoveCoupon: () => void;
  onPurchaseGift: (input: GiftInput) => Promise<GiftOutcome>;
  onRedeemGift: (code: string) => Promise<RedeemOutcome>;
  wishlisted: boolean;
  onToggleWishlist: () => void;
};

type Dialog = null | "share" | "gift" | "coupon";

function formatPaise(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function errorText(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      return true;
    } catch {
      return false;
    }
  }
}

export function CourseDetailView({
  data,
  enrolled,
  progress = 0,
  processing,
  open,
  toast,
  onOpen,
  onEnroll,
  onNotify,
  coupon,
  onValidateCoupon,
  onRemoveCoupon,
  onPurchaseGift,
  onRedeemGift,
  wishlisted,
  onToggleWishlist,
}: Props) {
  const curriculum = data.curriculum ?? [];
  const learn = data.learn ?? [];
  const lectureCount = curriculum.reduce((a, c) => a + c.lessons.length, 0);
  const cta = progress >= 100 ? "Review course →" : progress > 0 ? `Continue learning — ${progress}% →` : "Start learning →";
  const [dialog, setDialog] = useState<Dialog>(null);
  const [couponCode, setCouponCode] = useState("");
  const [couponBusy, setCouponBusy] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [giftTab, setGiftTab] = useState<"send" | "redeem">("send");
  const [giftEmail, setGiftEmail] = useState("");
  const [giftName, setGiftName] = useState("");
  const [giftMessage, setGiftMessage] = useState("");
  const [giftCoupon, setGiftCoupon] = useState("");
  const [giftBusy, setGiftBusy] = useState(false);
  const [giftError, setGiftError] = useState<string | null>(null);
  const [giftDone, setGiftDone] = useState<GiftOutcome | null>(null);
  const [redeemCode, setRedeemCode] = useState("");
  const [redeemBusy, setRedeemBusy] = useState(false);
  const [redeemError, setRedeemError] = useState<string | null>(null);
  const [redeemDone, setRedeemDone] = useState<RedeemOutcome | null>(null);

  const pageUrl = typeof window !== "undefined" ? window.location.href : "";

  const handleShare = async () => {
    const shareData = { title: data.title, text: `Check out this course: ${data.title}`, url: pageUrl };
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await (navigator as Navigator & { share: (d: typeof shareData) => Promise<void> }).share(shareData);
        return;
      } catch {
        // user dismissed native share — fall through to dialog
      }
    }
    setDialog("share");
  };

  const handleCopyLink = async () => {
    const ok = await copyText(pageUrl);
    onNotify(ok ? "Course link copied to clipboard" : "Could not copy link");
    if (ok) setDialog(null);
  };

  const applyCoupon = async () => {
    const code = couponCode.trim();
    if (!code) {
      setCouponError("Enter a coupon code");
      return;
    }
    setCouponBusy(true);
    setCouponError(null);
    try {
      const quote = await onValidateCoupon(code);
      onNotify(
        `Coupon ${quote.code} applied — ${formatPaise(quote.discount_paise)} off, now ${formatPaise(quote.final_amount_paise)}`,
      );
      setCouponCode("");
      setDialog(null);
    } catch (e) {
      setCouponError(errorText(e));
    } finally {
      setCouponBusy(false);
    }
  };

  const sendGift = async () => {
    const email = giftEmail.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setGiftError("Enter a valid recipient email address");
      return;
    }
    setGiftBusy(true);
    setGiftError(null);
    try {
      const outcome = await onPurchaseGift({
        recipientEmail: email,
        recipientName: giftName,
        message: giftMessage,
        couponCode: giftCoupon,
      });
      setGiftDone(outcome);
    } catch (e) {
      const msg = errorText(e);
      if (msg !== "Payment cancelled") setGiftError(msg);
    } finally {
      setGiftBusy(false);
    }
  };

  const redeemGiftCode = async () => {
    const code = redeemCode.trim();
    if (!code) {
      setRedeemError("Enter your gift code");
      return;
    }
    setRedeemBusy(true);
    setRedeemError(null);
    try {
      const outcome = await onRedeemGift(code);
      setRedeemDone(outcome);
      onNotify(`Gift claimed — enjoy ${outcome.item_title}!`);
    } catch (e) {
      setRedeemError(errorText(e));
    } finally {
      setRedeemBusy(false);
    }
  };

  const closeDialog = () => {
    setDialog(null);
    setCouponError(null);
    setGiftError(null);
    setGiftDone(null);
    setRedeemError(null);
    setRedeemDone(null);
    setGiftTab("send");
  };
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      {/* LEFT */}
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold">
          {data.level && <span className="rounded-full border bg-white px-2.5 py-1 text-zinc-700 capitalize">{data.level}</span>}
          <span className="rounded-full border bg-white px-2.5 py-1 text-zinc-700">{lectureCount} lecture{lectureCount === 1 ? "" : "s"}</span>
        </div>

        <h1 className="mt-4 text-[28px] font-extrabold leading-tight tracking-tight sm:text-[32px]">{data.title}</h1>
        {data.subtitle && <p className="mt-2 text-sm leading-relaxed text-zinc-600">{data.subtitle}</p>}

        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
          {data.rating && <span className="inline-flex items-center gap-1 font-semibold"><span className="text-amber-400">★ {data.rating}</span></span>}
          {data.students && <span className="text-zinc-500">({data.students})</span>}
          {(data.instructor || data.avatar) && (
            <span className="flex items-center gap-1.5 text-zinc-500">
              {data.avatar && <img src={data.avatar} alt="" className="h-6 w-6 rounded-full object-cover" />}
              <span className="font-medium text-zinc-700">{data.instructor}</span>
            </span>
          )}
        </div>

        {/* Mobile preview card */}
        {data.img && (
        <div className="mt-6 overflow-hidden rounded-2xl border bg-white shadow-sm lg:hidden">
          <div className="relative"><img src={data.img} alt="" className="h-48 w-full object-cover" /></div>
          <div className="p-4">
            <div className="flex items-baseline gap-2">
              {coupon && <span className="text-sm text-zinc-400 line-through">{data.price}</span>}
              <span className={`text-2xl font-black ${coupon ? "text-emerald-700" : ""}`}>
                {coupon ? formatPaise(coupon.final_amount_paise) : data.price}
              </span>
            </div>
            {enrolled && progress > 0 && (
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-100">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min(100, progress)}%` }} />
              </div>
            )}
            {enrolled ? (
              <Link to={`/learn/${data.id}`} className="mt-3 block w-full rounded-full bg-emerald-600 py-3 text-center text-sm font-bold text-white">{cta}</Link>
            ) : (
              <button onClick={onEnroll} disabled={processing} className="mt-3 w-full rounded-full bg-[#0f172a] py-3 text-sm font-bold text-white disabled:opacity-60">
                {processing ? "Processing…" : data.price === "Free" ? "Enroll now — Free" : "Enroll now"}
              </button>
            )}
            <button
              type="button"
              onClick={onToggleWishlist}
              aria-pressed={wishlisted}
              className="mt-2 w-full rounded-full border py-2.5 text-sm font-semibold hover:bg-zinc-50"
            >
              {wishlisted ? "Wishlisted ♥" : "Add to wishlist ♡"}
            </button>
            {coupon && (
              <p className="mt-2 text-center text-[11px] font-bold text-emerald-600">
                {coupon.code} — {formatPaise(coupon.discount_paise)} off at checkout
                <button type="button" onClick={onRemoveCoupon} className="ml-1.5 font-semibold underline">Remove</button>
              </p>
            )}
            <div className="mt-3 flex gap-2">
              <button type="button" onClick={handleShare} className="flex-1 rounded-full border py-2 text-xs font-medium hover:bg-zinc-50">Share</button>
              <button type="button" onClick={() => setDialog("gift")} className="flex-1 rounded-full border py-2 text-xs font-medium hover:bg-zinc-50">Gift</button>
              <button type="button" onClick={() => setDialog("coupon")} className="flex-1 rounded-full border py-2 text-xs font-medium hover:bg-zinc-50">Coupon</button>
            </div>
          </div>
        </div>
        )}

        {/* What you'll learn */}
        {learn.length > 0 && (
        <div className="mt-6 rounded-2xl border bg-[#fdfdfc] p-5">
          <h3 className="text-sm font-bold">What you’ll learn</h3>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {learn.map((l) => (
              <div key={l} className="flex gap-2 text-xs leading-relaxed text-zinc-700"><span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-[10px] text-white">✓</span>{l}</div>
            ))}
          </div>
        </div>
        )}

        {/* Curriculum */}
        {curriculum.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between"><h3 className="text-sm font-bold">Course content</h3><span className="text-xs text-zinc-500">{curriculum.length} sections • {lectureCount} lectures</span></div>
          <div className="mt-3 overflow-hidden rounded-2xl border bg-white">
            {curriculum.map((sec, i) => (
              <div key={sec.title} className="border-b last:border-0">
                <button onClick={() => onOpen(open === i ? -1 : i)} className="flex w-full items-center justify-between bg-zinc-50 px-4 py-3 text-left hover:bg-zinc-100">
                  <span className="text-sm font-semibold">{sec.title}</span><span className="flex items-center gap-2 text-xs text-zinc-500">{sec.meta}<span className={`flex h-6 w-6 items-center justify-center rounded-full ${open === i ? "bg-[#3478ff] text-white" : "bg-white text-zinc-700"}`}>{open === i ? <Minus size={12} strokeWidth={2.5} /> : <Plus size={12} strokeWidth={2.5} />}</span></span>
                </button>
                {open === i && <ul className="px-4 py-2">{sec.lessons.map((l) => { const badge = LESSON_KIND_BADGE[l.kind]; const Icon = badge.Icon; return (
                  <li key={l.id} className="flex items-center gap-2 py-2 text-xs text-zinc-700">
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${badge.badge}`}><Icon size={11} strokeWidth={2.5} /></span>
                    <span className="min-w-0 flex-1 truncate">{l.title}</span>
                    {l.kind === "quiz" && <span className="rounded-full bg-yellow-400 px-1.5 py-0.5 text-[10px] font-bold text-zinc-900">Quiz</span>}
                    <span className="text-zinc-400">{l.duration}</span>
                  </li>
                ); })}</ul>}
              </div>
            ))}
          </div>
        </div>
        )}

        {/* Description + instructor */}
        {data.description && (
        <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold">Description</h3><p className="mt-2 text-sm leading-relaxed text-zinc-600">{data.description}</p>
          {(data.instructor || data.avatar) && (
          <div className="mt-5 flex gap-3 rounded-xl bg-zinc-50 p-4">
            {data.avatar && <img src={data.avatar} alt="" className="h-12 w-12 rounded-full object-cover" />}
            <div><p className="text-sm font-bold">{data.instructor}</p>{data.instructorRole && <p className="text-xs text-zinc-500">{data.instructorRole}</p>}</div>
          </div>
          )}
        </div>
        )}
      </div>

      {/* RIGHT — sticky enroll card */}
      <div className="hidden lg:block">
        <div className="sticky top-[88px] overflow-hidden rounded-[20px] border bg-white shadow-sm">
          {data.img && (
          <div className="relative"><img src={data.img} alt="" className="h-44 w-full object-cover" /></div>
          )}
          <div className="p-5">
            <div className="flex items-baseline gap-2">
              {coupon && <span className="text-base text-zinc-400 line-through">{data.price}</span>}
              <span className={`text-[28px] font-black tracking-tight ${coupon ? "text-emerald-700" : ""}`}>
                {coupon ? formatPaise(coupon.final_amount_paise) : data.price}
              </span>
            </div>
            {enrolled && progress > 0 && (
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-100">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min(100, progress)}%` }} />
              </div>
            )}
            {enrolled ? (
              <Link to={`/learn/${data.id}`} className="mt-4 block w-full rounded-full bg-emerald-600 py-3 text-center text-sm font-bold text-white hover:bg-emerald-700">{cta}</Link>
            ) : (
              <button onClick={onEnroll} disabled={processing} className="mt-4 w-full rounded-full bg-[#0f172a] py-3 text-sm font-bold text-white hover:bg-black disabled:opacity-60">
                {processing ? "Processing…" : "Enroll now"}
              </button>
            )}
            <button
              type="button"
              onClick={onToggleWishlist}
              aria-pressed={wishlisted}
              className="mt-2 w-full rounded-full border py-2.5 text-sm font-semibold hover:bg-zinc-50"
            >
              {wishlisted ? "Wishlisted ♥" : "Add to wishlist ♡"}
            </button>
            <p className="mt-2 text-center text-[11px] text-zinc-500">30-day money-back guarantee • Full lifetime access</p>

            <div className="mt-5 rounded-xl bg-zinc-50 p-4">
              <p className="text-xs font-bold">This course includes:</p>
              <ul className="mt-2 space-y-1.5 text-xs text-zinc-600">
                <li className="flex gap-2"><span>●</span> On-demand videos</li>
                <li className="flex gap-2"><span>●</span> {curriculum.length} section{curriculum.length === 1 ? "" : "s"} • {lectureCount} lecture{lectureCount === 1 ? "" : "s"}</li>
                <li className="flex gap-2"><span>●</span> Interactive quizzes</li>
                <li className="flex gap-2"><span>●</span> Certificate of completion</li>
                <li className="flex gap-2"><span>●</span> Full lifetime access</li>
              </ul>
            </div>

            <div className="mt-4 flex gap-2">
              <button type="button" onClick={handleShare} className="flex-1 rounded-full border py-2 text-xs font-medium hover:bg-zinc-50">Share</button>
              <button type="button" onClick={() => setDialog("gift")} className="flex-1 rounded-full border py-2 text-xs font-medium hover:bg-zinc-50">Gift</button>
              <button type="button" onClick={() => setDialog("coupon")} className="flex-1 rounded-full border py-2 text-xs font-medium hover:bg-zinc-50">Coupon</button>
            </div>
            {coupon && (
              <p className="mt-2 text-center text-[11px] font-bold text-emerald-600">
                {coupon.code} — {formatPaise(coupon.discount_paise)} off at checkout
                <button type="button" onClick={onRemoveCoupon} className="ml-1.5 font-semibold underline">Remove</button>
              </p>
            )}
          </div>
        </div>
      </div>

      {dialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={closeDialog}>
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {dialog === "share" && (
              <div>
                <h3 className="text-base font-bold">Share this course</h3>
                <p className="mt-1 text-xs text-zinc-500">Let others discover “{data.title}”.</p>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="mt-4 w-full rounded-full bg-[#0f172a] py-2.5 text-sm font-bold text-white hover:bg-black"
                >
                  Copy link
                </button>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(`${data.title} ${pageUrl}`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border py-2 text-center text-xs font-semibold hover:bg-zinc-50"
                  >
                    WhatsApp
                  </a>
                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(data.title)}&url=${encodeURIComponent(pageUrl)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border py-2 text-center text-xs font-semibold hover:bg-zinc-50"
                  >
                    Post on X
                  </a>
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border py-2 text-center text-xs font-semibold hover:bg-zinc-50"
                  >
                    Facebook
                  </a>
                  <a
                    href={`mailto:?subject=${encodeURIComponent(data.title)}&body=${encodeURIComponent(`Check out this course: ${pageUrl}`)}`}
                    className="rounded-full border py-2 text-center text-xs font-semibold hover:bg-zinc-50"
                  >
                    Email
                  </a>
                </div>
                <button type="button" onClick={closeDialog} className="mt-3 w-full py-1 text-center text-xs font-semibold text-zinc-500 hover:text-zinc-900">
                  Close
                </button>
              </div>
            )}
            {dialog === "gift" && (
              <div>
                <h3 className="text-base font-bold">Gift this course</h3>
                <div className="mt-3 grid grid-cols-2 gap-1 rounded-full bg-zinc-100 p-1 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setGiftTab("send")}
                    className={`rounded-full py-1.5 ${giftTab === "send" ? "bg-white shadow" : "text-zinc-500"}`}
                  >
                    Send gift
                  </button>
                  <button
                    type="button"
                    onClick={() => setGiftTab("redeem")}
                    className={`rounded-full py-1.5 ${giftTab === "redeem" ? "bg-white shadow" : "text-zinc-500"}`}
                  >
                    Redeem code
                  </button>
                </div>
                {giftTab === "send" ? (
                  giftDone ? (
                    <div className="mt-4 rounded-2xl bg-emerald-50 p-4 text-center">
                      <p className="text-sm font-bold text-emerald-700">Gift ready!</p>
                      <p className="mt-1 text-xs text-emerald-600">
                        {giftDone.enrolled
                          ? "The recipient has an account and is now enrolled."
                          : "Share this code — the recipient redeems it under Gift → Redeem code."}
                      </p>
                      <button
                        type="button"
                        onClick={async () => {
                          const ok = await copyText(giftDone.giftCode);
                          onNotify(ok ? "Gift code copied" : "Could not copy code");
                        }}
                        className="mt-3 w-full rounded-full bg-emerald-600 py-2 font-mono text-sm font-bold text-white hover:bg-emerald-700"
                      >
                        {giftDone.giftCode} ⧉
                      </button>
                      <button type="button" onClick={closeDialog} className="mt-2 w-full py-1 text-center text-xs font-semibold text-zinc-500 hover:text-zinc-900">
                        Done
                      </button>
                    </div>
                  ) : (
                    <div className="mt-4 space-y-2">
                      <p className="text-xs text-zinc-500">
                        You pay {coupon ? "the discounted price" : "for the course"} — “{data.title}” goes to them.
                      </p>
                      <input
                        value={giftName}
                        onChange={(e) => setGiftName(e.target.value)}
                        placeholder="Recipient name (optional)"
                        className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-zinc-900"
                      />
                      <input
                        value={giftEmail}
                        onChange={(e) => setGiftEmail(e.target.value)}
                        placeholder="Recipient email"
                        type="email"
                        className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-zinc-900"
                      />
                      <input
                        value={giftMessage}
                        onChange={(e) => setGiftMessage(e.target.value)}
                        placeholder="Message (optional)"
                        className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-zinc-900"
                      />
                      <input
                        value={giftCoupon}
                        onChange={(e) => setGiftCoupon(e.target.value.toUpperCase())}
                        placeholder="Coupon code (optional)"
                        className="w-full rounded-xl border px-3 py-2 text-sm uppercase outline-none focus:border-zinc-900"
                      />
                      {giftError && <p className="text-xs text-red-600">{giftError}</p>}
                      <button
                        type="button"
                        onClick={sendGift}
                        disabled={giftBusy}
                        className="w-full rounded-full bg-[#0f172a] py-2.5 text-sm font-bold text-white hover:bg-black disabled:opacity-60"
                      >
                        {giftBusy ? "Processing…" : "Pay & send gift"}
                      </button>
                      <button type="button" onClick={closeDialog} className="w-full py-1 text-center text-xs font-semibold text-zinc-500 hover:text-zinc-900">
                        Cancel
                      </button>
                    </div>
                  )
                ) : redeemDone ? (
                  <div className="mt-4 rounded-2xl bg-emerald-50 p-4 text-center">
                    <p className="text-sm font-bold text-emerald-700">Gift claimed!</p>
                    <p className="mt-1 text-xs text-emerald-600">You’re now enrolled in “{redeemDone.item_title}”.</p>
                    {redeemDone.kind === "course" ? (
                      <Link
                        to={`/learn/${redeemDone.item_id}`}
                        className="mt-3 block w-full rounded-full bg-emerald-600 py-2 text-sm font-bold text-white hover:bg-emerald-700"
                      >
                        Start learning →
                      </Link>
                    ) : (
                      <Link
                        to={`/packs/${redeemDone.item_id}`}
                        className="mt-3 block w-full rounded-full bg-emerald-600 py-2 text-sm font-bold text-white hover:bg-emerald-700"
                      >
                        View pack →
                      </Link>
                    )}
                    <button type="button" onClick={closeDialog} className="mt-2 w-full py-1 text-center text-xs font-semibold text-zinc-500 hover:text-zinc-900">
                      Close
                    </button>
                  </div>
                ) : (
                  <div className="mt-4 space-y-2">
                    <p className="text-xs text-zinc-500">Got a gift code? Enter it to claim your course or pack.</p>
                    <input
                      value={redeemCode}
                      onChange={(e) => {
                        setRedeemCode(e.target.value.toUpperCase());
                        setRedeemError(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") redeemGiftCode();
                      }}
                      placeholder="e.g. GIFT-AB12CD34EF"
                      className="w-full rounded-xl border px-3 py-2 font-mono text-sm uppercase outline-none focus:border-zinc-900"
                    />
                    {redeemError && <p className="text-xs text-red-600">{redeemError}</p>}
                    <button
                      type="button"
                      onClick={redeemGiftCode}
                      disabled={redeemBusy}
                      className="w-full rounded-full bg-[#0f172a] py-2.5 text-sm font-bold text-white hover:bg-black disabled:opacity-60"
                    >
                      {redeemBusy ? "Claiming…" : "Claim gift"}
                    </button>
                    <button type="button" onClick={closeDialog} className="w-full py-1 text-center text-xs font-semibold text-zinc-500 hover:text-zinc-900">
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}
            {dialog === "coupon" && (
              <div>
                <h3 className="text-base font-bold">Apply coupon</h3>
                <p className="mt-1 text-xs text-zinc-500">Have a code? Enter it below. Try WELCOME10 for 10% off.</p>
                <div className="mt-4 flex gap-2">
                  <input
                    value={couponCode}
                    onChange={(e) => {
                      setCouponCode(e.target.value.toUpperCase());
                      setCouponError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") applyCoupon();
                    }}
                    placeholder="e.g. WELCOME10"
                    className="min-w-0 flex-1 rounded-xl border px-3 py-2 text-sm uppercase outline-none focus:border-zinc-900"
                  />
                  <button
                    type="button"
                    onClick={applyCoupon}
                    disabled={couponBusy}
                    className="rounded-full bg-[#0f172a] px-5 py-2 text-sm font-bold text-white hover:bg-black disabled:opacity-60"
                  >
                    {couponBusy ? "Checking…" : "Apply"}
                  </button>
                </div>
                {couponError && <p className="mt-2 text-xs text-red-600">{couponError}</p>}
                {coupon && <p className="mt-2 text-xs font-bold text-emerald-600">{coupon.code} — {formatPaise(coupon.discount_paise)} off, now {formatPaise(coupon.final_amount_paise)}</p>}
                <button type="button" onClick={closeDialog} className="mt-3 w-full py-1 text-center text-xs font-semibold text-zinc-500 hover:text-zinc-900">
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white shadow-xl">
          {toast}
        </div>
      )}
    </div>
  );
}
