import { b as attr_class, a as attr, d as clsx, s as stringify } from "../../../../chunks/index2.js";
import { o as onDestroy } from "../../../../chunks/index-server.js";
import "@sveltejs/kit/internal";
import "../../../../chunks/exports.js";
import "../../../../chunks/utils.js";
import "@sveltejs/kit/internal/server";
import "../../../../chunks/state.svelte.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let isLoading = false;
    let password = "";
    let confirmPassword = "";
    onDestroy(() => {
    });
    $$renderer2.push(`<div class="app-screen svelte-654myr"><div class="scroll-container svelte-654myr"><div class="content-wrapper svelte-654myr"><div${attr_class(clsx("form-card"), "svelte-654myr")}>`);
    {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="title-section svelte-654myr"><h1 class="main-title svelte-654myr">SET NEW PASSWORD</h1> <p class="sub-title svelte-654myr">Create a new password. Ensure it differs from previous ones.</p></div> <div class="form-section svelte-654myr"><form><div class="form-group svelte-654myr"><label class="label svelte-654myr" for="new-password">New Password</label> <div${attr_class(`input-field ${stringify("")}`, "svelte-654myr")}><input id="new-password"${attr("type", "password")} placeholder="Enter new password"${attr("value", password)}${attr("disabled", isLoading, true)} class="svelte-654myr"/> <button type="button" class="toggle-password svelte-654myr" tabindex="-1">`);
      {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push(`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`);
      }
      $$renderer2.push(`<!--]--></button></div></div> <div class="form-group svelte-654myr"><label class="label svelte-654myr" for="confirm-password">Confirm Password</label> <div${attr_class(`input-field ${stringify("")}`, "svelte-654myr")}><input id="confirm-password"${attr("type", "password")} placeholder="Confirm new password"${attr("value", confirmPassword)}${attr("disabled", isLoading, true)} class="svelte-654myr"/> <button type="button" class="toggle-password svelte-654myr" tabindex="-1">`);
      {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push(`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`);
      }
      $$renderer2.push(`<!--]--></button></div></div> `);
      {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> <button class="primary-btn svelte-654myr" type="submit"${attr("disabled", isLoading, true)}>`);
      {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push(`RESET PASSWORD`);
      }
      $$renderer2.push(`<!--]--></button></form></div>`);
    }
    $$renderer2.push(`<!--]--></div></div></div></div>`);
  });
}
export {
  _page as default
};
