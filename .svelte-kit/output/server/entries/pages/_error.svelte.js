import { V as store_get, W as head, X as unsubscribe_stores } from "../../chunks/index2.js";
import { p as page } from "../../chunks/stores.js";
import "@sveltejs/kit/internal";
import "../../chunks/exports.js";
import "../../chunks/utils.js";
import { e as escape_html } from "../../chunks/attributes.js";
import "@sveltejs/kit/internal/server";
import "../../chunks/state.svelte.js";
import "../../chunks/auth.js";
function _error($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let status, errorInfo, errorMessage;
    const errorMap = {
      400: {
        title: "Bad Request",
        defaultDesc: "The server could not understand the request due to invalid syntax.",
        icon: "⚠️"
      },
      401: {
        title: "Unauthorized",
        defaultDesc: "You must be logged in to access this page.",
        icon: "🔐"
      },
      403: {
        title: "Forbidden",
        defaultDesc: "You do not have permission to view this resource.",
        icon: "🚫"
      },
      404: {
        title: "Page Not Found",
        defaultDesc: "The page you are looking for does not exist.",
        icon: "🔍"
      },
      405: {
        title: "Method Not Allowed",
        defaultDesc: "The request method is not supported for this resource.",
        icon: "⛔"
      },
      408: {
        title: "Request Timeout",
        defaultDesc: "The server timed out waiting for the request.",
        icon: "⏱️"
      },
      429: {
        title: "Too Many Requests",
        defaultDesc: "You have sent too many requests in a given amount of time.",
        icon: "🚦"
      },
      500: {
        title: "Internal Server Error",
        defaultDesc: "The server encountered an internal error.",
        icon: "💥"
      },
      502: {
        title: "Bad Gateway",
        defaultDesc: "The server received an invalid response from the upstream server.",
        icon: "🌐"
      },
      503: {
        title: "Service Unavailable",
        defaultDesc: "The server is temporarily unable to handle the request.",
        icon: "🔧"
      },
      504: {
        title: "Gateway Timeout",
        defaultDesc: "The server did not receive a timely response from the upstream server.",
        icon: "⏰"
      }
    };
    status = store_get($$store_subs ??= {}, "$page", page).status;
    errorInfo = errorMap[status] || {
      title: "Something Went Wrong",
      defaultDesc: "An unexpected error occurred.",
      icon: "❌"
    };
    errorMessage = store_get($$store_subs ??= {}, "$page", page).error?.message || errorInfo.defaultDesc;
    head("1j96wlh", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>${escape_html(status)} | ${escape_html(errorInfo.title)}</title>`);
      });
    });
    $$renderer2.push(`<div class="error-wrapper svelte-1j96wlh"><div class="content-container svelte-1j96wlh"><div class="error-icon svelte-1j96wlh">${escape_html(errorInfo.icon)}</div> <h1 class="error-code svelte-1j96wlh">${escape_html(status)}</h1> <div class="message-section svelte-1j96wlh"><h2 class="error-title svelte-1j96wlh">${escape_html(errorInfo.title)}</h2> <p class="error-desc svelte-1j96wlh">${escape_html(errorMessage)}</p></div> <div class="action-section svelte-1j96wlh">`);
    if (status !== 401) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<button class="btn btn-back svelte-1j96wlh"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svelte-1j96wlh"><line x1="19" y1="12" x2="5" y2="12" class="svelte-1j96wlh"></line><polyline points="12 19 5 12 12 5" class="svelte-1j96wlh"></polyline></svg> <span class="svelte-1j96wlh">Go Back</span></button>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <button class="btn btn-home svelte-1j96wlh"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svelte-1j96wlh"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" class="svelte-1j96wlh"></path><polyline points="9 22 9 12 15 12 15 22" class="svelte-1j96wlh"></polyline></svg> <span class="svelte-1j96wlh">Go Home</span></button></div> `);
    if (status === 401) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<p class="redirect-notice svelte-1j96wlh">Redirecting to login...</p>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></div></div>`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
export {
  _error as default
};
