import { useEffect, useRef, type RefObject } from "react";
import { loadYT, YT_ENDED, YT_PAUSED, YT_PLAYING, type YTPlayer } from "../lib/youtube";

const key = (lessonId: number) => `lms:video-pos:${lessonId}`;

// Renders a YouTube lesson through the IFrame API and keeps its playback
// position in the same `lms:video-pos:{lessonId}` key the native video
// player uses, so resume works whichever player a lesson lands on.
export function useYouTubeResume(
  videoId: string | null,
  lessonId: number | undefined,
  containerRef: RefObject<HTMLDivElement | null>,
) {
  const saveTimer = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !videoId || lessonId == null) return;

    let player: YTPlayer | null = null;
    let poll = 0;
    let disposed = false;

    const persist = () => {
      window.clearTimeout(saveTimer.current);
      saveTimer.current = window.setTimeout(() => {
        if (!player || disposed) return;
        try {
          localStorage.setItem(key(lessonId), String(Math.floor(player.getCurrentTime())));
        } catch { /* storage unavailable */ }
      }, 500);
    };

    loadYT().then((YT) => {
      if (disposed || !container.isConnected) return;
      let startAt = 0;
      try {
        const saved = Number(localStorage.getItem(key(lessonId)));
        if (saved > 0) startAt = Math.floor(saved);
      } catch { /* storage unavailable */ }
      player = new YT.Player(container, {
        videoId,
        playerVars: { rel: 0, modestbranding: 1, start: startAt },
        events: {
          onReady: () => {
            if (!player) return;
            const duration = player.getDuration();
            if (startAt > 0 && duration > 0 && startAt >= duration - 5) player.seekTo(0);
          },
          onStateChange: (e) => {
            if (e.data === YT_PLAYING) {
              window.clearInterval(poll);
              poll = window.setInterval(persist, 5000);
            } else if (e.data === YT_PAUSED || e.data === YT_ENDED) {
              window.clearInterval(poll);
              persist();
            }
          },
        },
      });
    }).catch(() => { /* YouTube API unavailable — the slot stays empty */ });

    return () => {
      disposed = true;
      window.clearInterval(poll);
      window.clearTimeout(saveTimer.current);
      player?.destroy();
      player = null;
    };
  }, [videoId, lessonId, containerRef]);
}
