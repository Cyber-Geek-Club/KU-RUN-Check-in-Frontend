import { b as attr_class, e as ensure_array_like, c as attr_style, s as stringify } from "../../../../chunks/index2.js";
import { e as escape_html } from "../../../../chunks/context.js";
function _page($$renderer) {
  let participants = [
    {
      id: 1,
      name: "Test dee",
      progress: 3,
      total: 3,
      status: "completed"
    },
    {
      id: 2,
      name: "Test dee",
      progress: 1,
      total: 3,
      status: "in-progress"
    },
    {
      id: 3,
      name: "John Doe",
      progress: 2,
      total: 3,
      status: "in-progress"
    },
    {
      id: 4,
      name: "Sarah Smith",
      progress: 3,
      total: 3,
      status: "completed"
    },
    {
      id: 5,
      name: "Michael Jordan",
      progress: 1,
      total: 3,
      status: "in-progress"
    },
    {
      id: 6,
      name: "Lisa Black",
      progress: 3,
      total: 3,
      status: "completed"
    },
    {
      id: 7,
      name: "Tom Holland",
      progress: 0,
      total: 3,
      status: "in-progress"
    },
    {
      id: 8,
      name: "Jerry West",
      progress: 2,
      total: 3,
      status: "in-progress"
    },
    {
      id: 9,
      name: "Kobe Bryant",
      progress: 3,
      total: 3,
      status: "completed"
    }
  ];
  let currentMonth = "Choose";
  function getStatusStyle(status) {
    if (status === "completed") return "background-color: #10B981; color: white;";
    return "background-color: #D1D5DB; color: #374151;";
  }
  function getStatusText(status) {
    return status === "completed" ? "Completed" : "In Progress";
  }
  $$renderer.push(`<div class="app-screen svelte-1ti3toe"><div class="glass-header svelte-1ti3toe"><a href="/organizer/create-event" class="back-btn svelte-1ti3toe" aria-label="Back"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg></a> <h1 class="page-title svelte-1ti3toe">MONTHLY REWARD</h1></div> <div class="pinned-month-selector svelte-1ti3toe"><div class="month-selector-container svelte-1ti3toe"><button${attr_class(`month-btn ${stringify("")}`, "svelte-1ti3toe")}>${escape_html(currentMonth)} <svg${attr_class(`arrow-icon ${stringify("")}`, "svelte-1ti3toe")} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg></button> `);
  {
    $$renderer.push("<!--[!-->");
  }
  $$renderer.push(`<!--]--></div></div> <div class="scroll-container svelte-1ti3toe"><div class="content-wrapper svelte-1ti3toe"><div class="list-container svelte-1ti3toe"><!--[-->`);
  const each_array_1 = ensure_array_like(participants);
  for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
    let item = each_array_1[$$index_1];
    $$renderer.push(`<div class="card svelte-1ti3toe"><div class="card-info svelte-1ti3toe"><h3 class="card-name svelte-1ti3toe">Name: ${escape_html(item.name)}</h3> <p class="card-progress svelte-1ti3toe">Progress: ${escape_html(item.progress)}/${escape_html(item.total)}</p></div> <div class="card-action svelte-1ti3toe"><div class="status-badge svelte-1ti3toe"${attr_style(getStatusStyle(item.status))}>${escape_html(getStatusText(item.status))}</div></div></div>`);
  }
  $$renderer.push(`<!--]--></div></div></div></div>`);
}
export {
  _page as default
};
