import { a as attr, b as attr_class, s as stringify } from "../../../../chunks/index2.js";
import { g as goto } from "../../../../chunks/client.js";
import { o as onDestroy } from "../../../../chunks/index-server.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let email = "";
    let isLoading = false;
    function handleStorageEvent(event) {
      if (event.key === "password_reset_done") {
        goto();
        localStorage.removeItem("password_reset_done");
      }
    }
    onDestroy(() => {
      if (typeof window !== "undefined") {
        window.removeEventListener("storage", handleStorageEvent);
      }
    });
    $$renderer2.push(`<div class="app-screen svelte-c68gvn"><div class="glass-header svelte-c68gvn"><button class="back-btn svelte-c68gvn" aria-label="Back"${attr("disabled", isLoading, true)}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg></button></div> <div class="scroll-container svelte-c68gvn"><div class="content-wrapper svelte-c68gvn"><div class="form-card svelte-c68gvn">`);
    {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="title-section svelte-c68gvn"><h1 class="main-title svelte-c68gvn">FORGOT PASSWORD</h1> <p class="sub-title svelte-c68gvn">Enter your email to receive a reset link.</p></div> <div class="form-section svelte-c68gvn"><div class="form-group svelte-c68gvn"><label class="label svelte-c68gvn" for="email">Email</label> <div${attr_class(`input-field ${stringify("")}`, "svelte-c68gvn")}><input id="email" type="email" placeholder="Enter your email"${attr("value", email)}${attr("disabled", isLoading, true)} class="svelte-c68gvn"/></div></div> `);
      {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> <button class="primary-btn svelte-c68gvn"${attr("disabled", isLoading, true)}>`);
      {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push(`SEND LINK`);
      }
      $$renderer2.push(`<!--]--></button></div>`);
    }
    $$renderer2.push(`<!--]--></div></div></div></div>`);
  });
}
export {
  _page as default
};
