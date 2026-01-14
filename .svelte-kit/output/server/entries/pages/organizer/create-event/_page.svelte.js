import { b as attr_class, e as ensure_array_like, a as attr } from "../../../../chunks/index2.js";
import "sweetalert2";
import "@sveltejs/kit/internal";
import "../../../../chunks/exports.js";
import "../../../../chunks/utils.js";
import "@sveltejs/kit/internal/server";
import "../../../../chunks/state.svelte.js";
import "../../../../chunks/auth.js";
import { e as escape_html } from "../../../../chunks/context.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let events = [];
    let isMenuOpen = false;
    Array.from({ length: 31 }, (_, i) => (i + 1).toString());
    const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
    Array.from({ length: 10 }, (_, i) => (currentYear + i).toString());
    for (let i = 0; i < 24; i++) {
      i.toString().padStart(2, "0");
    }
    $$renderer2.push(`<div class="app-screen svelte-104isxs"><div class="glass-header svelte-104isxs">`);
    {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<h1 class="page-title svelte-104isxs">CREATE EVENT</h1> <button${attr_class("menu-burger svelte-104isxs", void 0, { "active": isMenuOpen })} aria-label="Toggle menu"><span class="line line-1 svelte-104isxs"></span> <span class="line line-2 svelte-104isxs"></span></button>`);
    }
    $$renderer2.push(`<!--]--></div> `);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <div class="scroll-container svelte-104isxs"><div class="content-wrapper svelte-104isxs">`);
    {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="event-list svelte-104isxs"><!--[-->`);
      const each_array = ensure_array_like(events);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let event = each_array[$$index];
        $$renderer2.push(`<div class="card svelte-104isxs"><div class="card-image svelte-104isxs"><img${attr("src", event.image)}${attr("alt", event.title)} class="svelte-104isxs"/></div> <div class="card-content svelte-104isxs"><div class="card-header-row svelte-104isxs"><h3 class="card-title svelte-104isxs">${escape_html(event.title)}</h3> <div class="participant-badge svelte-104isxs"><svg class="users-icon svelte-104isxs" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg> <span>${escape_html(event.currentParticipants)}/${escape_html(event.maxParticipants)}</span></div></div> <p class="card-desc svelte-104isxs">${escape_html(event.description)}</p> <div class="card-actions svelte-104isxs"><button class="action-btn edit-btn svelte-104isxs">EDIT</button> <button class="action-btn delete-btn svelte-104isxs">DELETE</button></div></div></div>`);
      }
      $$renderer2.push(`<!--]--></div> <button class="fab-btn svelte-104isxs" aria-label="Create Event"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg></button>`);
    }
    $$renderer2.push(`<!--]--></div></div></div>`);
  });
}
export {
  _page as default
};
