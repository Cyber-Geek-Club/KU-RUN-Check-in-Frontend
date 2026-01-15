import { Y as attr_class, Z as stringify } from "../../../../chunks/index2.js";
import { e as escape_html } from "../../../../chunks/attributes.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let configs = [];
    let entries = [];
    let lang = "th";
    const t = {
      th: {
        title: "จัดการ Leaderboard",
        loading: "กำลังโหลดข้อมูล...",
        noData: "ไม่พบข้อมูล Leaderboard",
        selectEvent: "เลือกกิจกรรม",
        totalQualified: "ผู้ผ่านคุณสมบัติ",
        totalRewarded: "ได้รับรางวัลแล้ว",
        totalSlots: "รางวัลทั้งหมด",
        calculate: "คำนวณอันดับ",
        finalize: "ยืนยันผล",
        finalized: "ยืนยันแล้ว",
        showAll: "แสดงทั้งหมด",
        showQualified: "เฉพาะผู้ผ่าน",
        rank: "อันดับ",
        name: "ชื่อ",
        email: "อีเมล",
        times: "ครั้ง",
        qualified: "ผ่านแล้ว",
        reward: "รางวัล",
        notQualified: "ยังไม่ผ่าน",
        noRank: "-",
        calculating: "กำลังคำนวณ...",
        finalizing: "กำลังยืนยัน...",
        confirmFinalize: "คุณแน่ใจหรือไม่? การยืนยันผลไม่สามารถย้อนกลับได้!",
        success: "สำเร็จ!",
        error: "เกิดข้อผิดพลาด",
        noEntries: "ยังไม่มีผู้เข้าร่วม",
        noQualified: "ยังไม่มีผู้ผ่านคุณสมบัติ"
      },
      en: {
        title: "Manage Leaderboard",
        loading: "Loading data...",
        noData: "No Leaderboard Data",
        selectEvent: "Select Event",
        totalQualified: "Qualified",
        totalRewarded: "Rewarded",
        totalSlots: "Total Slots",
        calculate: "Calculate Ranks",
        finalize: "Finalize",
        finalized: "Finalized",
        showAll: "Show All",
        showQualified: "Qualified Only",
        rank: "Rank",
        name: "Name",
        email: "Email",
        times: "Times",
        qualified: "Qualified",
        reward: "Reward",
        notQualified: "Not Qualified",
        noRank: "-",
        calculating: "Calculating...",
        finalizing: "Finalizing...",
        confirmFinalize: "Are you sure? This action cannot be undone!",
        success: "Success!",
        error: "Error occurred",
        noEntries: "No participants yet",
        noQualified: "No qualified participants"
      }
    };
    entries.filter((e) => e.qualified_at);
    $$renderer2.push(`<div class="app-screen svelte-1ti3toe"><div class="glass-header svelte-1ti3toe"><a href="/organizer" class="back-btn svelte-1ti3toe" aria-label="Back"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"></path></svg></a> <h1 class="page-title svelte-1ti3toe">${escape_html(t[lang].title)}</h1> <div class="lang-toggle svelte-1ti3toe"><button${attr_class("svelte-1ti3toe", void 0, { "active": lang === "th" })}>TH</button> <span class="sep svelte-1ti3toe">|</span> <button${attr_class("svelte-1ti3toe", void 0, { "active": lang === "en" })}>EN</button></div></div> <div class="scroll-container svelte-1ti3toe"><div class="content-wrapper svelte-1ti3toe">`);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (configs.length > 0) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="config-selector-wrapper svelte-1ti3toe"><div class="config-selector-container svelte-1ti3toe"><button${attr_class(`config-btn ${stringify("")}`, "svelte-1ti3toe")}><span class="config-name svelte-1ti3toe">${escape_html(t[lang].selectEvent)}</span> <svg${attr_class(`arrow-icon ${stringify("")}`, "svelte-1ti3toe")} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg></button> `);
      {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></div></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> `);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <div class="table-card svelte-1ti3toe">`);
    {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="empty-state svelte-1ti3toe">${escape_html(t[lang].loading)}</div>`);
    }
    $$renderer2.push(`<!--]--></div></div></div></div>`);
  });
}
export {
  _page as default
};
