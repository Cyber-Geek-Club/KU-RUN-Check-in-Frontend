import { b as attr_class, a as attr } from "../../../../chunks/index2.js";
import "@sveltejs/kit/internal";
import "../../../../chunks/exports.js";
import "../../../../chunks/utils.js";
import "@sveltejs/kit/internal/server";
import "../../../../chunks/state.svelte.js";
import { e as escape_html } from "../../../../chunks/context.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let fullName = "Somchai Officer";
    let email = "officer@ku.th";
    let password = "";
    let isDeptOpen = false;
    let errorField = "";
    $$renderer2.push(`<div class="app-screen svelte-1ysadx3"><div class="glass-header svelte-1ysadx3"><a href="/organizer/create-event" class="back-btn svelte-1ysadx3" aria-label="Back"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg></a></div> <div class="scroll-container svelte-1ysadx3"><div class="content-wrapper svelte-1ysadx3"><div class="form-card svelte-1ysadx3"><div class="title-section svelte-1ysadx3"><h1 class="main-title svelte-1ysadx3">ACCOUNT SETTINGS</h1> <p class="sub-title svelte-1ysadx3">Update your officer profile information.</p></div> <div class="form-section svelte-1ysadx3"><div class="form-group svelte-1ysadx3"><label class="label svelte-1ysadx3" for="fullname">Full Name</label> <div${attr_class("input-field svelte-1ysadx3", void 0, { "error-border": errorField === "fullname" })}><input id="fullname" type="text" placeholder="Enter your name"${attr("value", fullName)} class="svelte-1ysadx3"/></div></div> <div class="form-group svelte-1ysadx3"><label class="label svelte-1ysadx3" for="email">Email</label> <div${attr_class("input-field svelte-1ysadx3", void 0, { "error-border": errorField === "email" })}><input id="email" type="email" placeholder="Enter your email"${attr("value", email)} class="svelte-1ysadx3"/></div></div> <div class="form-group svelte-1ysadx3"><label class="label svelte-1ysadx3" for="dept-trigger">Department</label> <div class="custom-select-container svelte-1ysadx3"><button id="dept-trigger" type="button"${attr_class("select-trigger svelte-1ysadx3", void 0, {
      "placeholder": true,
      "active": isDeptOpen,
      "error-border": errorField === "department"
    })}><span>${escape_html("Select Department")}</span> <div${attr_class("arrow-icon svelte-1ysadx3", void 0, { "rotate": isDeptOpen })}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"></path></svg></div></button> `);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></div></div> <div class="form-group svelte-1ysadx3"><label class="label svelte-1ysadx3" for="password">Confirm Password</label> <div${attr_class("input-field svelte-1ysadx3", void 0, { "error-border": errorField === "password" })}><input id="password"${attr("type", "password")} placeholder="Enter your password"${attr("value", password)} class="svelte-1ysadx3"/> <button type="button" class="toggle-password svelte-1ysadx3">`);
    {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`);
    }
    $$renderer2.push(`<!--]--></button></div></div> `);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <button class="primary-btn svelte-1ysadx3" type="button">SAVE CHANGES</button></div></div></div></div></div>`);
  });
}
export {
  _page as default
};
