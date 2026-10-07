// Minimal structural types for the YouTube IFrame API (keyless, no SDK package).
export type YTPlayer = {
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlayerState: () => number;
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
  destroy: () => void;
};
export type YTConfig = {
  videoId: string;
  playerVars?: Record<string, number | string>;
  events?: { onReady?: () => void; onStateChange?: (e: { data: number }) => void };
};
export type YTGlobal = { YT?: { Player: new (el: HTMLElement, config: YTConfig) => YTPlayer } };

export const YT_ENDED = 0;
export const YT_PLAYING = 1;
export const YT_PAUSED = 2;

let ytApi: Promise<NonNullable<YTGlobal["YT"]>> | null = null;

export function loadYT(): Promise<NonNullable<YTGlobal["YT"]>> {
  ytApi ??= new Promise((resolve, reject) => {
    const w = window as unknown as YTGlobal & { onYouTubeIframeAPIReady?: () => void };
    if (w.YT) { resolve(w.YT); return; }
    const prev = w.onYouTubeIframeAPIReady;
    w.onYouTubeIframeAPIReady = () => {
      prev?.();
      if (w.YT) resolve(w.YT);
    };
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    tag.async = true;
    tag.onerror = () => {
      ytApi = null;
      reject(new Error("YouTube IFrame API failed to load"));
    };
    document.head.appendChild(tag);
  });
  return ytApi;
}
