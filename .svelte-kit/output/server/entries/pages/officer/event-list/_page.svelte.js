import { a0 as ensure_array_like, Y as attr_class } from "../../../../chunks/index2.js";
import { o as onDestroy } from "../../../../chunks/index-server.js";
import "@sveltejs/kit/internal";
import "../../../../chunks/exports.js";
import "../../../../chunks/utils.js";
import { a as attr, e as escape_html } from "../../../../chunks/attributes.js";
import "@sveltejs/kit/internal/server";
import "../../../../chunks/state.svelte.js";
import "../../../../chunks/auth.js";
import "sweetalert2";
import { R as ROUTES } from "../../../../chunks/routes.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let currentView = "event-list";
    let lang = "th";
    let searchQuery = "";
    let events = [];
    let timeLeftStr = "--:--:--";
    const menuItems = [
      {
        id: "event-list",
        label: "Event list",
        path: ROUTES.officer.eventList,
        svg: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
      },
      {
        id: "my-event",
        label: "My event",
        path: ROUTES.officer.myEvents,
        svg: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
      },
      {
        id: "account-setting",
        label: "Account setting",
        path: ROUTES.officer.settings,
        svg: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      }
    ];
    const t = {
      th: {
        search_placeholder: "ค้นหา...",
        status_active: "เปิดรับสมัคร",
        status_non_active: "ไม่รับสมัคร",
        status_not_open: "ยังไม่เปิด",
        status_full: "เต็ม",
        status_joined: "เข้าร่วมแล้ว",
        status_resubmit: "ส่งใหม่",
        status_pending: "รอตรวจสอบ",
        status_completed: "สำเร็จ",
        status_cancelled: "ยกเลิกแล้ว",
        status_ended: "จบแล้ว",
        btn_register: "ลงทะเบียน",
        btn_cancel: "ยกเลิก",
        btn_joined: "เข้าร่วมแล้ว",
        btn_read_more: "ดูรายละเอียด",
        btn_read_less: "ย่อลง",
        btn_send_proof: "ส่งหลักฐาน",
        btn_resubmit: "ส่งหลักฐานใหม่",
        upload_title: "อัปโหลดหลักฐาน",
        upload_desc: "กรุณาอัปโหลดสลิปหรือผลการวิ่ง",
        upload_btn: "ยืนยันการส่ง",
        upload_rejected: "⚠️ หลักฐานถูกตีกลับ กรุณาส่งใหม่",
        cancel_title: "ยกเลิกกิจกรรม",
        cancel_desc: "โปรดระบุเหตุผลที่คุณต้องการยกเลิก",
        cancel_confirm: "ยืนยันการยกเลิก",
        reason_placeholder: "ระบุเหตุผลอื่นๆ...",
        alert_success: "สำเร็จ",
        alert_cancel_success: "ยกเลิกเรียบร้อยแล้ว",
        inbox_title: "รางวัลและการแจ้งเตือน",
        inbox_empty: "ไม่มีรายการแจ้งเตือน",
        mark_all_read: "อ่านทั้งหมด",
        event_type_single: "วันเดียว",
        event_type_multi: "หลายวัน",
        event_type_challenge: "ท้าทาย",
        daily_checkin: "เช็คอินรายวัน",
        checkin_progress: "ความคืบหน้า",
        days_remaining: "วันที่เหลือ",
        day_unit: "วัน",
        participants: "ผู้เข้าร่วม"
      },
      en: {
        search_placeholder: "Search...",
        status_active: "ACTIVE",
        status_non_active: "NOT OPEN",
        status_not_open: "NOT OPEN",
        status_full: "FULL",
        status_joined: "JOINED",
        status_resubmit: "RESUBMIT",
        status_pending: "PENDING",
        status_completed: "COMPLETED",
        status_cancelled: "CANCELLED",
        status_ended: "ENDED",
        btn_register: "REGISTRATION",
        btn_cancel: "CANCEL",
        btn_joined: "JOINED",
        btn_read_more: "Read more",
        btn_read_less: "Read less",
        btn_send_proof: "SEND PROOF",
        btn_resubmit: "RESUBMIT PROOF",
        upload_title: "Upload Proof",
        upload_desc: "Please upload your slip or result.",
        upload_btn: "SUBMIT PROOF",
        upload_rejected: "⚠️ Proof rejected. Please resubmit.",
        cancel_title: "Cancel Participation",
        cancel_desc: "Please specify your reason for cancellation.",
        cancel_confirm: "CONFIRM CANCEL",
        reason_placeholder: "Specify other reason...",
        alert_success: "Success",
        alert_cancel_success: "Cancelled successfully",
        inbox_title: "Rewards & Notifications",
        inbox_empty: "No notifications",
        mark_all_read: "Mark all read",
        event_type_single: "Single Day",
        event_type_multi: "Multi Day",
        event_type_challenge: "Challenge",
        daily_checkin: "Daily Check-in",
        checkin_progress: "Progress",
        days_remaining: "Days Left",
        day_unit: "days",
        participants: "Participants"
      }
    };
    onDestroy(() => {
    });
    let debouncedQuery = "";
    let searchDebounceTimer = null;
    {
      if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
      searchDebounceTimer = setTimeout(
        () => {
          debouncedQuery = searchQuery.toLowerCase().trim();
        },
        250
      );
    }
    events.filter((event) => {
      if (event.endDate) {
        const now = /* @__PURE__ */ new Date();
        const end = new Date(event.endDate);
        end.setHours(23, 59, 59, 999);
        if (now > end) return false;
      }
      if (event.isJoined && !event.isJoinedToday) {
        return false;
      }
      const query = debouncedQuery;
      if (!query) return true;
      return event.title.toLowerCase().includes(query) || event.location.toLowerCase().includes(query) || event.description.toLowerCase().includes(query);
    });
    $$renderer2.push(`<div class="app-container svelte-10685s1"><header class="header-bar svelte-10685s1"><div class="header-inner svelte-10685s1"><div class="left-group svelte-10685s1"><div class="brand"><span class="brand-name svelte-10685s1">Officer</span></div> <nav class="nav-menu desktop-only svelte-10685s1"><!--[-->`);
    const each_array = ensure_array_like(menuItems);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let item = each_array[$$index];
      $$renderer2.push(`<button${attr_class("menu-btn svelte-10685s1", void 0, { "active": currentView === item.id })}><svg class="nav-icon svelte-10685s1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"${attr("d", item.svg)}></path></svg> <span class="btn-label">${escape_html(item.label)}</span></button>`);
    }
    $$renderer2.push(`<!--]--></nav></div> <div class="search-bar-container desktop-only svelte-10685s1"><div class="search-input-wrapper svelte-10685s1"><svg class="search-icon svelte-10685s1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg> <input type="text"${attr("placeholder", t[lang].search_placeholder)} class="search-input svelte-10685s1"${attr("value", searchQuery)}/></div></div> <div class="user-zone svelte-10685s1"><div class="timer-pill svelte-10685s1">${escape_html(timeLeftStr)}</div> <div class="lang-switch desktop-only svelte-10685s1"><button${attr_class("svelte-10685s1", void 0, { "active": lang === "th" })}>TH</button> <span class="sep svelte-10685s1">|</span> <button${attr_class("svelte-10685s1", void 0, { "active": lang === "en" })}>EN</button></div> <button class="logout-btn desktop-only svelte-10685s1" aria-label="Logout"><svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg></button> <button class="mobile-toggle mobile-only svelte-10685s1" aria-label="Toggle menu"><svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 9h16M4 15h16"></path></svg></button></div></div></header> `);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <div class="scroll-container svelte-10685s1"><div class="content-wrapper svelte-10685s1"><div class="page-header svelte-10685s1"><h2 class="section-title svelte-10685s1">Event List</h2> <div class="title-underline svelte-10685s1"></div></div> `);
    {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="loading-container svelte-10685s1"><div class="spinner svelte-10685s1"></div> <p>Loading...</p></div>`);
    }
    $$renderer2.push(`<!--]--> <footer class="app-footer svelte-10685s1"><div class="footer-separator svelte-10685s1"></div> <div class="footer-content svelte-10685s1"><p class="copyright svelte-10685s1">© 2025 Cyber Geek. All rights reserved.</p> <p class="credits svelte-10685s1">Designed &amp; Developed by <span class="highlight svelte-10685s1">Cyber Geek Development</span></p> <p class="contact svelte-10685s1">Contact: <a href="mailto:cybergeek.dev@proton.me" class="svelte-10685s1">cybergeek.dev@proton.me</a></p></div></footer></div></div> `);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> `);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></div>`);
  });
}
export {
  _page as default
};
