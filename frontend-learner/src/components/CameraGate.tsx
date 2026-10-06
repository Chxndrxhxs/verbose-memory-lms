import { useCallback, useState } from "react";
import { Camera, AlertCircle, ShieldCheck } from "@masterlms/shared";
import { enterFullscreen, exitFullscreen } from "../lib/fullscreen";
import { Button } from "./Button";
import { Notice } from "./Controls";

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
    // Hand-rolled, not <Modal>: this gate is non-dismissible by design, and the
    // shared Modal always renders a close control that would be a dead button.
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="camera-gate-title"
        className="w-full max-w-md border border-rule-strong bg-room-raised p-8 text-center shadow-xl"
      >
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center border border-rule bg-room-sunk">
          <Camera size={26} className="text-ink" aria-hidden />
        </div>
        <h2 id="camera-gate-title" className="text-base font-semibold text-ink">Camera Must Be On</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          This exam is proctored. You must allow camera access to continue — turn your camera ON and
          click below. Your live camera feed will be shown and monitored for the whole exam.
        </p>
        <p className="mt-2 text-xs font-semibold text-halt">
          You cannot start the exam without your camera.
        </p>

        {!secureContext && (
          <div className="mt-4 text-left">
            <Notice tone="warn">
              <span className="flex items-start gap-2">
                <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden />
                <span>{INSECURE_CONTEXT_ERROR}</span>
              </span>
            </Notice>
          </div>
        )}

        {error && (
          <div className="mt-4 text-left">
            <Notice tone="error" role="alert">
              <span className="flex items-start gap-2">
                <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden />
                <span>{error}</span>
              </span>
            </Notice>
          </div>
        )}

        <div className="mt-6">
          <Button
            variant="primary"
            size="lg"
            block
            onClick={requestCamera}
            disabled={status === "requesting" || !secureContext}
          >
            {status === "requesting" ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />
                Turning camera on…
              </>
            ) : (
              <>
                <ShieldCheck size={16} aria-hidden />
                Turn Camera On &amp; Start Exam
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}