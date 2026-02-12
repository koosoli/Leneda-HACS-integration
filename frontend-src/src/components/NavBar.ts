/**
 * NavBar — Tab navigation bar component.
 */
import type { Tab } from "./App";

export function renderNavBar(
  activeTab: Tab,
  _onTabChange: (tab: Tab) => void,
  isMenuOpen = false
): string {
  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "dashboard", label: "Dashboard", icon: "🏠" },
    { id: "sensors", label: "Sensors", icon: "📊" },
    { id: "invoice", label: "Invoice", icon: "💰" },
    { id: "settings", label: "Settings", icon: "⚙️" },
  ];

  return `
    <header class="navbar" role="navigation" aria-label="Main navigation">
      <div class="navbar-brand">
        <img src="${import.meta.env.BASE_URL}logo.png" srcset="${import.meta.env.BASE_URL}logo@2x.png 2x" alt="Leneda Logo" class="navbar-logo-img" />
 
        <button class="menu-toggle ${isMenuOpen ? "open" : ""}" aria-label="Toggle menu" aria-expanded="${isMenuOpen}">
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      <nav class="navbar-tabs ${isMenuOpen ? "mobile-open" : ""}" role="tablist">
        ${tabs
      .map(
        (t) => `
          <button
            class="nav-btn ${t.id === activeTab ? "active" : ""}"
            data-tab="${t.id}"
            role="tab"
            aria-selected="${t.id === activeTab}"
            aria-controls="panel-${t.id}"
          >
            <span class="nav-icon" aria-hidden="true">${t.icon}</span>
            <span class="nav-label">${t.label}</span>
          </button>
        `
      )
      .join("")}

        <div style="margin-left: auto; display: flex; gap: 10px; align-items: center; padding-right: 4px;">
             <!-- Buy Me A Coffee (Sleek Redesign) -->
            <a href="https://buymeacoffee.com/koosoli" target="_blank" rel="noopener noreferrer" 
               style="display: flex; align-items: center; gap: 8px; background: linear-gradient(135deg, #FFDD00 0%, #FBB034 100%); color: #000; padding: 6px 16px; border-radius: 12px; font-weight: 800; font-size: 13px; text-decoration: none; box-shadow: 0 4px 15px rgba(251, 176, 52, 0.3); transition: all 0.3s ease; border: 1px solid rgba(255,255,255,0.2);">
              <svg style="width: 16px; height: 16px;" viewBox="0 0 24 24" fill="currentColor"><path d="M20,3H4v10c0,2.21,1.79,4,4,4h6c2.21,0,4-1.79,4-4v-3h2c1.1,0,2-0.9,2-2V5C22,3.9,21.1,3,20,3z M20,8h-2V5h2V8z M18,15H4v-1h14V15z M18,12H4V5h14V12z"/></svg>
              <span>Support Project</span>
            </a>

            <!-- GitHub (Subtle & Integrated) -->
            <a href="https://github.com/koosoli/Leneda-HACS-integration" target="_blank" rel="noopener noreferrer"
               style="display: flex; align-items: center; justify-content: center; width: 34px; height: 34px; background: rgba(255,255,255,0.05); color: var(--clr-text); border-radius: 8px; border: 1px solid var(--clr-border); transition: all 0.2s;"
               title="View Project on GitHub">
              <svg style="width: 18px; height: 18px;" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
            </a>
        </div>
      </nav>
    </header>
  `;
}
