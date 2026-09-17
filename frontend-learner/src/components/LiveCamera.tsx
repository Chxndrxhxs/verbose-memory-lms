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
      className="fixed bottom-4 right-4 z-40 w-44 overflow-hidden rounded-2xl border-2 border-red-500 bg-black shadow-2xl"
    >
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="aspect-[4/3] h-full w-full object-cover"
      />
      <div className="absolute left-2 top-2 flex items-center gap-1.5 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
        </span>
        <Camera size={10} />
        REC
      </div>
      <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Camera ON
      </div>
    </div>
  );
}