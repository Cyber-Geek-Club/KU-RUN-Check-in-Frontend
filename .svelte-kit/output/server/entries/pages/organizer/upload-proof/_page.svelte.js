import { e as ensure_array_like, a as attr } from "../../../../chunks/index2.js";
import "sweetalert2";
import { e as escape_html } from "../../../../chunks/context.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let submissions = [
      {
        id: 1,
        runnerName: "Test One",
        submitTime: "09:20",
        proofImage: "https://images.unsplash.com/photo-1557166983-5939644443a0?auto=format&fit=crop&w=800&q=80"
      },
      {
        id: 2,
        runnerName: "Sarah Runner",
        submitTime: "10:45",
        proofImage: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=800&q=80"
      },
      {
        id: 3,
        runnerName: "John Doe",
        submitTime: "11:30",
        proofImage: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=800&q=80"
      },
      {
        id: 4,
        runnerName: "Michael Smith",
        submitTime: "12:15",
        proofImage: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=800&q=80"
      },
      {
        id: 5,
        runnerName: "Anna Bell",
        submitTime: "13:00",
        proofImage: "https://images.unsplash.com/photo-1485217988980-11786ced9454?auto=format&fit=crop&w=800&q=80"
      }
    ];
    $$renderer2.push(`<div class="app-screen svelte-kxbgtl"><div class="glass-header svelte-kxbgtl"><a href="/organizer/create-event" class="back-btn svelte-kxbgtl" aria-label="Back"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"></path></svg></a> <div class="header-inner svelte-kxbgtl"><h1 class="page-title svelte-kxbgtl">VERIFY PROOF</h1></div></div> <div class="scroll-container svelte-kxbgtl"><div class="content-wrapper svelte-kxbgtl">`);
    if (submissions.length === 0) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="empty-state svelte-kxbgtl"><p>No pending submissions.</p></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<!--[-->`);
      const each_array = ensure_array_like(submissions);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let item = each_array[$$index];
        $$renderer2.push(`<div class="verify-card svelte-kxbgtl"><div class="card-header"><h2 class="card-heading svelte-kxbgtl">Verify Submission</h2></div> <div class="info-section svelte-kxbgtl"><div class="info-row"><span class="info-label svelte-kxbgtl">Runner:</span> <span class="info-value">${escape_html(item.runnerName)}</span></div> <div class="info-row"><span class="info-label svelte-kxbgtl">Time:</span> <span class="info-value">${escape_html(item.submitTime)}</span></div></div> <div class="image-container svelte-kxbgtl"><img${attr("src", item.proofImage)} alt="Proof" class="proof-img svelte-kxbgtl"/></div> <div class="action-buttons svelte-kxbgtl"><button class="btn btn-reject svelte-kxbgtl">REJECT</button> <button class="btn btn-confirm svelte-kxbgtl">CONFIRM</button></div></div>`);
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]--></div></div></div>`);
  });
}
export {
  _page as default
};
