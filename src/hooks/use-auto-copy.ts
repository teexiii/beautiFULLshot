// useAutoCopy - Automatically copy the beautified result to the clipboard
// whenever a NEW image is loaded (screenshot capture, drag-drop, or paste).
//
// Design: subscribes to canvas-store `imageLoadNonce` (the single signal bumped
// only by setImageFromBytes). The copy is deferred so the Konva stage can paint
// the new image + background before we export it. Gated by the
// `autoCopyOnCapture` setting. The copy runs in silent mode so it does not spam
// a "Copied!" toast on every capture (manual Cmd/Ctrl+C stays loud).

import { useEffect, useRef } from 'react';
import { useCanvasStore } from '../stores/canvas-store';
import { useSettingsStore } from '../stores/settings-store';
import { useExport } from './use-export';

// Delay before copying, giving the stage time to render the new image.
// fitToView() already runs at ~50ms after load; copy a little after that.
const AUTO_COPY_DELAY_MS = 200;

export function useAutoCopy(): void {
  const imageLoadNonce = useCanvasStore((s) => s.imageLoadNonce);
  const autoCopyOnCapture = useSettingsStore((s) => s.autoCopyOnCapture);
  const { copyToClipboard } = useExport();

  // Hold latest values in refs so the effect depends ONLY on the nonce.
  // This prevents copyToClipboard's changing identity from re-running (and
  // cancelling) the scheduled copy, and prevents toggling the setting from
  // triggering a copy on its own.
  const copyRef = useRef(copyToClipboard);
  copyRef.current = copyToClipboard;
  const enabledRef = useRef(autoCopyOnCapture);
  enabledRef.current = autoCopyOnCapture;

  // Skip the initial mount (nonce starts at 0, no image loaded yet).
  const isFirstRun = useRef(true);

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    if (!enabledRef.current) return;

    const timer = setTimeout(() => {
      copyRef.current({ silent: true });
    }, AUTO_COPY_DELAY_MS);

    return () => clearTimeout(timer);
  }, [imageLoadNonce]);
}
