import { Y as attr_class, Z as stringify } from "../../../../chunks/index2.js";
import "@sveltejs/kit/internal";
import "../../../../chunks/exports.js";
import "../../../../chunks/utils.js";
import { a as attr, e as escape_html } from "../../../../chunks/attributes.js";
import "@sveltejs/kit/internal/server";
import "../../../../chunks/state.svelte.js";
import "../../../../chunks/auth.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let email = "";
    let password = "";
    let isSubmitting = false;
    $$renderer2.push(`<div class="app-screen svelte-1i2smtp"><div class="scroll-container svelte-1i2smtp"><div class="content-wrapper svelte-1i2smtp"><div class="login-card svelte-1i2smtp"><div class="title-section svelte-1i2smtp"><h1 class="main-title svelte-1i2smtp">NISIT<br/>LOGIN TO ACCOUNT</h1> <p class="sub-title svelte-1i2smtp">Welcome back! Please enter your details.</p></div> <form class="form-section svelte-1i2smtp"><div class="form-group svelte-1i2smtp"><label class="label svelte-1i2smtp" for="email">Email</label> <div${attr_class(`input-field ${stringify("")}`, "svelte-1i2smtp")}><input id="email" type="email" placeholder="Enter your email"${attr("value", email)} class="svelte-1i2smtp"/></div></div> <div class="form-group svelte-1i2smtp"><div class="password-header svelte-1i2smtp"><label class="label svelte-1i2smtp" for="password">Password</label> <a href="/auth/forgot-password" class="forgot-link svelte-1i2smtp">Forgot ?</a></div> <div${attr_class(`input-field password-field ${stringify("")}`, "svelte-1i2smtp")}><input id="password"${attr("type", "password")} placeholder="Enter your password"${attr("value", password)} class="svelte-1i2smtp"/> <button type="button" class="toggle-password svelte-1i2smtp" aria-label="Toggle Password Visibility">`);
    {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`);
    }
    $$renderer2.push(`<!--]--></button></div></div> `);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <button class="login-button svelte-1i2smtp" type="submit"${attr("disabled", isSubmitting, true)}>${escape_html("LOGIN NOW")}</button> <div class="signup-section svelte-1i2smtp"><span class="signup-text svelte-1i2smtp">Don't have an account?</span> <a href="/auth/register" class="signup-link svelte-1i2smtp">Sign up</a></div></form></div></div></div></div>`);
  });
}
export {
  _page as default
};
