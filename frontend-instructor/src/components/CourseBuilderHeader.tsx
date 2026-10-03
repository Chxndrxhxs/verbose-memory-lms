import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, Cloud, Eye } from "@masterlms/shared";
import { Button } from "./Button";
import { cn } from "../lib/utils";

type Props = {
  title: string;
  saving: boolean;
  saveStatus?: string;
  disabled?: boolean;
  disabledHint?: string;
  onPreview: () => void;
  onPublish: () => void;
  onSave: () => void;
};

/** The site nav is fixed at the top, so this bar measures it and sits flush
 *  beneath rather than hardcoding a magic number that silently overlaps. */
function useNavOffset(): number {
  const [offset, setOffset] = useState(56);

  useEffect(() => {
    const nav = document.querySelector<HTMLElement>("[data-site-header]");
    if (!nav) return;
    const measure = () => setOffset(nav.getBoundingClientRect().height);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(nav);
    return () => observer.disconnect();
  }, []);

  return offset;
}

export function CourseBuilderHeader({
  title,
  saving,
  saveStatus,
  disabled = false,
  disabledHint = "Save course details first",
  onPreview,
  onPublish,
  onSave,
}: Props) {
  const nav = useNavigate();
  const navOffset = useNavOffset();

  return (
    <div
      className="sticky z-30 border border-rule bg-slate-panel/95 px-3 py-2 backdrop-blur supports-[backdrop-filter]:bg-slate-panel/85"
      style={{ top: navOffset + 8 }}
    >
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" iconOnly onClick={() => nav("/courses")} aria-label="Back to courses">
          <ArrowLeft size={16} strokeWidth={2.5} aria-hidden />
        </Button>

        <p className="min-w-0 flex-1 truncate text-center text-sm font-semibold text-ink sm:text-base">
          {title || "Untitled course"}
          {saveStatus && (
            <span className="ml-2 hidden text-[11px] font-normal text-ink-faint sm:inline">
              {saveStatus}
            </span>
          )}
        </p>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <Button
            variant="secondary"
            size="sm"
            iconOnly
            onClick={onPreview}
            aria-label="Preview course as a learner"
          >
            <Eye size={15} strokeWidth={2.25} aria-hidden />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={onPublish}
            disabled={disabled}
            title={disabled ? disabledHint : "Publish course"}
            className={cn(!disabled && "border-live/35 text-live hover:bg-live-soft")}
          >
            <ArrowUpRight size={13} strokeWidth={2.5} aria-hidden />
            Publish
          </Button>
          <Button variant="primary" size="sm" onClick={onSave} disabled={saving || disabled} title={disabled ? disabledHint : "Save course"}>
            <Cloud size={13} strokeWidth={2.5} aria-hidden />
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}