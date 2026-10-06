import { useEffect, useRef } from "react";
import { Camera } from "@masterlms/shared";

export function LiveCamera({ stream }: { stream: MediaStream }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div
      role="img"
      aria-label="Live camera feed — your camera is on"
      className="fixed bottom-4 right-4 z-40 w-44 overflow-hidden border border-halt bg-black shadow-xl"
    >
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="aspect-[4/3] h-full w-full object-cover"
      />
      <div className="absolute left-2 top-2 flex items-center gap-1.5 border border-halt/40 bg-room-deep/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-inverse">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-halt opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-halt" />
        </span>
        <Camera size={10} aria-hidden />
        REC
      </div>
      <div className="absolute bottom-2 left-2 flex items-center gap-1 border border-rule/20 bg-room-deep/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-inverse">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-live" aria-hidden />
        Camera ON
      </div>
    </div>
  );
}