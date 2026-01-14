import { e as ensure_array_like, b as attr_class, a as attr, s as stringify } from "../../../../chunks/index2.js";
import { e as escape_html } from "../../../../chunks/context.js";
function _page($$renderer) {
  let pins = ["", "", "", "", ""];
  let isVerifying = false;
  let errorIndex = null;
  $$renderer.push(`<div class="app-screen svelte-1dxqhxh"><div class="glass-header svelte-1dxqhxh"><a href="/organizer/create-event" class="back-btn svelte-1dxqhxh" aria-label="Back"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg></a> <h1 class="page-title svelte-1dxqhxh">VERIFY CODE</h1></div> <div class="scroll-container svelte-1dxqhxh"><div class="content-wrapper svelte-1dxqhxh"><div class="verify-card svelte-1dxqhxh"><div class="card-header-wrapper svelte-1dxqhxh"><h2 class="card-title svelte-1dxqhxh">Verify Participant</h2></div> <p class="card-desc svelte-1dxqhxh">Enter the participant's PIN code.</p> <div class="pin-section"><h3 class="input-label svelte-1dxqhxh">PIN CODE</h3> <div class="pin-inputs-wrapper svelte-1dxqhxh"><!--[-->`);
  const each_array = ensure_array_like(pins);
  for (let i = 0, $$length = each_array.length; i < $$length; i++) {
    each_array[i];
    $$renderer.push(`<input type="text" inputmode="numeric" maxlength="1"${attr_class(`pin-box ${stringify(errorIndex === i ? "error-border" : "")}`, "svelte-1dxqhxh")}${attr("value", pins[i])}/>`);
  }
  $$renderer.push(`<!--]--></div></div> `);
  {
    $$renderer.push("<!--[!-->");
  }
  $$renderer.push(`<!--]--> <button class="submit-btn svelte-1dxqhxh"${attr("disabled", isVerifying, true)}>${escape_html("VERIFY")}</button></div></div></div></div>`);
}
export {
  _page as default
};
