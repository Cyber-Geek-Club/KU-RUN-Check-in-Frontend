import { b as attr_class, e as ensure_array_like, a as attr, s as stringify } from "../../../../chunks/index2.js";
import { e as escape_html } from "../../../../chunks/context.js";
function _page($$renderer) {
  let isAllCompleted;
  const totalSteps = 3;
  let completedCount = 0;
  let currentMonth = "Choose";
  isAllCompleted = completedCount >= totalSteps;
  $$renderer.push(`<div class="app-screen svelte-wp581t"><div class="glass-header svelte-wp581t"><a href="/officer/event-list" class="back-btn svelte-wp581t" aria-label="Back"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"></path></svg></a> <h1 class="page-title svelte-wp581t">MONTHLY REWARD</h1></div> <div class="scroll-container svelte-wp581t"><div class="content-wrapper svelte-wp581t"><div class="month-selector-wrapper svelte-wp581t"><div class="month-selector-container svelte-wp581t"><button${attr_class(`month-btn ${stringify("")}`, "svelte-wp581t")}>${escape_html(currentMonth)} <svg${attr_class(`arrow-icon ${stringify("")}`, "svelte-wp581t")} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg></button> `);
  {
    $$renderer.push("<!--[!-->");
  }
  $$renderer.push(`<!--]--></div></div> <div class="reward-card svelte-wp581t"><h2 class="card-title svelte-wp581t">Monthly Challenges</h2> <div class="stepper-container svelte-wp581t"><!--[-->`);
  const each_array_1 = ensure_array_like(Array(totalSteps));
  for (let i = 0, $$length = each_array_1.length; i < $$length; i++) {
    each_array_1[i];
    const isDone = i < completedCount;
    const isLineActive = completedCount > i + 1;
    $$renderer.push(`<div class="step-wrapper svelte-wp581t">`);
    if (isDone) {
      $$renderer.push("<!--[-->");
      $$renderer.push(`<div class="step step-done svelte-wp581t"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></div>`);
    } else {
      $$renderer.push("<!--[!-->");
      $$renderer.push(`<div class="step step-locked svelte-wp581t"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg></div>`);
    }
    $$renderer.push(`<!--]--></div> `);
    if (i < totalSteps - 1) {
      $$renderer.push("<!--[-->");
      $$renderer.push(`<div${attr_class(`line ${stringify(isLineActive ? "line-active" : "")}`, "svelte-wp581t")}></div>`);
    } else {
      $$renderer.push("<!--[!-->");
    }
    $$renderer.push(`<!--]-->`);
  }
  $$renderer.push(`<!--]--></div> <div class="message-area svelte-wp581t">`);
  if (isAllCompleted) {
    $$renderer.push("<!--[-->");
    $$renderer.push(`<div><h3 class="congrats-text svelte-wp581t">CONGRATULATION!</h3> <h3 class="congrats-text svelte-wp581t">CHALLENGE COMPLETE!</h3> <p class="desc-text svelte-wp581t">You've earned your Monthly Runner Badge!</p> <div class="trophy-container svelte-wp581t"><span style="font-size: 80px; display: block;">🏆</span></div></div>`);
  } else {
    $$renderer.push("<!--[!-->");
    {
      $$renderer.push("<!--[-->");
      $$renderer.push(`<h3 class="status-title locked" style="color:#9CA3AF; font-weight:700;">LOCKED</h3> <p class="desc-text svelte-wp581t">Join events to start unlocking your rewards.<br/>The journey
              begins with a single step!</p>`);
    }
    $$renderer.push(`<!--]-->`);
  }
  $$renderer.push(`<!--]--> <p class="progress-text svelte-wp581t">${escape_html(completedCount)}/3 completed</p></div></div> <div class="test-controls svelte-wp581t"><p>Test Animation (Completed: ${escape_html(completedCount)})</p> <div style="display: flex; gap: 10px; justify-content: center;"><button class="test-btn svelte-wp581t"${attr("disabled", completedCount === 0, true)}>Reset</button> <button class="test-btn complete svelte-wp581t"${attr("disabled", completedCount === totalSteps, true)}>Complete Next</button></div></div></div></div></div>`);
}
export {
  _page as default
};
