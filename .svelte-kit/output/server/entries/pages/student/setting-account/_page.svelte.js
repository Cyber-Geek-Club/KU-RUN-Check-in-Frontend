import { b as attr_class, a as attr } from "../../../../chunks/index2.js";
import "@sveltejs/kit/internal";
import "../../../../chunks/exports.js";
import "../../../../chunks/utils.js";
import "@sveltejs/kit/internal/server";
import "../../../../chunks/state.svelte.js";
import { e as escape_html } from "../../../../chunks/context.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let fullName = "Somchai Nisit";
    let nisitId = "64xxxxxxxx";
    let email = "somchai.n@ku.th";
    let password = "";
    let isFacultyOpen = false;
    let isMajorOpen = false;
    let errorField = "";
    const majorData = {
      management: [
        { id: "mgt", name: "Management" },
        { id: "fin", name: "Finance" },
        { id: "ib", name: "International Business" },
        { id: "acc", name: "Accounting" }
      ],
      engineering: [
        { id: "cpe", name: "Computer Engineering" },
        { id: "me", name: "Mechanical Engineering" },
        { id: "ie", name: "Industrial Engineering" },
        { id: "ee", name: "Electrical Engineering" }
      ],
      science: [
        { id: "cs", name: "Computer Science" },
        { id: "it", name: "Information Technology" }
      ],
      economics: [{ id: "econ", name: "Economics" }],
      maritime: [{ id: "ns", name: "Nautical Science" }]
    };
    {
      {
        Object.values(majorData).flat();
      }
    }
    $$renderer2.push(`<div class="app-screen svelte-4akkl9"><div class="glass-header svelte-4akkl9"><a href="/student/event-list" class="back-btn svelte-4akkl9" aria-label="Back"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg></a></div> <div class="scroll-container svelte-4akkl9"><div class="content-wrapper svelte-4akkl9"><div class="form-card svelte-4akkl9"><div class="title-section svelte-4akkl9"><h1 class="main-title svelte-4akkl9">ACCOUNT SETTINGS</h1> <p class="sub-title svelte-4akkl9">Update your student profile information.</p></div> <div class="form-section svelte-4akkl9"><div class="form-group svelte-4akkl9"><label class="label svelte-4akkl9" for="fullname">Full Name</label> <div${attr_class("input-field svelte-4akkl9", void 0, { "error-border": errorField === "fullname" })}><input id="fullname" type="text" placeholder="Enter your name"${attr("value", fullName)} class="svelte-4akkl9"/></div></div> <div class="form-group svelte-4akkl9"><label class="label svelte-4akkl9" for="nisitId">Nisit ID</label> <div${attr_class("input-field svelte-4akkl9", void 0, { "error-border": errorField === "nisitId" })}><input id="nisitId" type="text" placeholder="Enter your ID"${attr("value", nisitId)} class="svelte-4akkl9"/></div></div> <div class="form-group svelte-4akkl9"><label class="label svelte-4akkl9" for="email">Email</label> <div${attr_class("input-field svelte-4akkl9", void 0, { "error-border": errorField === "email" })}><input id="email" type="email" placeholder="Enter your email"${attr("value", email)} class="svelte-4akkl9"/></div></div> <div class="form-group svelte-4akkl9"><label class="label svelte-4akkl9" for="faculty-trigger">Faculty</label> <div class="custom-select-container svelte-4akkl9"><button id="faculty-trigger" type="button"${attr_class("select-trigger svelte-4akkl9", void 0, {
      "placeholder": true,
      "active": isFacultyOpen,
      "error-border": errorField === "faculty"
    })}><span>${escape_html("Select Faculty")}</span> <div${attr_class("arrow-icon svelte-4akkl9", void 0, { "rotate": isFacultyOpen })}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"></path></svg></div></button> `);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></div></div> <div class="form-group svelte-4akkl9"><label class="label svelte-4akkl9" for="major-trigger">Major</label> <div class="custom-select-container svelte-4akkl9"><button id="major-trigger" type="button"${attr_class("select-trigger svelte-4akkl9", void 0, {
      "placeholder": true,
      "active": isMajorOpen,
      "error-border": errorField === "major"
    })}><span>${escape_html("Select Major")}</span> <div${attr_class("arrow-icon svelte-4akkl9", void 0, { "rotate": isMajorOpen })}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"></path></svg></div></button> `);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></div></div> <div class="form-group svelte-4akkl9"><label class="label svelte-4akkl9" for="password">Confirm Password</label> <div${attr_class("input-field svelte-4akkl9", void 0, { "error-border": errorField === "password" })}><input id="password"${attr("type", "password")} placeholder="Enter your password"${attr("value", password)} class="svelte-4akkl9"/> <button type="button" class="toggle-password svelte-4akkl9">`);
    {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`);
    }
    $$renderer2.push(`<!--]--></button></div></div> `);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <button class="primary-btn svelte-4akkl9" type="button">SAVE CHANGES</button></div></div></div></div></div>`);
  });
}
export {
  _page as default
};
