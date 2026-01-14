import { b as attr_class, e as ensure_array_like, c as attr_style, s as stringify } from "../../../../chunks/index2.js";
import "@sveltejs/kit/internal";
import "../../../../chunks/exports.js";
import "../../../../chunks/utils.js";
import { e as escape_html } from "../../../../chunks/context.js";
import "clsx";
import "@sveltejs/kit/internal/server";
import "../../../../chunks/state.svelte.js";
import "sweetalert2";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let isMenuOpen = false;
    let events = [
      {
        id: 1,
        title: "KASETSART RUN OF HEALTH",
        image: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=800&q=80",
        description: "Join us for the biggest charity run event of the year. Promote good health and support our community.",
        date: "Sunday, January 14, 2024",
        time: "05:00 AM - 09:00 AM",
        location: "Kasetsart University, Sriracha",
        participants: 0,
        maxParticipants: 100,
        isReadMore: false
      },
      {
        id: 2,
        title: "MUSIC FESTIVAL 2024",
        image: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=800&q=80",
        description: "Enjoy live music from top artists under the stars. Food trucks and fun activities included.",
        date: "Saturday, February 20, 2024",
        time: "04:00 PM - 11:00 PM",
        location: "City Park",
        participants: 45,
        maxParticipants: 200,
        isReadMore: false
      },
      {
        id: 3,
        title: "FOOD CARNIVAL 2024",
        image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80",
        description: "Taste the best local and international dishes from over 50 food stalls.",
        date: "Sunday, March 10, 2024",
        time: "10:00 AM - 10:00 PM",
        location: "Central Square",
        participants: 120,
        maxParticipants: 500,
        isReadMore: false
      }
    ];
    $$renderer2.push(`<div class="app-screen svelte-10685s1"><div class="glass-header svelte-10685s1"><div class="header-content svelte-10685s1"><h1 class="page-title svelte-10685s1">EVENT LIST</h1> <button${attr_class("menu-burger svelte-10685s1", void 0, { "active": isMenuOpen })} aria-label="Toggle menu"><span class="line line-1 svelte-10685s1"></span> <span class="line line-2 svelte-10685s1"></span></button></div></div> `);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <div class="scroll-container svelte-10685s1"><div class="content-wrapper svelte-10685s1"><!--[-->`);
    const each_array = ensure_array_like(events);
    for (let i = 0, $$length = each_array.length; i < $$length; i++) {
      let event = each_array[i];
      $$renderer2.push(`<div class="event-card svelte-10685s1"><div class="card-image svelte-10685s1"${attr_style(`background-image: url('${stringify(event.image)}');`)}><div class="participant-badge svelte-10685s1"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg> <span>${escape_html(event.participants)}/${escape_html(event.maxParticipants)}</span></div></div> <div class="card-body svelte-10685s1"><h3 class="event-title svelte-10685s1">${escape_html(event.title)}</h3> <p class="event-desc svelte-10685s1">${escape_html(event.description)}</p> `);
      if (event.isReadMore) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="event-details svelte-10685s1"><div class="detail-row svelte-10685s1"><span class="detail-icon svelte-10685s1">📅</span> ${escape_html(event.date)}</div> <div class="detail-row svelte-10685s1"><span class="detail-icon svelte-10685s1">⏰</span> ${escape_html(event.time)}</div> <div class="detail-row svelte-10685s1"><span class="detail-icon svelte-10685s1">📍</span> ${escape_html(event.location)}</div></div>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> <div class="card-footer svelte-10685s1"><button class="read-more-btn svelte-10685s1">${escape_html(event.isReadMore ? "Read less" : "Read more")}</button> <button class="register-btn svelte-10685s1">REGISTRATION</button></div></div></div>`);
    }
    $$renderer2.push(`<!--]--> <div style="height: 40px;"></div></div></div></div>`);
  });
}
export {
  _page as default
};
