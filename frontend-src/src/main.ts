/**
 * Leneda Dashboard — Main entry point.
 *
 * Bootstraps the SPA, detects iframe context, and mounts the app.
 */
import { LenedaApp } from "./components/App";
import "./styles/variables.css";
import "./styles/layout.css";
import "./styles/components.css";

// ── Dev mode detection ──────────────────────────────────────────
const isDev = import.meta.env.DEV; // true when running `npm run dev`

// ── Iframe detection (production only) ──────────────────────────
// If the user pressed F5 while on the iframe URL, the browser navigates
// directly to /leneda-panel/index.html (outside the HA shell).
// Redirect them back to the HA sidebar panel path so the HA chrome reloads.
// In dev mode, we're NOT inside an iframe, so skip this redirect entirely.
if (
  !isDev &&
  window.self === window.top &&
  window.location.pathname.startsWith("/leneda-panel/")
) {
  window.location.href = "/leneda";
} else {
  // Normal boot (inside iframe OR dev server)
  const root = document.getElementById("app");
  if (root) {
    const app = new LenedaApp(root);
    app.mount();
  }
}
