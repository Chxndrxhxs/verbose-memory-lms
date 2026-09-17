import { useCallback, useEffect, useState } from "react";
import { enterFullscreen, exitFullscreen, isFullscreenActive } from "../lib/fullscreen";

export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(isFullscreenActive);

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(isFullscreenActive());
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const enter = useCallback(() => enterFullscreen(), []);
  const exit = useCallback(() => exitFullscreen(), []);

  return { isFullscreen, enter, exit };
}