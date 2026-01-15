import { Y as attr_class } from "../../../../chunks/index2.js";
import { e as escape_html } from "../../../../chunks/attributes.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let lang = "th";
    const t = {
      th: {
        title: "รางวัลรายเดือน",
        loading: "กำลังโหลดข้อมูล...",
        noData: "ไม่พบข้อมูล Leaderboard",
        selectEvent: "เลือกกิจกรรม",
        totalEvents: "กิจกรรมทั้งหมด",
        completed: "ผ่านแล้ว",
        rewards: "รางวัล",
        pending: "รอดำเนินการ",
        progress: "ความคืบหน้า",
        times: "ครั้ง",
        rank: "อันดับ",
        qualified: "ผ่านคุณสมบัติแล้ว",
        stillQualify: "ยังทำได้ต่อ",
        expired: "หมดเวลาแล้ว",
        finalized: "ประกาศผลแล้ว",
        notFinalized: "ยังไม่ประกาศผล",
        congrats: "ยินดีด้วย!",
        youQualified: "คุณผ่านคุณสมบัติแล้ว!",
        keepGoing: "สู้ๆ นะ!",
        locked: "ล็อก",
        needMore: "เหลืออีก",
        toQualify: "เพื่อผ่านคุณสมบัติ",
        yourReward: "รางวัลของคุณ",
        notStarted: "ยังไม่เริ่ม"
      },
      en: {
        title: "Monthly Rewards",
        loading: "Loading data...",
        noData: "No Leaderboard Data",
        selectEvent: "Select Event",
        totalEvents: "Total Events",
        completed: "Completed",
        rewards: "Rewards",
        pending: "Pending",
        progress: "Progress",
        times: "times",
        rank: "Rank",
        qualified: "Qualified",
        stillQualify: "Can still qualify",
        expired: "Expired",
        finalized: "Finalized",
        notFinalized: "Not Finalized",
        congrats: "Congratulations!",
        youQualified: "You have qualified!",
        keepGoing: "Keep Going!",
        locked: "Locked",
        needMore: "Need",
        toQualify: "more to qualify",
        yourReward: "Your Reward",
        notStarted: "Not Started"
      }
    };
    $$renderer2.push(`<div class="app-screen svelte-wp581t"><div class="glass-header svelte-wp581t"><a href="/officer/event-list" class="back-btn svelte-wp581t" aria-label="Back"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"></path></svg></a> <h1 class="page-title svelte-wp581t">${escape_html(t[lang].title)}</h1> <div class="lang-toggle svelte-wp581t"><button${attr_class("svelte-wp581t", void 0, { "active": lang === "th" })}>TH</button> <span class="sep svelte-wp581t">|</span> <button${attr_class("svelte-wp581t", void 0, { "active": lang === "en" })}>EN</button></div></div> <div class="scroll-container svelte-wp581t"><div class="content-wrapper svelte-wp581t">`);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> `);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <div class="reward-card svelte-wp581t">`);
    {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div style="padding: 40px; color: #9ca3af;">${escape_html(t[lang].loading)}</div>`);
    }
    $$renderer2.push(`<!--]--></div></div></div></div>`);
  });
}
export {
  _page as default
};
