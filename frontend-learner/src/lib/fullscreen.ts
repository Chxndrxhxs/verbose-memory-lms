type FullscreenElement = HTMLElement & {
  requestFullscreen?: () => Promise<void>;
  webkitRequestFullscreen?: () => Promise<void>;
};

export function isFullscreenActive(): boolean {
  return Boolean(document.fullscreenElement);
}

export function enterFullscreen(): Promise<void> {
  const el = document.documentElement as FullscreenElement;
  if (el.requestFullscreen) return el.requestFullscreen().catch(() => undefined);
  if (el.webkitRequestFullscreen) return el.webkitRequestFullscreen().catch(() => undefined);
  return Promise.resolve();
}

export function exitFullscreen(): Promise<void> {
  if (!document.fullscreenElement) return Promise.resolve();
  return document.exitFullscreen().catch(() => undefined);
}