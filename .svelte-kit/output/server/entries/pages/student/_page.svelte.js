import { a as attr } from "../../../chunks/attributes.js";
import "@sveltejs/kit/internal";
import "../../../chunks/exports.js";
import "../../../chunks/utils.js";
import "@sveltejs/kit/internal/server";
import "../../../chunks/state.svelte.js";
import { R as ROUTES } from "../../../chunks/routes.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let backUrl = "/";
    {
      {
        backUrl = ROUTES.organizer.createEvent;
      }
    }
    $$renderer2.push(`<div class="app-screen svelte-uo0lw"><div class="glass-header svelte-uo0lw"><a aria-label="Back" class="back-btn svelte-uo0lw"${attr(
      "href",
      // Validate Basic Info
      backUrl
    )}><svg fill="none" height="24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="24"><line x1="19" x2="5" y1="12" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg></a></div> <div class="scroll-container svelte-uo0lw"><div class="content-wrapper svelte-uo0lw"><div class="form-card svelte-uo0lw"><div class="title-section svelte-uo0lw"><h1 class="main-title svelte-uo0lw">ACCOUNT SETTINGS</h1> <p class="sub-title svelte-uo0lw">Update your profile information.</p></div> `);
    {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div style="text-align: center; color: #9ca3af; padding: 40px;"><p>Loading...</p></div>`);
    }
    $$renderer2.push(`<!--]--></div></div></div></div>`);
  });
}
export {
  _page as default
};
