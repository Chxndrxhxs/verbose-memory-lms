import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, Cloud, Eye } from "@masterlms/shared";

type Props = {
  title: string;
  saving: boolean;
  disabled?: boolean;
  disabledHint?: string;
  onPreview: () => void;
  onPublish: () => void;
  onSave: () => void;
};

export function CourseBuilderHeader({ title, saving, disabled = false, disabledHint = "Save course details first", onPreview, onPublish, onSave }: Props) {
  const nav = useNavigate();
  return (
    <div className="sticky top-3 z-30 rounded-full bg-white px-3 py-2 shadow-lg">
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={() => nav("/courses")}
          title="Back to courses"
          className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
        >
          <ArrowLeft size={16} strokeWidth={2.5} />
        </button>
        <p className="min-w-0 flex-1 truncate text-center text-sm font-bold text-zinc-900 sm:text-base">
          {title || "Untitled course"}
        </p>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={onPreview}
            title="Preview course as learner"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 text-zinc-700 hover:bg-zinc-50"
          >
            <Eye size={15} strokeWidth={2.25} />
          </button>
          <button
            onClick={onPublish}
            disabled={disabled}
            title={disabled ? disabledHint : "Publish course"}
            className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 px-2.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 sm:px-3"
          >
            <ArrowUpRight size={13} strokeWidth={2.5} />
            Publish
          </button>
          <button
            onClick={onSave}
            disabled={saving || disabled}
            title={disabled ? disabledHint : "Save course"}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#0f172a] px-3 py-2 text-xs font-bold text-white hover:bg-black disabled:opacity-60 sm:px-4"
          >
            <Cloud size={13} strokeWidth={2.5} />
            {saving ? "Saving…" : "Save course"}
          </button>
        </div>
      </div>
    </div>
  );
}