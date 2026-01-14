import { h as head } from "../../chunks/index2.js";
import "@sveltejs/kit/internal";
import "../../chunks/exports.js";
import "../../chunks/utils.js";
import "clsx";
import "@sveltejs/kit/internal/server";
import "../../chunks/state.svelte.js";
function _page($$renderer) {
  head("1uha8ag", $$renderer, ($$renderer2) => {
    $$renderer2.title(($$renderer3) => {
      $$renderer3.push(`<title>KU-RUN-CHECK-IN</title>`);
    });
  });
  $$renderer.push(`<div class="mobile-wrapper svelte-1uha8ag"><div class="content-container svelte-1uha8ag"><div class="logo-section svelte-1uha8ag"><img src="/logo-ku.png" alt="KU Logo" style="width: 250px;"/></div> <div class="title-section svelte-1uha8ag"><h1 class="svelte-1uha8ag">KASETSART<br/>RUN - CHECKIN</h1> <p class="subtitle svelte-1uha8ag">Gather KU runners, build good health, and achieve success together!</p></div> <div class="action-section svelte-1uha8ag"><a href="/auth/login" class="btn btn-login svelte-1uha8ag">LOGIN NOW</a> <a href="/auth/register" class="btn btn-signup svelte-1uha8ag">SIGN UP</a></div></div></div>`);
}
export {
  _page as default
};
