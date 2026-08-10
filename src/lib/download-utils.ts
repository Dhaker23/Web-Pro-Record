/**
 * Shared download utilities.
 *
 * The codebase previously inlined the create-anchor → click → cleanup dance
 * in every recorder action (downloadVideo, downloadSnapshot, downloadClip,
 * downloadHistoryEntry, downloadStatsJson, downloadManifest, …). These two
 * helpers centralise that logic so callers only need to provide a payload +
 * filename.
 */

/**
 * Trigger a browser download of a `Blob` by creating a temporary object URL
 * and an anchor element, clicking it, then revoking the URL and removing the
 * anchor. Safe to call from client-side code only.
 *
 * Errors are caught and logged via `console.error` so a failed download never
 * throws into UI event handlers.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  let url: string | null = null;
  let anchor: HTMLAnchorElement | null = null;
  try {
    url = URL.createObjectURL(blob);
    anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
  } catch (err) {
    console.error(`[downloadBlob] Failed to download "${filename}":`, err);
  } finally {
    if (anchor && anchor.parentNode) {
      anchor.parentNode.removeChild(anchor);
    }
    if (url) {
      URL.revokeObjectURL(url);
    }
  }
}

/**
 * Trigger a browser download from a data URL (e.g. a PNG snapshot captured
 * via `canvas.toDataURL()`). Uses the data URL directly as the anchor's
 * `href`, so no object URL needs to be created or revoked.
 *
 * Errors are caught and logged via `console.error` so a failed download never
 * throws into UI event handlers.
 */
export function downloadDataUrl(dataUrl: string, filename: string): void {
  let anchor: HTMLAnchorElement | null = null;
  try {
    anchor = document.createElement("a");
    anchor.href = dataUrl;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
  } catch (err) {
    console.error(`[downloadDataUrl] Failed to download "${filename}":`, err);
  } finally {
    if (anchor && anchor.parentNode) {
      anchor.parentNode.removeChild(anchor);
    }
  }
}
