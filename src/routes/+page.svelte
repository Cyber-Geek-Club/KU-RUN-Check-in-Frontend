<script lang="ts">
  import { goto } from "$app/navigation";
</script>

<svelte:head>
  <title>KU-RUN-CHECK-IN</title>
</svelte:head>

<div class="mobile-wrapper">
  <div class="content-container">
    <div class="logo-section">
      <img src="/logo-ku.png" alt="KU Logo" style="width: 250px;" />
    </div>

    <div class="title-section">
      <h1>KASETSART<br />RUN - CHECKIN</h1>
      <p class="subtitle">
        Gather KU runners, build good health, and achieve success together!
      </p>
    </div>

    <div class="action-section">
      <a href="/auth/login" class="btn btn-login"> LOGIN NOW </a>

      <a href="/auth/register" class="btn btn-signup"> SIGN UP </a>
    </div>
  </div>
</div>

<style>
  @import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap");

  :global(body) {
    margin: 0;
    padding: 0;
    background-color: #111827;
    color: white;
    font-family: "Inter", sans-serif;
  }

  :global(h1),
  :global(h2),
  :global(h3),
  :global(h4),
  :global(h5),
  :global(h6),
  :global(p),
  :global(span),
  :global(a),
  :global(div),
  :global(button) {
    font-family: "Inter", sans-serif !important;
  }

  .mobile-wrapper {
    width: 100%;
    max-width: 480px;
    margin: 0 auto;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    box-sizing: border-box;
  }

  .content-container {
    width: 100%;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 40px;
  }

  .logo-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: -50px;
  }

  .title-section h1 {
    font-size: 36px;
    font-weight: 700;
    margin: 0 0 16px 0;
    line-height: 1.3;
    text-transform: uppercase;
  }

  .subtitle {
    font-size: 14px;
    color: #9ca3af;
    font-weight: 300;
    margin: 0;
    padding: 0 20px;
    line-height: 1.5;
  }

  .action-section {
    display: flex;
    gap: 16px;
    justify-content: center;
    width: 100%;
  }

  .btn {
    flex: 1;
    padding: 14px 0;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 700;
    text-decoration: none;
    text-transform: uppercase;
    text-align: center;
    transition: 0.2s;
    max-width: 160px;
    font-family: "Inter", sans-serif;
  }

  .btn-login {
    background-color: #00c266;
    color: #111827;
    border: 2px solid #00c266;
  }

  .btn-login:hover {
    background-color: #00a355;
  }

  .btn-signup {
    background-color: #00c266;
    color: #111827;
    border: 2px solid #00c266;
  }
</style>
