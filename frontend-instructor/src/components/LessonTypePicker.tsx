import { AlignLeft, FileText, HelpCircle, LinkIcon, Music, Video, type LucideIcon } from "@masterlms/shared";
import type { LessonKind } from "../types/courseCreate";
import { Modal } from "./Modal";

const OPTIONS: { kind: LessonKind; label: string; Icon: LucideIcon; color: string }[] = [
  { kind: "video", label: "Video", Icon: Video, color: "bg-ink text-ink-inverse" },
  { kind: "pdf", label: "PDF", Icon: FileText, color: "bg-ink text-ink-inverse" },
  { kind: "audio", label: "Audio", Icon: Music, color: "bg-ink text-ink-inverse" },
  { kind: "quiz", label: "Quiz", Icon: HelpCircle, color: "bg-hold-soft text-hold" },
  { kind: "text", label: "Text", Icon: AlignLeft, color: "bg-slate-sunk text-ink-muted" },
  { kind: "link", label: "Link", Icon: LinkIcon, color: "bg-live-soft text-live" },
];

type Props = {
  onSelect: (kind: LessonKind) => void;
  onClose: () => void;
};

export function LessonTypePicker({ onSelect, onClose }: Props) {
  return (
    <Modal
      open
      onClose={onClose}
      title="Add lesson"
      description="Choose the type of content for this lesson."
      size="sm"
    >
      <div className="grid grid-cols-3 gap-2">
        {OPTIONS.map(({ kind, label, Icon, color }) => (
          <button
            key={kind}
            type="button"
            onClick={() => onSelect(kind)}
            className="flex flex-col items-center gap-2 border border-rule bg-slate-panel py-4 transition-colors hover:border-ink hover:bg-slate-sunk"
          >
            <span className={`flex h-9 w-9 items-center justify-center rounded-full text-sm ${color}`}>
              <Icon size={17} strokeWidth={2.5} />
            </span>
            <span className="text-xs font-semibold text-ink">{label}</span>
          </button>
        ))}
      </div>
    </Modal>
  );
}