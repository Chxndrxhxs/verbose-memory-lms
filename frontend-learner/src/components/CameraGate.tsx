import { useCallback, useState } from "react";
import { Camera, AlertCircle, ShieldCheck } from "@masterlms/shared";
import { enterFullscreen, exitFullscreen } from "../lib/fullscreen";

type Props = {
  onApproved: (stream: MediaStream) => void;
  microphone?: boolean;
};

const INSECURE_CONTEXT_ERROR =
  "Your browser blocked camera access because this page is not on a secure (HTTPS) connection. Open the app over HTTPS, or via localhost, to start a proctored exam.";

export function CameraGate({ onApproved, microphone = false }: Props) {
  const [status, setStatus] = useState<"idle" | "requesting" | "denied">("idle");
  const [error, setError] = useState<string | null>(null);

  // getUserMedia only exists in a secure context. Reaching the app over plain
  // HTTP on a LAN IP (not localhost) leaves navigator.mediaDevices undefined and
  // every exam blocked, so surface that instead of the generic camera error.
  const secureContext = typeof window !== "undefined" && window.isSecureContext;

  const requestCamera = useCallback(async () => {
    if (!secureContext) {
      setStatus("denied");
      setError(INSECURE_CONTEXT_ERROR);
      return;
    }
    setStatus("requesting");
    setError(null);
    // Request fullscreen synchronously within the user click — browsers reject
    // requestFullscreen() once it follows an await (the gesture is consumed).
    enterFullscreen();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: microphone,
      });
      onApproved(stream);
    } catch (err) {
      // The camera was denied, so back out of the fullscreen we just entered.
      exitFullscreen();
      setStatus("denied");
      if (err instanceof DOMException) {
        if (err.name === "NotAllowedError") {
          setError(
            "Camera permission was denied. This exam requires your camera to be ON. Please allow camera access in your browser settings and try again — you cannot continue without it.",
          );
        } else if (err.name === "NotFoundError") {
          setError("No camera device found. Please connect a camera and try again.");
        } else if (err.name === "NotReadableError") {
          setError(
            "Your camera is already in use by another app. Close it and try again.",
          );
        } else {
          setError(`Camera error: ${err.message}`);
        }
      } else {
        setError("Unable to access camera. Please check your device settings.");
      }
    }
  }, [microphone, onApproved, secureContext]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-8 text-center shadow-2xl">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100">
          <Camera size={28} className="text-zinc-700" />
        </div>
        <h2 className="text-lg font-bold text-zinc-900">Camera Must Be On</h2>
        <p className="mt-2 text-sm text-zinc-500">
          This exam is proctored. You must allow camera access to continue — turn your camera ON and
          click below. Your live camera feed will be shown and monitored for the whole exam.
        </p>
        <p className="mt-2 text-xs font-semibold text-red-600">
          You cannot start the exam without your camera.
        </p>

        {!secureContext && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-left text-sm text-amber-800">
            <div className="flex items-start gap-2">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{INSECURE_CONTEXT_ERROR}</span>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-left text-sm text-red-700">
            <div className="flex items-start gap-2">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          </div>
        )}

        <div className="mt-6">
          <button
            onClick={requestCamera}
            disabled={status === "requesting" || !secureContext}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-60"
          >
            {status === "requesting" ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Turning camera on…
              </>
            ) : (
              <>
                <ShieldCheck size={16} />
                Turn Camera On &amp; Start Exam
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}