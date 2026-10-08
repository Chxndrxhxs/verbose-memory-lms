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
import { Badge } from "./Badge";
import { Button, Segmented } from "./Button";
import { Input } from "./Controls";
import { Modal } from "./Modal";
import { Panel } from "./Panel";

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
        <div className="flex flex-wrap items-center gap-2">
          {data.level && <Badge tone="muted" showIcon={false} className="capitalize">{data.level}</Badge>}
          <Badge tone="muted" showIcon={false} className="tnum">{lectureCount} lecture{lectureCount === 1 ? "" : "s"}</Badge>
        </div>

        <h1 className="mt-4 text-2xl font-semibold leading-tight text-ink sm:text-[28px]">{data.title}</h1>
        {data.subtitle && <p className="measure mt-2 font-serif text-sm leading-relaxed text-ink-muted">{data.subtitle}</p>}

        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
          {data.rating && <span className="tnum inline-flex items-center gap-1 font-semibold text-gold-deep"><span aria-hidden>★</span> {data.rating}</span>}
          {data.students && <span className="tnum text-ink-muted">({data.students})</span>}
          {(data.instructor || data.avatar) && (
            <span className="flex items-center gap-1.5 text-ink-muted">
              {data.avatar && <img src={data.avatar} alt="" className="h-6 w-6 rounded-full object-cover" />}
              <span className="font-semibold text-ink">{data.instructor}</span>
            </span>
          )}
        </div>

        {/* Mobile preview card */}
        {data.img && (
        <Panel flush className="mt-6 lg:hidden">
          <div className="relative"><img src={data.img} alt="" className="h-48 w-full object-cover" /></div>
          <div className="p-4">
            <div className="flex items-baseline gap-2">
              {coupon && <span className="tnum text-sm text-ink-faint line-through">{data.price}</span>}
              <span className={`tnum text-2xl font-semibold ${coupon ? "text-live" : "text-ink"}`}>
                {coupon ? formatPaise(coupon.final_amount_paise) : data.price}
              </span>
            </div>
            {enrolled && progress > 0 && (
              <div className="mt-3 h-1.5 overflow-hidden bg-rule/50">
                <div className="h-full bg-gold" style={{ width: `${Math.min(100, progress)}%` }} />
              </div>
            )}
            {enrolled ? (
              <Link to={`/learn/${data.id}`} className="mt-3 flex h-12 w-full items-center justify-center border border-live bg-live text-sm font-semibold text-ink-inverse transition-colors hover:bg-live/90">{cta}</Link>
            ) : (
              <Button variant="primary" size="lg" block onClick={onEnroll} disabled={processing} className="mt-3">
                {processing ? "Processing…" : data.price === "Free" ? "Enroll now — Free" : "Enroll now"}
              </Button>
            )}
            <Button
              variant="secondary"
              block
              onClick={onToggleWishlist}
              aria-pressed={wishlisted}
              className="mt-2"
            >
              {wishlisted ? "Wishlisted ♥" : "Add to wishlist ♡"}
            </Button>
            {coupon && (
              <p className="tnum mt-2 text-center text-[11px] font-semibold text-live">
                {coupon.code} — {formatPaise(coupon.discount_paise)} off at checkout
                <button type="button" onClick={onRemoveCoupon} className="ml-1.5 font-semibold underline">Remove</button>
              </p>
            )}
            <div className="mt-3 grid grid-cols-3 gap-2">
              <Button variant="secondary" size="sm" block onClick={handleShare}>Share</Button>
              <Button variant="secondary" size="sm" block onClick={() => setDialog("gift")}>Gift</Button>
              <Button variant="secondary" size="sm" block onClick={() => setDialog("coupon")}>Coupon</Button>
            </div>
          </div>
        </Panel>
        )}

        {/* What you'll learn */}
        {learn.length > 0 && (
        <Panel tone="sunk" className="mt-6">
          <h3 className="text-sm font-semibold text-ink">What you’ll learn</h3>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {learn.map((l) => (
              <div key={l} className="flex gap-2 text-xs leading-relaxed text-ink-muted"><span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center bg-live text-[10px] font-semibold text-ink-inverse">✓</span>{l}</div>
            ))}
          </div>
        </Panel>
        )}

        {/* Curriculum */}
        {curriculum.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between"><h3 className="text-sm font-semibold text-ink">Course content</h3><span className="tnum text-xs text-ink-muted">{curriculum.length} sections • {lectureCount} lectures</span></div>
          <Panel flush className="mt-3">
            {curriculum.map((sec, i) => (
              <div key={sec.title} className="border-b border-rule last:border-0">
                <button type="button" onClick={() => onOpen(open === i ? -1 : i)} className="flex w-full items-center justify-between bg-room-sunk px-4 py-3 text-left transition-colors hover:bg-rule/40">
                  <span className="text-sm font-semibold text-ink">{sec.title}</span><span className="tnum flex items-center gap-2 text-xs text-ink-muted">{sec.meta}<span className={`flex h-6 w-6 items-center justify-center ${open === i ? "bg-ink text-ink-inverse" : "bg-room-raised text-ink border border-rule"}`}>{open === i ? <Minus size={12} strokeWidth={2.5} aria-hidden /> : <Plus size={12} strokeWidth={2.5} aria-hidden />}</span></span>
                </button>
                {open === i && <ul className="px-4 py-2">{sec.lessons.map((l) => { const badge = LESSON_KIND_BADGE[l.kind]; const Icon = badge.Icon; return (
                  <li key={l.id} className="flex items-center gap-2 py-2 text-xs text-ink-muted">
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center ${badge.badge}`}><Icon size={11} strokeWidth={2.5} aria-hidden /></span>
                    <span className="min-w-0 flex-1 truncate text-ink">{l.title}</span>
                    {l.kind === "quiz" && <Badge tone="gold" showIcon={false} className="px-1.5 text-[10px]">Quiz</Badge>}
                    <span className="tnum text-ink-faint">{l.duration}</span>
                  </li>
                ); })}</ul>}
              </div>
            ))}
          </Panel>
        </div>
        )}

        {/* Description + instructor */}
        {data.description && (
        <Panel className="mt-6">
          <h3 className="text-sm font-semibold text-ink">Description</h3><p className="measure mt-2 break-words font-serif text-sm leading-relaxed text-ink-muted">{data.description}</p>
          {(data.instructor || data.avatar) && (
          <div className="mt-5 flex gap-3 border border-rule bg-room-sunk p-4">
            {data.avatar && <img src={data.avatar} alt="" className="h-12 w-12 rounded-full object-cover" />}
            <div><p className="text-sm font-semibold text-ink">{data.instructor}</p>{data.instructorRole && <p className="text-xs text-ink-muted">{data.instructorRole}</p>}</div>
          </div>
          )}
        </Panel>
        )}
      </div>

      {/* RIGHT — sticky enroll card */}
      <div className="hidden lg:block">
        <Panel flush className="sticky top-[88px]">
          {data.img && (
          <div className="relative"><img src={data.img} alt="" className="h-44 w-full object-cover" /></div>
          )}
          <div className="p-5">
            <div className="flex items-baseline gap-2">
              {coupon && <span className="tnum text-base text-ink-faint line-through">{data.price}</span>}
              <span className={`tnum text-2xl font-semibold ${coupon ? "text-live" : "text-ink"}`}>
                {coupon ? formatPaise(coupon.final_amount_paise) : data.price}
              </span>
            </div>
            {enrolled && progress > 0 && (
              <div className="mt-3 h-1.5 overflow-hidden bg-rule/50">
                <div className="h-full bg-gold" style={{ width: `${Math.min(100, progress)}%` }} />
              </div>
            )}
            {enrolled ? (
              <Link to={`/learn/${data.id}`} className="mt-4 flex h-12 w-full items-center justify-center border border-live bg-live text-sm font-semibold text-ink-inverse transition-colors hover:bg-live/90">{cta}</Link>
            ) : (
              <Button variant="primary" size="lg" block onClick={onEnroll} disabled={processing} className="mt-4">
                {processing ? "Processing…" : "Enroll now"}
              </Button>
            )}
            <Button
              variant="secondary"
              block
              onClick={onToggleWishlist}
              aria-pressed={wishlisted}
              className="mt-2"
            >
              {wishlisted ? "Wishlisted ♥" : "Add to wishlist ♡"}
            </Button>
            <p className="mt-2 text-center text-[11px] text-ink-muted">30-day money-back guarantee • Full lifetime access</p>

            <div className="mt-5 border border-rule bg-room-sunk p-4">
              <p className="text-xs font-semibold text-ink">This course includes:</p>
              <ul className="mt-2 space-y-1.5 text-xs text-ink-muted">
                <li className="flex gap-2"><span aria-hidden>●</span> On-demand videos</li>
                <li className="tnum flex gap-2"><span aria-hidden>●</span> {curriculum.length} section{curriculum.length === 1 ? "" : "s"} • {lectureCount} lecture{lectureCount === 1 ? "" : "s"}</li>
                <li className="flex gap-2"><span aria-hidden>●</span> Interactive quizzes</li>
                <li className="flex gap-2"><span aria-hidden>●</span> Certificate of completion</li>
                <li className="flex gap-2"><span aria-hidden>●</span> Full lifetime access</li>
              </ul>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              <Button variant="secondary" size="sm" block onClick={handleShare}>Share</Button>
              <Button variant="secondary" size="sm" block onClick={() => setDialog("gift")}>Gift</Button>
              <Button variant="secondary" size="sm" block onClick={() => setDialog("coupon")}>Coupon</Button>
            </div>
            {coupon && (
              <p className="tnum mt-2 text-center text-[11px] font-semibold text-live">
                {coupon.code} — {formatPaise(coupon.discount_paise)} off at checkout
                <button type="button" onClick={onRemoveCoupon} className="ml-1.5 font-semibold underline">Remove</button>
              </p>
            )}
          </div>
        </Panel>
      </div>

      <Modal
        open={dialog != null}
        onClose={closeDialog}
        size="sm"
        title={
          dialog === "share" ? "Share this course"
          : dialog === "gift" ? "Gift this course"
          : dialog === "coupon" ? "Apply coupon"
          : ""
        }
        description={
          dialog === "share" ? `Let others discover “${data.title}”.`
          : dialog === "coupon" ? "Have a code? Enter it below. Try WELCOME10 for 10% off."
          : undefined
        }
      >
        {dialog === "share" && (
              <div>
                <Button variant="primary" block onClick={handleCopyLink}>Copy link</Button>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(`${data.title} ${pageUrl}`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="border border-rule bg-room-raised px-3 py-2 text-center text-xs font-semibold text-ink transition-colors hover:bg-room-sunk"
                  >
                    WhatsApp
                  </a>
                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(data.title)}&url=${encodeURIComponent(pageUrl)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="border border-rule bg-room-raised px-3 py-2 text-center text-xs font-semibold text-ink transition-colors hover:bg-room-sunk"
                  >
                    Post on X
                  </a>
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="border border-rule bg-room-raised px-3 py-2 text-center text-xs font-semibold text-ink transition-colors hover:bg-room-sunk"
                  >
                    Facebook
                  </a>
                  <a
                    href={`mailto:?subject=${encodeURIComponent(data.title)}&body=${encodeURIComponent(`Check out this course: ${pageUrl}`)}`}
                    className="border border-rule bg-room-raised px-3 py-2 text-center text-xs font-semibold text-ink transition-colors hover:bg-room-sunk"
                  >
                    Email
                  </a>
                </div>
                <Button variant="ghost" size="sm" block onClick={closeDialog} className="mt-3">Close</Button>
              </div>
            )}
            {dialog === "gift" && (
              <div>
                <Segmented
                  value={giftTab}
                  onChange={(v) => setGiftTab(v)}
                  ariaLabel="Gift action"
                  options={[
                    { value: "send" as const, label: "Send gift" },
                    { value: "redeem" as const, label: "Redeem code" },
                  ]}
                />
                {giftTab === "send" ? (
                  giftDone ? (
                    <div className="mt-4 border border-live/25 bg-live-soft p-4 text-center">
                      <p className="text-sm font-semibold text-live">Gift ready!</p>
                      <p className="mt-1 text-xs text-live">
                        {giftDone.enrolled
                          ? "The recipient has an account and is now enrolled."
                          : "Share this code — the recipient redeems it under Gift → Redeem code."}
                      </p>
                      <Button
                        variant="live"
                        block
                        onClick={async () => {
                          const ok = await copyText(giftDone.giftCode);
                          onNotify(ok ? "Gift code copied" : "Could not copy code");
                        }}
                        className="mt-3 font-mono"
                      >
                        {giftDone.giftCode} ⧉
                      </Button>
                      <Button variant="ghost" size="sm" block onClick={closeDialog} className="mt-2">Done</Button>
                    </div>
                  ) : (
                    <div className="mt-4 space-y-2">
                      <p className="text-xs text-ink-muted">
                        You pay {coupon ? "the discounted price" : "for the course"} — “{data.title}” goes to them.
                      </p>
                      <Input
                        value={giftName}
                        onChange={(e) => setGiftName(e.target.value)}
                        placeholder="Recipient name (optional)"
                      />
                      <Input
                        value={giftEmail}
                        onChange={(e) => setGiftEmail(e.target.value)}
                        placeholder="Recipient email"
                        type="email"
                      />
                      <Input
                        value={giftMessage}
                        onChange={(e) => setGiftMessage(e.target.value)}
                        placeholder="Message (optional)"
                      />
                      <Input
                        value={giftCoupon}
                        onChange={(e) => setGiftCoupon(e.target.value.toUpperCase())}
                        placeholder="Coupon code (optional)"
                        className="uppercase"
                      />
                      {giftError && <p role="alert" className="text-xs text-halt">{giftError}</p>}
                      <Button variant="primary" block onClick={sendGift} disabled={giftBusy}>
                        {giftBusy ? "Processing…" : "Pay & send gift"}
                      </Button>
                      <Button variant="ghost" size="sm" block onClick={closeDialog}>Cancel</Button>
                    </div>
                  )
                ) : redeemDone ? (
                  <div className="mt-4 border border-live/25 bg-live-soft p-4 text-center">
                    <p className="text-sm font-semibold text-live">Gift claimed!</p>
                    <p className="mt-1 text-xs text-live">You’re now enrolled in “{redeemDone.item_title}”.</p>
                    {redeemDone.kind === "course" ? (
                      <Link
                        to={`/learn/${redeemDone.item_id}`}
                        className="mt-3 flex h-10 w-full items-center justify-center border border-live bg-live text-sm font-semibold text-ink-inverse transition-colors hover:bg-live/90"
                      >
                        Start learning →
                      </Link>
                    ) : (
                      <Link
                        to={`/packs/${redeemDone.item_id}`}
                        className="mt-3 flex h-10 w-full items-center justify-center border border-live bg-live text-sm font-semibold text-ink-inverse transition-colors hover:bg-live/90"
                      >
                        View pack →
                      </Link>
                    )}
                    <Button variant="ghost" size="sm" block onClick={closeDialog} className="mt-2">Close</Button>
                  </div>
                ) : (
                  <div className="mt-4 space-y-2">
                    <p className="text-xs text-ink-muted">Got a gift code? Enter it to claim your course or pack.</p>
                    <Input
                      value={redeemCode}
                      onChange={(e) => {
                        setRedeemCode(e.target.value.toUpperCase());
                        setRedeemError(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") redeemGiftCode();
                      }}
                      placeholder="e.g. GIFT-AB12CD34EF"
                      className="font-mono uppercase"
                    />
                    {redeemError && <p role="alert" className="text-xs text-halt">{redeemError}</p>}
                    <Button variant="primary" block onClick={redeemGiftCode} disabled={redeemBusy}>
                      {redeemBusy ? "Claiming…" : "Claim gift"}
                    </Button>
                    <Button variant="ghost" size="sm" block onClick={closeDialog}>Cancel</Button>
                  </div>
                )}
              </div>
            )}
            {dialog === "coupon" && (
              <div>
                <div className="mt-1 flex gap-2">
                  <Input
                    value={couponCode}
                    onChange={(e) => {
                      setCouponCode(e.target.value.toUpperCase());
                      setCouponError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") applyCoupon();
                    }}
                    placeholder="e.g. WELCOME10"
                    className="min-w-0 flex-1 uppercase"
                  />
                  <Button variant="primary" onClick={applyCoupon} disabled={couponBusy}>
                    {couponBusy ? "Checking…" : "Apply"}
                  </Button>
                </div>
                {couponError && <p role="alert" className="mt-2 text-xs text-halt">{couponError}</p>}
                {coupon && <p className="tnum mt-2 text-xs font-semibold text-live">{coupon.code} — {formatPaise(coupon.discount_paise)} off, now {formatPaise(coupon.final_amount_paise)}</p>}
                <Button variant="ghost" size="sm" block onClick={closeDialog} className="mt-3">Close</Button>
              </div>
            )}
      </Modal>

      {toast && (
        <div role="status" className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 border border-ink bg-ink px-5 py-2.5 text-sm font-medium text-ink-inverse shadow-xl">
          {toast}
        </div>
      )}
    </div>
  );
}
