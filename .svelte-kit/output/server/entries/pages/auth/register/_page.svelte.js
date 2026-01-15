import { $ as attr_style, Y as attr_class, Z as stringify } from "../../../../chunks/index2.js";
import { g as goto } from "../../../../chunks/client.js";
import { o as onDestroy } from "../../../../chunks/index-server.js";
import { e as escape_html, a as attr } from "../../../../chunks/attributes.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let role = "student";
    let indicatorTransform;
    let firstName = "";
    let lastName = "";
    let email = "";
    let password = "";
    let nisitId = "";
    let isTitleOpen = false;
    let isFacultyOpen = false;
    let isMajorOpen = false;
    let loading = false;
    function handleStorageEvent(event) {
      if (event.key === "register_verified") {
        localStorage.removeItem("register_verified");
        goto();
      }
    }
    onDestroy(() => {
      if (typeof window !== "undefined") {
        window.removeEventListener("storage", handleStorageEvent);
      }
    });
    indicatorTransform = "0%";
    $$renderer2.push(`<div class="app-screen svelte-8bdjn9"><div class="glass-header svelte-8bdjn9">`);
    {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<a href="/" class="back-btn svelte-8bdjn9" aria-label="Back"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svelte-8bdjn9"><line x1="19" y1="12" x2="5" y2="12" class="svelte-8bdjn9"></line><polyline points="12 19 5 12 12 5" class="svelte-8bdjn9"></polyline></svg></a>`);
    }
    $$renderer2.push(`<!--]--> <h1 class="page-title svelte-8bdjn9">${escape_html("CREATE ACCOUNT")}</h1></div> <div class="scroll-container svelte-8bdjn9"><div class="content-wrapper svelte-8bdjn9"><div class="form-card svelte-8bdjn9">`);
    {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<div class="svelte-8bdjn9"><div class="role-switcher-container svelte-8bdjn9"><div class="segmented svelte-8bdjn9" role="tablist"><div class="indicator svelte-8bdjn9"${attr_style(`transform: translateX(${stringify(indicatorTransform)});`)}></div> <button type="button"${attr_class("option svelte-8bdjn9", void 0, { "active": role === "student" })}><span class="svelte-8bdjn9">Student</span></button> <button type="button"${attr_class("option svelte-8bdjn9", void 0, { "active": role === "officer" })}><span class="svelte-8bdjn9">Officer</span></button></div></div> <div class="form-section svelte-8bdjn9"><div class="row-group svelte-8bdjn9"><div class="form-group svelte-8bdjn9" style="flex: 0 0 100px;"><label class="label svelte-8bdjn9" for="title">Title</label> <div class="custom-select-container svelte-8bdjn9"><button type="button"${attr_class(`select-trigger ${stringify("")}`, "svelte-8bdjn9", { "placeholder": true, "active": isTitleOpen })}><span class="svelte-8bdjn9">${escape_html("Title")}</span> <div${attr_class("arrow-icon svelte-8bdjn9", void 0, { "rotate": isTitleOpen })}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="svelte-8bdjn9"><path d="M6 9l6 6 6-6" class="svelte-8bdjn9"></path></svg></div></button> `);
      {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></div></div> <div class="form-group svelte-8bdjn9" style="flex: 1;"><label class="label svelte-8bdjn9" for="firstName">First Name</label> <div${attr_class(`input-field ${stringify("")}`, "svelte-8bdjn9")}><input id="firstName" type="text" placeholder="First Name"${attr("value", firstName)} class="svelte-8bdjn9"/></div></div></div> <div class="form-group svelte-8bdjn9"><label class="label svelte-8bdjn9" for="lastName">Last Name</label> <div${attr_class(`input-field ${stringify("")}`, "svelte-8bdjn9")}><input id="lastName" type="text" placeholder="Last Name"${attr("value", lastName)} class="svelte-8bdjn9"/></div></div> <div class="form-group svelte-8bdjn9"><label class="label svelte-8bdjn9" for="email">Email</label> <div${attr_class(`input-field ${stringify("")}`, "svelte-8bdjn9")}><input id="email" type="email" placeholder="Enter your email"${attr("value", email)} class="svelte-8bdjn9"/></div></div> `);
      {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="svelte-8bdjn9"><div class="form-group svelte-8bdjn9"><label class="label svelte-8bdjn9" for="nisitId">Nisit ID</label> <div${attr_class(`input-field ${stringify("")}`, "svelte-8bdjn9")}><input type="text"${attr("value", nisitId)} placeholder="Nisit ID" maxlength="10" class="svelte-8bdjn9"/></div></div> <div class="form-group svelte-8bdjn9"><label class="label svelte-8bdjn9" for="faculty">Faculty</label> <div class="custom-select-container svelte-8bdjn9"><button type="button"${attr_class(`select-trigger ${stringify("")}`, "svelte-8bdjn9", { "placeholder": true, "active": isFacultyOpen })}><span class="svelte-8bdjn9">${escape_html("Select Faculty")}</span> <div${attr_class("arrow-icon svelte-8bdjn9", void 0, { "rotate": isFacultyOpen })}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="svelte-8bdjn9"><path d="M6 9l6 6 6-6" class="svelte-8bdjn9"></path></svg></div></button> `);
        {
          $$renderer2.push("<!--[!-->");
        }
        $$renderer2.push(`<!--]--></div></div> <div class="form-group svelte-8bdjn9"><label class="label svelte-8bdjn9" for="major">Major</label> <div${attr_class("custom-select-container svelte-8bdjn9", void 0, { "disabled": true })}><button type="button"${attr_class(`select-trigger ${stringify("")}`, "svelte-8bdjn9", { "placeholder": true, "active": isMajorOpen })}${attr("disabled", true, true)}><span class="svelte-8bdjn9">${escape_html("Select Major")}</span> <div${attr_class("arrow-icon svelte-8bdjn9", void 0, { "rotate": isMajorOpen })}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="svelte-8bdjn9"><path d="M6 9l6 6 6-6" class="svelte-8bdjn9"></path></svg></div></button> `);
        {
          $$renderer2.push("<!--[!-->");
        }
        $$renderer2.push(`<!--]--></div></div></div>`);
      }
      $$renderer2.push(`<!--]--> <div class="form-group svelte-8bdjn9"><label class="label svelte-8bdjn9" for="password">Password</label> <div${attr_class(`input-field ${stringify("")}`, "svelte-8bdjn9")}><input id="password"${attr("type", "password")} placeholder="Enter your password"${attr("value", password)} class="svelte-8bdjn9"/> <button type="button" class="toggle-password svelte-8bdjn9">`);
      {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push(`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="svelte-8bdjn9"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" class="svelte-8bdjn9"></path><line x1="1" y1="1" x2="23" y2="23" class="svelte-8bdjn9"></line></svg>`);
      }
      $$renderer2.push(`<!--]--></button></div></div> `);
      {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> <button class="primary-btn svelte-8bdjn9"${attr("disabled", loading, true)}>`);
      {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push(`SIGN UP`);
      }
      $$renderer2.push(`<!--]--></button></div></div>`);
    }
    $$renderer2.push(`<!--]--></div></div></div></div>`);
  });
}
export {
  _page as default
};
