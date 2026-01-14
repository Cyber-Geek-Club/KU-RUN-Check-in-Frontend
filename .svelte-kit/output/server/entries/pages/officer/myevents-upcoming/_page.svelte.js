import { b as attr_class, e as ensure_array_like, a as attr, c as attr_style, s as stringify } from "../../../../chunks/index2.js";
import { e as escape_html } from "../../../../chunks/context.js";
function _page($$renderer) {
  let filteredEvents;
  let activeTab = "upcoming";
  let events = [
    {
      id: 1,
      title: "KASETSART RUN OF HEALTH",
      date: "Sunday, January 14, 2024",
      time: "05:00 AM - 09:00 AM",
      location: "Kasetsart University, Sriracha",
      image: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=600&auto=format&fit=crop",
      pincode: "12345",
      status: "joined",
      type: "upcoming"
    },
    {
      id: 2,
      title: "KASETSART RUN OF HEALTH",
      date: "Sunday, January 14, 2024",
      time: "05:00 AM - 09:00 AM",
      location: "Kasetsart University, Sriracha",
      image: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=600&auto=format&fit=crop",
      pincode: "12345",
      status: "checked-in",
      type: "upcoming"
    },
    {
      id: 3,
      title: "KASETSART RUN OF HEALTH",
      date: "Sunday, January 14, 2024",
      time: "05:00 AM - 09:00 AM",
      location: "Kasetsart University, Sriracha",
      image: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=600&auto=format&fit=crop",
      pincode: "12345",
      status: "completed",
      type: "upcoming"
    },
    {
      id: 4,
      title: "KASETSART RUN OF HEALTH",
      date: "Sunday, January 14, 2024",
      time: "05:00 AM - 09:00 AM",
      location: "Kasetsart University, Sriracha",
      image: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=600&auto=format&fit=crop",
      pincode: "99999",
      status: "cancel",
      type: "history"
    },
    {
      id: 5,
      title: "KASETSART RUN OF HEALTH",
      date: "Sunday, January 14, 2024",
      time: "05:00 AM - 09:00 AM",
      location: "Kasetsart University, Sriracha",
      image: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=600&auto=format&fit=crop",
      pincode: "99999",
      status: "completed",
      type: "history"
    },
    {
      id: 6,
      title: "KASETSART RUN OF HEALTH",
      date: "Sunday, January 14, 2024",
      time: "05:00 AM - 09:00 AM",
      location: "Kasetsart University, Sriracha",
      image: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=600&auto=format&fit=crop",
      pincode: "99999",
      status: "completed",
      type: "history"
    }
  ];
  const getStatusStyle = (status) => {
    switch (status) {
      case "joined":
        return "background-color: #0066FF; color: white;";
      case "checked-in":
        return "background-color: #FFE600; color: black;";
      case "completed":
        return "background-color: #10B981; color: white;";
      case "cancel":
        return "background-color: #b4151d; color: white;";
      default:
        return "background-color: gray;";
    }
  };
  const getStatusText = (status) => {
    if (status === "joined") return "Joined";
    if (status === "checked-in") return "Checked-in";
    if (status === "completed") return "Completed";
    if (status === "cancel") return "Cancel";
    return status;
  };
  filteredEvents = events.filter((e) => e.type === activeTab);
  $$renderer.push(`<div class="app-screen svelte-61olve"><div class="glass-header svelte-61olve"><a href="/officer/event-list" class="back-btn svelte-61olve" aria-label="Back"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"></path></svg></a> <h1 class="page-title svelte-61olve">MY EVENTS</h1></div> <div class="pinned-tabs-wrapper svelte-61olve"><div class="tabs-bg svelte-61olve"><button${attr_class(`tab-btn ${stringify("active")}`, "svelte-61olve")}>Upcoming</button> <button${attr_class(`tab-btn ${stringify("")}`, "svelte-61olve")}>History</button></div></div> <div class="scroll-container svelte-61olve"><div class="content-wrapper svelte-61olve"><div class="event-list svelte-61olve"><!--[-->`);
  const each_array = ensure_array_like(filteredEvents);
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let event = each_array[$$index];
    $$renderer.push(`<div class="card svelte-61olve"><div class="card-image svelte-61olve"><img${attr("src", event.image)}${attr("alt", event.title)} class="svelte-61olve"/></div> <div class="card-content svelte-61olve"><h3 class="card-title svelte-61olve">${escape_html(event.title)}</h3> <div class="info-row svelte-61olve"><span class="icon svelte-61olve">📅</span> <span>Date: ${escape_html(event.date)}</span></div> <div class="info-row svelte-61olve"><span class="icon svelte-61olve">⏰</span> <span>Time: ${escape_html(event.time)}</span></div> <div class="info-row svelte-61olve"><span class="icon svelte-61olve">📍</span> <span>Location: ${escape_html(event.location)}</span></div> `);
    if (event.status !== "joined" && event.type !== "history") {
      $$renderer.push("<!--[-->");
      $$renderer.push(`<div class="info-row svelte-61olve"><span class="icon svelte-61olve">🔢</span> <span>Pin code: ${escape_html(event.pincode)}</span></div>`);
    } else {
      $$renderer.push("<!--[!-->");
    }
    $$renderer.push(`<!--]--> <div class="card-action svelte-61olve"><button class="status-btn svelte-61olve"${attr_style(getStatusStyle(event.status))}>${escape_html(getStatusText(event.status))}</button></div></div></div>`);
  }
  $$renderer.push(`<!--]--></div></div></div></div>`);
}
export {
  _page as default
};
