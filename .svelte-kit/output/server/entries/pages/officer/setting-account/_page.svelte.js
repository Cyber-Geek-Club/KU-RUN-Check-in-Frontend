import { a as attr } from "../../../../chunks/attributes.js";
import "@sveltejs/kit/internal";
import "../../../../chunks/exports.js";
import "../../../../chunks/utils.js";
import "@sveltejs/kit/internal/server";
import "../../../../chunks/state.svelte.js";
import "sweetalert2";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let backUrl;
    backUrl = "/officer/event-list";
    $$renderer2.push(`<div class="app-container svelte-xxlfq4"><header class="header svelte-xxlfq4"><a${attr(
      "href",
      // Validate Basic Info
      // --- Logout ---
      // ✅ Clear ALL storage and cookies
      backUrl
    )} class="back-btn svelte-xxlfq4" aria-label="Back"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M19 12H5M12 19l-7-7 7-7"></path></svg></a> <h1 class="header-title svelte-xxlfq4">Settings</h1> <div style="width: 40px;"></div></header> <main class="main-content svelte-xxlfq4">`);
    {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="loading-state svelte-xxlfq4"><div class="loading-spinner svelte-xxlfq4"></div> <p>Loading your profile...</p></div>`);
    }
    $$renderer2.push(`<!--]--></main></div>`);
  });
}
export {
  _page as default
};
