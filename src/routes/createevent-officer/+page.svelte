<script lang="ts">
  import { fade, scale } from "svelte/transition";
  import Swal from "sweetalert2";
  import { goto } from "$app/navigation";
  import { quintOut } from "svelte/easing";

  let events = [
    {
      id: 1,
      title: "KASETSART RUN OF HEALTH",
      image:
        "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=800&q=80",
      currentParticipants: 0,
      maxParticipants: 100,
      description:
        "Join us for the biggest charity run event of the year. Promote good health and support our community",
    },

    {
      id: 2,
      title: "KASETSART RUN OF HEALTH",
      image:
        "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=800&q=80",
      currentParticipants: 0,
      maxParticipants: 100,
      description:
        "Join us for the biggest charity run event of the year. Promote good health and support our community",
    },

    {
      id: 3,
      title: "KASETSART RUN OF HEALTH",
      image:
        "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=800&q=80",
      currentParticipants: 0,
      maxParticipants: 100,
      description:
        "Join us for the biggest charity run event of the year. Promote good health and support our community",
    },

    {
      id: 4,
      title: "KASETSART RUN OF HEALTH",
      image:
        "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=800&q=80",
      currentParticipants: 0,
      maxParticipants: 100,
      description:
        "Join us for the biggest charity run event of the year. Promote good health and support our community",
    },

    {
      id: 5,
      title: "KASETSART RUN OF HEALTH",
      image:
        "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=800&q=80",
      currentParticipants: 0,
      maxParticipants: 100,
      description:
        "Join us for the biggest charity run event of the year. Promote good health and support our community",
    },
  ];

  let isMenuOpen = false;

  function handleEdit(id: number) {
    goto(`/createevent-officer-2?id=${id}`);
  }
  function toggleMenu() {
    isMenuOpen = !isMenuOpen;
  }

  function handleOverlayKeydown(event: KeyboardEvent) {
    if (event.key === "Enter" || event.key === " ") {
      toggleMenu();
    }
  }
  function handleDelete(id: number) {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#B4151D",
      cancelButtonColor: "#6B7280",
      iconColor: "#B4151D",
      confirmButtonText: "Yes, delete it!",
      width: "320px",
      customClass: { popup: "my-swal-popup" },
    }).then((result) => {
      if (result.isConfirmed) {
        events = events.filter((e) => e.id !== id);
        Swal.fire({
          title: "Deleted!",
          icon: "success",
          width: "320px",
          confirmButtonColor: "#10B981",
          showConfirmButton: false,
          timer: 1500,
          customClass: { popup: "my-swal-popup" },
        });
      }
    });
  }

  function handleCreate() {
    goto("/createevent-officer-2");
  }
</script>

