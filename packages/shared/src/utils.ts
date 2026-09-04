import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { AlignLeft, Award, Crown, Diamond as DiamondIcon, FileText, Gem, HelpCircle, LinkIcon, Medal, Music, Shield, Sparkles, Star, Trophy, Video, type LucideIcon } from 'lucide-react';

export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

export type LessonKind = 'video' | 'pdf' | 'quiz' | 'audio' | 'text' | 'link';

export const LESSON_KIND_BADGE: Record<LessonKind, { Icon: LucideIcon; badge: string }> = {
  video: { Icon: Video, badge: 'bg-[#3478ff] text-white' },
  pdf: { Icon: FileText, badge: 'bg-zinc-900 text-white' },
  quiz: { Icon: HelpCircle, badge: 'bg-yellow-400 text-zinc-900' },
  audio: { Icon: Music, badge: 'bg-violet-600 text-white' },
  text: { Icon: AlignLeft, badge: 'border bg-white text-zinc-700' },
  link: { Icon: LinkIcon, badge: 'bg-emerald-500 text-white' },
};

const IFRAME_SRC_RE = /<iframe[^>]*\bsrc=["']([^"']+)["']/i;

export const TIER_META: Record<string, { label: string; Icon: LucideIcon; color: string; bg: string; bar: string; ring: string }> = {
  Iron: { label: "Iron", Icon: Shield, color: "text-zinc-500", bg: "bg-zinc-100 text-zinc-600 ring-zinc-200", bar: "bg-zinc-400", ring: "ring-zinc-200" },
  Bronze: { label: "Bronze", Icon: Award, color: "text-amber-800", bg: "bg-amber-50 text-amber-800 ring-amber-200", bar: "bg-amber-700", ring: "ring-amber-200" },
  Silver: { label: "Silver", Icon: Medal, color: "text-zinc-500", bg: "bg-zinc-50 text-zinc-700 ring-zinc-200", bar: "bg-zinc-400", ring: "ring-zinc-200" },
  Gold: { label: "Gold", Icon: Star, color: "text-amber-700", bg: "bg-amber-50 text-amber-700 ring-amber-200", bar: "bg-gradient-to-r from-amber-400 to-yellow-500", ring: "ring-amber-200" },
  Platinum: { label: "Platinum", Icon: Gem, color: "text-cyan-700", bg: "bg-cyan-50 text-cyan-700 ring-cyan-200", bar: "bg-cyan-400", ring: "ring-cyan-200" },
  Diamond: { label: "Diamond", Icon: DiamondIcon, color: "text-sky-600", bg: "bg-sky-50 text-sky-700 ring-sky-200", bar: "bg-sky-500", ring: "ring-sky-200" },
  Ascendant: { label: "Ascendant", Icon: Sparkles, color: "text-emerald-600", bg: "bg-emerald-50 text-emerald-700 ring-emerald-200", bar: "bg-emerald-500", ring: "ring-emerald-200" },
  Immortal: { label: "Immortal", Icon: Crown, color: "text-red-600", bg: "bg-red-50 text-red-700 ring-red-200", bar: "bg-red-500", ring: "ring-red-200" },
  Radiant: { label: "Radiant", Icon: Trophy, color: "text-amber-600", bg: "bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-900 ring-amber-300", bar: "bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500", ring: "ring-amber-300" },
};

export function tierFromRR(rr: number): string {
  if (rr >= 980) return "Radiant";
  if (rr >= 930) return "Immortal";
  if (rr >= 850) return "Ascendant";
  if (rr >= 730) return "Diamond";
  if (rr >= 600) return "Platinum";
  if (rr >= 450) return "Gold";
  if (rr >= 300) return "Silver";
  if (rr >= 150) return "Bronze";
  return "Iron";
}

export function toEmbed(input: string | null | undefined): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  const iframeMatch = trimmed.match(IFRAME_SRC_RE);
  const url = iframeMatch ? iframeMatch[1] : trimmed;
  if (!url) return null;
  let u: URL;
  try { u = new URL(url); } catch { return null; }
  const host = u.hostname.replace(/^www\./, '');
  if (host === 'youtu.be') {
    const id = u.pathname.slice(1).split(/[/?]/)[0];
    return id ? `https://www.youtube.com/embed/${id}?rel=0` : null;
  }
  if (host === 'youtube.com') {
    if (u.pathname.startsWith('/embed/')) return `${url}${u.search ? '' : '?rel=0'}`;
    const v = u.searchParams.get('v');
    if (v) return `https://www.youtube.com/embed/${v}?rel=0`;
    const shorts = u.pathname.match(/^\/shorts\/([\w-]+)/);
    if (shorts) return `https://www.youtube.com/embed/${shorts[1]}?rel=0`;
    return null;
  }
  if (host === 'vimeo.com') {
    const id = u.pathname.split('/').filter(Boolean).pop();
    return id ? `https://player.vimeo.com/video/${id}` : null;
  }
  if (host === 'loom.com' && u.pathname.includes('/share/')) {
    return url.replace('/share/', '/embed/');
  }
  return null;
}
