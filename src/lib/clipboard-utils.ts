/**
 * Shared clipboard utility.
 *
 * Centralises the `navigator.clipboard.writeText` try/catch pattern that was
 * previously duplicated across `copyTechnicalDetails`, `copyStatsJson`, and
 * `copyManifest` in the recorder hook.
 */

/**
 * Copy text to the system clipboard via the async Clipboard API.
 *
 * @returns `true` on success, `false` if the Clipboard API is unavailable or
 * the write failed. Never throws — callers can `await` and branch on the
 * boolean without their own try/catch.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
      return false;
    }
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error("[copyToClipboard] Failed to write to clipboard:", err);
    return false;
  }
}
