<script lang="ts">
    import {onMount} from "svelte";

    let activeTab = 'upcoming';
    let events: any[] = [];
    let isLoading = false;

    $: filteredEvents = events.filter(e => {
        if (activeTab === 'upcoming') {
            return ['joined', 'checked-in'].includes(e.status);
        } else {
            return ['completed', 'cancel'].includes(e.status);
        }
    });

    onMount(async () => {
        isLoading = true;
        try {
            const base = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");
            const userInfoStr = localStorage.getItem("user_info");
            const token = localStorage.getItem("access_token");

            if (!userInfoStr || !token) {
                console.error("ไม่พบข้อมูลผู้ใช้ หรือ Token");
                return;
            }

            const userInfo = JSON.parse(userInfoStr);
            const userId = userInfo.id;
            const url = `${base}/api/users/${userId}/events`;

            const res = await fetch(url, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            });

            if (!res.ok) throw new Error("Fetch failed");

            const data = await res.json();

            events = data.map((item: any) => ({
                id: item.id,
                title: item.title,
                date: new Date(item.event_date).toLocaleDateString(),
                time: new Date(item.event_date).toLocaleTimeString(),
                location: item.location,
                image: item.banner_image_url,
                status: item.status || 'joined',
                type: checkEventType(item.status)
            }));

        } catch (err) {
            console.error("Error:", err);
        } finally {
            isLoading = false;
        }
    });

    const checkEventType = (status: string) => {
        if (['joined', 'checked-in'].includes(status)) return 'upcoming';
        if (['completed', 'cancel'].includes(status)) return 'past';
        return 'upcoming';
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'joined': return 'background-color: #0066FF; color: white;';
            case 'checked-in': return 'background-color: #FFE600; color: black;';
            case 'completed': return 'background-color: #10B981; color: white;';
            case 'cancel': return 'background-color: #b4151d; color: white;';
            default: return 'background-color: gray;';
        }
    };

    const getStatusText = (status: string) => {
        if (status === 'joined') return 'Joined';
        if (status === 'checked-in') return 'Checked-in';
        if (status === 'completed') return 'Completed';
        if (status === 'cancel') return 'Cancel';
        return status;
    };
</script>

<div class="app-screen">
    
    <div class="glass-header">
        <a href="/student/event-list" class="back-btn" aria-label="Back">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </a>
        <h1 class="page-title">MY EVENTS</h1>
    </div>

    <div class="pinned-tabs-wrapper">
        <div class="tabs-bg">
            <button 
                class="tab-btn {activeTab === 'upcoming' ? 'active' : ''}"
                on:click={() => activeTab = 'upcoming'}>
                Upcoming
            </button>
            <button
                class="tab-btn {activeTab === 'history' ? 'active' : ''}"
                on:click={() => activeTab = 'history'}>
                History
            </button>
        </div>
    </div>

    <div class="scroll-container">
        <div class="content-wrapper">
            
            <div class="event-list">
                {#each filteredEvents as event (event.id)}
                    <div class="card">
                        <div class="card-image">
                            <img src={event.image} alt={event.title}/>
                        </div>
                        <div class="card-content">
                            <h3 class="card-title">{event.title}</h3>

                            <div class="info-row">
                                <span class="icon">📅</span> <span>Date: {event.date}</span>
                            </div>
                            <div class="info-row">
                                <span class="icon">⏰</span> <span>Time: {event.time}</span>
                            </div>
                            <div class="info-row">
                                <span class="icon">📍</span> <span>Location: {event.location}</span>
                            </div>
                            {#if event.status !== 'joined' && event.type !== 'history'}
                                <div class="info-row">
                                    <span class="icon">🔢</span> <span>Pin code: {event.pincode}</span>
                                </div>
                            {/if}

                            <div class="card-action">
                                <button class="status-btn" style={getStatusStyle(event.status)}>
                                    {getStatusText(event.status)}
                                </button>
                            </div>
                        </div>
                    </div>
                {/each}
            </div>

        </div>
    </div>
</div>

<style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    
    :global(body) {
        margin: 0; padding: 0;
        background-color: #111827; 
        font-family: 'Inter', sans-serif;
        overflow: hidden; 
    }

    :global(button),
    :global(input),
    :global(textarea),
    :global(select),
    :global(h1), :global(h2), :global(h3), :global(h4), :global(h5), :global(h6),
    :global(p), :global(span), :global(a), :global(div) {
        font-family: 'Inter', sans-serif !important;
    }

    .app-screen {
        height: 100vh;
        display: flex;
        flex-direction: column;
        position: relative;
    }

    .glass-header {
        position: absolute;
        top: 0; left: 0; width: 100%;
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

    .pinned-tabs-wrapper {
        position: absolute;
        top: 80px;
        left: 0;
        width: 100%;
        z-index: 40;
        background: transparent; 
        padding-top: 15px; 
        display: flex;
        justify-content: center;
        pointer-events: none;
    }

    .tabs-bg {
        background-color: #E5E7EB; 
        border-radius: 50px;
        padding: 4px;
        display: flex;
        width: 100%;
        max-width: 240px;
        pointer-events: auto;
        box-shadow: 0 4px 10px rgba(0,0,0,0.2);
    }

    .tab-btn {
        flex: 1;
        background: transparent;
        border: none;
        padding: 8px 0;
        border-radius: 40px;
        color: #6B7280; 
        font-weight: 500;
        cursor: pointer;
        font-family: 'Inter', sans-serif;
        transition: 0.2s;
        font-size: 14px;
    }

    .tab-btn.active {
        background-color: white; 
        color: #111827; 
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        font-weight: 700;
    }

    .scroll-container {
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
        -webkit-overflow-scrolling: touch;
        padding-top: 150px; 
        padding-bottom: 40px;
    }
    .scroll-container::-webkit-scrollbar { display: none; }

    .content-wrapper {
        width: 100%; 
        max-width: 400px; 
        margin: 0 auto; 
        padding: 0 20px; 
        box-sizing: border-box;
    }

    .event-list { display: flex; flex-direction: column; gap: 20px; }
    
    .card {
        background: white; 
        border-radius: 16px; 
        overflow: hidden;
        color: #333; 
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }

    .card-image { 
        height: 160px; 
        width: 100%; 
    }

    .card-image img { 
        height: 100%; 
        width: 100%; 
        object-fit: cover; 
    }

    .card-content { 
        padding: 16px; 
    }

    .card-title { 
        margin: 0 0 12px 0; 
        font-size: 15px; 
        font-weight: 700; 
        text-transform: uppercase; 
        line-height: 1.4; 
    }

    .info-row { 
        display: flex; 
        gap: 8px; 
        font-size: 13px; 
        color: #4B5563; 
        margin-bottom: 6px; 
        align-items: flex-start; 
    }

    .icon { 
        min-width: 20px; 
        text-align: center; 
    }

    .card-action { 
        display: flex; 
        justify-content: flex-end; 
        margin-top: 12px; 
    }

    .status-btn { 
        border: none; 
        padding: 8px 0; 
        border-radius: 99px; 
        font-size: 12px; 
        font-weight: 600; 
        font-family: 'Inter', sans-serif; 
        cursor: pointer; 
        width: 120px; 
        text-align: center; 
    }

    @media (max-width: 480px) { .card-image { height: 140px; } }

</style>