<div class="app-screen">
  <div class="glass-header">
    <a href="/home" class="back-btn" aria-label="Back">
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <line x1="19" y1="12" x2="5" y2="12"></line>
        <polyline points="12 19 5 12 12 5"></polyline>
      </svg>
    </a>
    <h1 class="page-title">CREATE EVENT</h1>

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

      <a href="/eventverify-officer" class="menu-item">
        <span class="icon">🔢</span> Verify Code
      </a>
      <a href="/upload-proof-officer" class="menu-item">
        <span class="icon">📝</span> Verify Proof
      </a>
      <a href="/monthly-reward-officer" class="menu-item">
        <span class="icon">🏆</span> Monthly Reward 
      </a>
      <a href="/setting-account-officer" class="menu-item">
        <span class="icon">⚙️</span> Settings
      </a>
      <div class="menu-divider"></div>
      <a href="/" class="menu-item logout">
        <span class="icon">🚪</span> Logout
      </a>
    </div>
  {/if}

  <div class="scroll-container">
    <div class="content-wrapper">
      <div class="event-list">
        {#each events as event (event.id)}
          <div class="card">
            <div class="card-image">
              <img src={event.image} alt={event.title} />
            </div>

            <div class="card-content">
              <div class="card-header-row">
                <h3 class="card-title">{event.title}</h3>
                <div class="participant-badge">
                  <svg
                    class="users-icon"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                  <span
                    >{event.currentParticipants}/{event.maxParticipants}</span
                  >
                </div>
              </div>

              <p class="card-desc">
                {event.description}
              </p>

              <div class="card-actions">
                <button
                  class="action-btn edit-btn"
                  on:click={() => handleEdit(event.id)}
                >
                  EDIT
                </button>
                <button
                  class="action-btn delete-btn"
                  on:click={() => handleDelete(event.id)}
                >
                  DELETE
                </button>
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>
  </div>

  <button class="fab-btn" on:click={handleCreate} aria-label="Create Event">
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  </button>
</div>

<style>
  @import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap");

  :global(body) {
    margin: 0;
    padding: 0;
    background-color: #111827;
    color: white;
    font-family: "Inter", sans-serif;
    overflow: hidden;
  }

  :global(button),
  :global(input),
  :global(textarea),
  :global(select),
  :global(h1),
  :global(h2),
  :global(h3),
  :global(h4),
  :global(h5),
  :global(h6),
  :global(p),
  :global(span),
  :global(a) {
    font-family: "Inter", sans-serif !important;
  }

  :global(.swal2-popup),
  :global(.swal2-title),
  :global(.swal2-html-container),
  :global(.swal2-confirm),
  :global(.swal2-cancel) {
    font-family: "Inter", sans-serif !important;
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
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .back-btn {
    position: absolute;
    left: 20px;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    cursor: pointer;
    transition: 0.2s;
  }
  .back-btn:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  .page-title {
    color: white;
    font-size: 28px;
    font-weight: 700;
    margin: 0;
    letter-spacing: 1px;
  }

  .scroll-container {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    -webkit-overflow-scrolling: touch;
    padding-top: 100px;
    padding-bottom: 100px;
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

  .event-list {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .card {
    background: white;
    border-radius: 20px;
    overflow: hidden;
    color: #333;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  }

  .card-image {
    height: 200px;
    width: 100%;
    position: relative;
  }

  .card-image img {
    height: 100%;
    width: 100%;
    object-fit: cover;
  }

  .card-content {
    padding: 20px;
  }

  .card-header-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 10px;
  }

  .card-title {
    font-size: 16px;
    font-weight: 700;
    color: #111827;
    margin: 0;
    line-height: 1.4;
    flex: 1;
    text-transform: uppercase;
    padding-right: 10px;
  }

  .participant-badge {
    display: flex;
    flex-direction: column;
    align-items: center;
    font-size: 11px;
    color: #6b7280;
    font-weight: 600;
    min-width: 40px;
  }

  .users-icon {
    color: #374151;
    margin-bottom: 2px;
  }

  .card-desc {
    font-size: 13px;
    color: #4b5563;
    line-height: 1.5;
    margin: 0 0 20px 0;
  }

  .card-actions {
    display: flex;
    gap: 12px;
  }

  .action-btn {
    flex: 1;
    padding: 10px 0;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 700;
    border: none;
    cursor: pointer;
    text-transform: uppercase;
    transition: 0.2s;
  }

  .edit-btn {
    background-color: #10b981;
    color: white;
  }

  .edit-btn:hover {
    background-color: #059669;
  }

  .delete-btn {
    background-color: #b4151d;
    color: white;
  }

  .delete-btn:hover {
    background-color: #991b1b;
  }

  .fab-btn {
    position: absolute;
    bottom: 30px;
    left: 50%;
    transform: translateX(-50%);
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background-color: transparent;
    border: 2px solid white;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
    transition: 0.2s;
    z-index: 60;
  }

  .fab-btn:active {
    transform: translateX(-50%) scale(0.95);
    background-color: rgba(255, 255, 255, 0.1);
  }

  :global(.swal2-container) {
    backdrop-filter: blur(5px);
    -webkit-backdrop-filter: blur(5px);
    background: rgba(0, 0, 0, 0.5) !important;
  }

  :global(.my-swal-popup) {
    border-radius: 20px !important;
  }

  @media (max-width: 480px) {
    .card-image {
      height: 180px;
    }
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
    width: auto;
    margin: 4px 8px;
    border-radius: 8px;
    transition: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }

  .menu-item:hover {
    background-color: #f3f4f6;
    color: #10b981;
    transform: translateX(4px);
  }

  .icon {
    margin-right: 12px;
    font-size: 18px;
  }

  .menu-item.logout {
    color: #ef4444;
  }

  .menu-item.logout:hover {
    background-color: #fef2f2;
    color: #b40808;
  }

  .menu-divider {
    height: 1px;
    background: #e5e7eb;
    margin: 6px 12px;
  }
</style>
