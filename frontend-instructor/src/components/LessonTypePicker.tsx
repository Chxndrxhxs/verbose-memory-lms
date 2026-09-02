import { AlignLeft, FileText, HelpCircle, LinkIcon, Music, Video, type LucideIcon } from "@masterlms/shared";
import type { LessonKind } from "../types/courseCreate";

const OPTIONS: { kind: LessonKind; label: string; Icon: LucideIcon; color: string }[] = [
  { kind: "video", label: "Video", Icon: Video, color: "bg-[#3478ff] text-white" },
  { kind: "pdf", label: "PDF", Icon: FileText, color: "bg-zinc-900 text-white" },
  { kind: "audio", label: "Audio", Icon: Music, color: "bg-violet-600 text-white" },
  { kind: "quiz", label: "Quiz", Icon: HelpCircle, color: "bg-yellow-400 text-zinc-900" },
  { kind: "text", label: "Text", Icon: AlignLeft, color: "bg-white border text-zinc-700" },
  { kind: "link", label: "Link", Icon: LinkIcon, color: "bg-emerald-500 text-white" },
];

type Props = {
  onSelect: (kind: LessonKind) => void;
  onClose: () => void;
};

export function LessonTypePicker({ onSelect, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-[20px] bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold tracking-tight">Add lesson</h3>
          <button onClick={onClose} className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900">✕</button>
        </div>
        <p className="mt-1 text-sm text-zinc-500">Choose the type of content for this lesson.</p>
        <div className="mt-5 grid grid-cols-3 gap-2">
          {OPTIONS.map(({ kind, label, Icon, color }) => (
            <button
              key={kind}
              onClick={() => onSelect(kind)}
              className="flex flex-col items-center gap-2 rounded-xl border border-zinc-200 py-4 transition-colors hover:border-[#3478ff] hover:bg-[#eef1ff]"
            >
              <span className={`flex h-9 w-9 items-center justify-center rounded-full text-sm ${color}`}>
                <Icon size={17} strokeWidth={2.5} />
              </span>
              <span className="text-xs font-semibold text-zinc-800">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}