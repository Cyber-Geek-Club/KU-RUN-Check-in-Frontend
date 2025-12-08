<script lang="ts">
  import { fade, scale } from "svelte/transition";
  import { quintOut } from "svelte/easing";
  import Swal from "sweetalert2";

  let isMenuOpen = false;

  let events = [
    {
      id: 1,
      title: "KASETSART RUN OF HEALTH",
      image:
        "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=800&q=80",
      description:
        "Join us for the biggest charity run event of the year. Promote good health and support our community.",
      date: "Sunday, January 14, 2024",
      time: "05:00 AM - 09:00 AM",
      location: "Kasetsart University, Sriracha",
      participants: 0,
      maxParticipants: 100,
      isReadMore: false,
    },
    {
      id: 2,
      title: "MUSIC FESTIVAL 2024",
      image:
        "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=800&q=80",
      description:
        "Enjoy live music from top artists under the stars. Food trucks and fun activities included.",
      date: "Saturday, February 20, 2024",
      time: "04:00 PM - 11:00 PM",
      location: "City Park",
      participants: 45,
      maxParticipants: 200,
      isReadMore: false,
    },
    {
      id: 3,
      title: "FOOD CARNIVAL 2024",
      image:
        "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80",
      description:
        "Taste the best local and international dishes from over 50 food stalls.",
      date: "Sunday, March 10, 2024",
      time: "10:00 AM - 10:00 PM",
      location: "Central Square",
      participants: 120,
      maxParticipants: 500,
      isReadMore: false,
    },
  ];

  function toggleMenu() {
    isMenuOpen = !isMenuOpen;
  }

  function handleOverlayKeydown(event: KeyboardEvent) {
    if (event.key === "Enter" || event.key === " ") {
      toggleMenu();
    }
  }

  function toggleReadMore(index: number) {
    events[index].isReadMore = !events[index].isReadMore;
  }

  function handleRegister(eventItem: any) {
    Swal.fire({
      title: 'Confirm Registration',
      html: `Are you sure you want to register for <br><b style="color: #10B981;">"${eventItem.title}"</b>?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10B981',
      cancelButtonColor: '#6B7280',
      iconColor: "#10B981",
      confirmButtonText: 'Yes, Register',
      cancelButtonText: 'Cancel',
      background: '#fff',
      width: "320px"
    }).then((result) => {
      if (result.isConfirmed) {
        console.log("Registered for:", eventItem.title);
        
        Swal.fire({
          title: 'Registered!',
          text: 'You have successfully registered.',
          icon: 'success',
          confirmButtonColor: '#10B981',
          timer: 2000,
          width: "320px",
          showConfirmButton: false
        });
      }
    });
  }
</script>

<div class="app-screen">
  <div class="glass-header">
    <div class="header-content">
      <h1 class="page-title">EVENT LIST</h1>

      <button
        class="menu-burger"
        class:active={isMenuOpen}
        on:click|stopPropagation={toggleMenu}
        aria-label="Toggle menu"
      >
        <span class="line line-1"></span>
        <span class="line line-2"></span>
      </button>
    </div>
  </div>

  {#if isMenuOpen}
    <div
      class="menu-overlay"
      role="button"
      tabindex="0"
      on:click={toggleMenu}
      on:keydown={handleOverlayKeydown}
      transition:fade={{ duration: 200 }}
    ></div>

    <div
      class="dropdown-menu"
      transition:scale={{
        duration: 250,
        start: 0.9,
        opacity: 0,
        easing: quintOut,
      }}
    >
      <div class="menu-arrow"></div>

      <a href="/monthly-reward-user" class="menu-item">
        <span class="icon">🏆</span> Monthly Reward
      </a>
      <a href="/myevents-upcoming" class="menu-item">
        <span class="icon">📅</span> My Events
      </a>
      <a href="/setting-account-student" class="menu-item">
        <span class="icon">⚙️</span> Settings
      </a>
      <div class="menu-divider"></div>
        <a href="/" class="menu-item logout">
          <span class="icon">🚪</span>  Logout
        </a>
    </div>
  {/if}

  <div class="scroll-container">
    <div class="content-wrapper">
      {#each events as event, i}
        <div class="event-card">
          <div
            class="card-image"
            style="background-image: url('{event.image}');"
          >
            <div class="participant-badge">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                ><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle
                  cx="9"
                  cy="7"
                  r="4"
                ></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path
                  d="M16 3.13a4 4 0 0 1 0 7.75"
                ></path></svg
              >
              <span>{event.participants}/{event.maxParticipants}</span>
            </div>
          </div>
          <div class="card-body">
            <h3 class="event-title">{event.title}</h3>
            <p class="event-desc">{event.description}</p>
            {#if event.isReadMore}
              <div class="event-details" transition:fade>
                <div class="detail-row">
                  <span class="detail-icon">📅</span>
                  {event.date}
                </div>
                <div class="detail-row">
                  <span class="detail-icon">⏰</span>
                  {event.time}
                </div>
                <div class="detail-row">
                  <span class="detail-icon">📍</span>
                  {event.location}
                </div>
              </div>
            {/if}
            <div class="card-footer">
              <button class="read-more-btn" on:click={() => toggleReadMore(i)}>
                {event.isReadMore ? "Read less" : "Read more"}
              </button>
              
              <button class="register-btn" on:click={() => handleRegister(event)}>
                REGISTRATION
              </button>

            </div>
          </div>
        </div>
      {/each}
      <div style="height: 40px;"></div>
    </div>
  </div>
</div>

<style>
  @import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap");

  :global(body) {
    margin: 0;
    padding: 0;
    background-color: #111827;
    font-family: "Inter", sans-serif; 
    overflow: hidden;
  }

  :global(button), 
  :global(input), 
  :global(select), 
  :global(textarea) {
    font-family: "Inter", sans-serif !important;
  }

  :global(.swal2-popup),
  :global(.swal2-title),
  :global(.swal2-html-container),
  :global(.swal2-confirm),
  :global(.swal2-cancel),
  :global(.swal2-content) {
    font-family: "Inter", sans-serif !important;
  }
  

  :global(.swal2-container) {
    backdrop-filter: blur(8px) !important;
    -webkit-backdrop-filter: blur(8px) !important;
    background: rgba(0, 0, 0, 0.4) !important;
  }

  :global(.swal2-popup) {
    border-radius: 20px !important;
  }
  
  .app-screen {
    height: 100vh;
    display: flex;
    flex-direction: column;
    position: relative;
  }

  .glass-header {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 80px;
    z-index: 50;
    background: rgba(17, 24, 39, 0.95);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(17, 24, 39, 0.95);
  }

  .header-content {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 20px;
    box-sizing: border-box;
  }

  .page-title {
    color: white;
    font-size: 28px;
    font-weight: 700;
    margin: 0;
    letter-spacing: 1px;
    text-transform: uppercase;
  }

  .menu-burger {
    position: absolute;
    right: 20px;
    top: 50%;
    transform: translateY(-50%);
    width: 32px;
    height: 32px;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    z-index: 52;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 6px;
  }

  .line {
    display: block;
    width: 24px;
    height: 2.5px;
    background-color: white;
    border-radius: 2px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    transform-origin: center;
  }

  .menu-burger.active .line-1 {
    transform: translateY(4.25px) rotate(45deg);
  }

  .menu-burger.active .line-2 {
    transform: translateY(-4.25px) rotate(-45deg);
  }

  .menu-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.3);
    z-index: 50;
    cursor: default;
  }

  .dropdown-menu {
    position: absolute;
    top: 70px;
    right: 16px;
    width: 200px;
    background: white;
    z-index: 51;
    border-radius: 16px;
    padding: 8px 0;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
    transform-origin: top right;
  }

  .menu-arrow {
    position: absolute;
    top: -6px;
    right: 14px;
    width: 12px;
    height: 12px;
    background: white;
    transform: rotate(45deg);
    border-top-left-radius: 4px;
  }

  .menu-item {
    display: flex;
    align-items: center;
    padding: 10px 16px; 
    text-decoration: none;
    color: #374151; 
    font-weight: 500;
    font-size: 15px;
    border: none;
    background: none;
    cursor: pointer;
    position: relative;
    z-index: 2;
    width: auto;
    margin: 4px 8px; 
    border-radius: 8px; 
    transition: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }

  .menu-item:hover {
    background-color: #F3F4F6; 
    color: #10B981;
    transform: translateX(4px);
  }

  .menu-item:active {
    transform: scale(0.98) translateX(4px);
  }

  .menu-item.logout {
    color: #EF4444; 
  }
  
  .menu-item.logout:hover {
    background-color: #FEF2F2; 
    color: #b40808; 
  }

  .icon {
    margin-right: 12px;
    font-size: 18px;
    transition: transform 0.2s ease;
  }

  .menu-item:hover .icon {
    transform: scale(1.1);
  }

  .menu-divider {
    height: 1px;
    background: #e5e7eb;
    margin: 6px 12px; 
  }

  .scroll-container {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    -webkit-overflow-scrolling: touch;
    padding-top: 100px;
  }
  .scroll-container::-webkit-scrollbar {
    display: none;
  }
  .content-wrapper {
    width: 100%;
    max-width: 400px;
    margin: 0 auto;
    padding: 0 20px;
    box-sizing: border-box;
  }
  .event-card {
    background: white;
    border-radius: 16px;
    overflow: hidden;
    margin-bottom: 24px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
  }
  .card-image {
    height: 180px;
    background-size: cover;
    background-position: center;
    position: relative;
  }
  .participant-badge {
    position: absolute;
    top: 12px;
    right: 12px;
    background: rgba(255, 255, 255, 0.9);
    padding: 4px 8px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    color: #374151;
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .card-body {
    padding: 16px;
    text-align: left;
  }
  .event-title {
    margin: 0 0 8px 0;
    font-size: 18px;
    font-weight: 700;
    color: #111827;
    text-transform: uppercase;
  }
  .event-desc {
    font-size: 14px;
    color: #6b7280;
    margin: 0 0 16px 0;
    line-height: 1.5;
  }
  .event-details {
    background: #f9fafb;
    padding: 12px;
    border-radius: 8px;
    margin-bottom: 16px;
  }
  .detail-row {
    font-size: 13px;
    color: #4b5563;
    margin-bottom: 6px;
    display: flex;
    align-items: center;
  }
  .detail-row:last-child {
    margin-bottom: 0;
  }
  .detail-icon {
    margin-right: 8px;
  }
  .card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: auto;
  }
  .read-more-btn {
    background: none;
    border: none;
    color: #10b981;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    padding: 0;
  }
  .read-more-btn:hover {
    text-decoration: underline;
  }
  .register-btn {
    background-color: #10b981;
    color: #111827;
    border: none;
    padding: 8px 20px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    text-transform: uppercase;
  }
  .register-btn:hover {
    background-color: #059669;
  }
</style>