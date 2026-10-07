import { useEffect, useRef, type RefObject } from "react";

const key = (lessonId: number) => `lms:video-pos:${lessonId}`;

// Keeps the playback position of an uploaded (native) video. Provider
// iframes (YouTube, Vimeo, Loom) track their own history and are skipped.
export function useVideoResume(lessonId: number | undefined, videoRef: RefObject<HTMLVideoElement | null>) {
  const saveTimer = useRef(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || lessonId == null) return;

    const restore = () => {
      try {
        const saved = Number(localStorage.getItem(key(lessonId)));
        if (saved > 0 && saved < video.duration - 5) video.currentTime = saved;
      } catch { /* storage unavailable */ }
    };
    const persist = () => {
      window.clearTimeout(saveTimer.current);
      saveTimer.current = window.setTimeout(() => {
        try {
          localStorage.setItem(key(lessonId), String(Math.floor(video.currentTime)));
        } catch { /* storage unavailable */ }
      }, 1000);
    };

    video.addEventListener("loadedmetadata", restore);
    video.addEventListener("timeupdate", persist);
    video.addEventListener("pause", persist);
    video.addEventListener("ended", persist);
    return () => {
      video.removeEventListener("loadedmetadata", restore);
      video.removeEventListener("timeupdate", persist);
      video.removeEventListener("pause", persist);
      video.removeEventListener("ended", persist);
      window.clearTimeout(saveTimer.current);
    };
  }, [lessonId, videoRef]);
}
