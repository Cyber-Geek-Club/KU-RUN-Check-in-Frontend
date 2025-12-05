<script lang="ts">
    import { goto } from "$app/navigation";
    import { scale } from "svelte/transition"; 
</script>

<div class="app-screen">
    
    <div class="glass-header">
        <a href="/login" class="back-btn" aria-label="Back">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
        </a>
    </div>

    <div class="scroll-container">
        <div class="content-wrapper">
            
            <div class="success-card">
                
                <div class="icon-wrapper" in:scale={{ duration: 400, start: 0.5 }}>
                    <div class="success-circle">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    </div>
                </div>

                <div class="text-section">
                    <h1 class="main-title">PASSWORD RESET</h1>
                    <p class="sub-title">
                        Your password has been successfully reset.<br>
                        Click confirm to set a new password.
                    </p>
                </div>

                <button 
                    class="primary-btn" 
                    type="button" 
                    on:click={() => goto("/reset-password-4")}
                >
                    CONFIRM
                </button>

            </div>

        </div>
    </div>
</div>

<style>
    @import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap");

    :global(body) {
        margin: 0; padding: 0;
        background-color: #111827;
        color: white;
        font-family: 'Inter', sans-serif;
        overflow: hidden;
    }

    :global(button), :global(input), :global(textarea), :global(select),
    :global(h1), :global(h2), :global(h3), :global(h4), :global(h5), :global(h6),
    :global(p), :global(span), :global(a), :global(div), :global(label) {
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
        display: flex; align-items: center; justify-content: center;
    }

    .back-btn {
        position: absolute; left: 20px;
        width: 36px; height: 36px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        display: flex; align-items: center; justify-content: center;
        color: white; cursor: pointer; transition: 0.2s;
    }
    .back-btn:hover { background: rgba(255, 255, 255, 0.2); }



    .scroll-container {
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
        -webkit-overflow-scrolling: touch;
        padding-top: 120px; 
        padding-bottom: 40px;
    }
    .scroll-container::-webkit-scrollbar { display: none; }

    .content-wrapper {
        width: 100%; max-width: 400px; margin: 0 auto; padding: 0 20px; box-sizing: border-box;
    }

    .success-card {
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
    }

    .icon-wrapper {
        margin-bottom: 32px;
    }

    .success-circle {
        width: 100px;
        height: 100px;
        border-radius: 50%;
        background: rgba(16, 185, 129, 0.1);
        border: 2px solid #10b981;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #10b981;
        box-shadow: 0 0 20px rgba(16, 185, 129, 0.2);
    }

    .text-section {
        margin-bottom: 40px;
    }

    .main-title {
        color: #f3f4f6;
        font-size: 24px;
        font-weight: 700;
        line-height: 1.3;
        margin: 0 0 12px 0;
        letter-spacing: 0.5px;
    }

    .sub-title {
        color: #9CA3AF;
        font-size: 14px;
        margin: 0;
        line-height: 1.6;
    }

    .primary-btn {
        width: 100%;
        padding: 14px 16px;
        background: #10b981;
        color: #111827;
        font-size: 16px;
        font-weight: 700;
        border: none;
        border-radius: 12px;
        cursor: pointer;
        transition: background 0.2s;
        text-transform: uppercase;
        box-shadow: 0 4px 6px rgba(16, 185, 129, 0.2);
    }

    .primary-btn:hover { background: #059669; }
    .primary-btn:active { transform: scale(0.98); }

</style>