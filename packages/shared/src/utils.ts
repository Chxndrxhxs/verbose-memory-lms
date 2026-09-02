import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { AlignLeft, FileText, HelpCircle, LinkIcon, Music, Video, type LucideIcon } from 'lucide-react';

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

