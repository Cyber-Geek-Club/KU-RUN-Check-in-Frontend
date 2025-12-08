<script lang="ts">
  import Swal from "sweetalert2";

  // Mock Data
  let submissions = [
    {
      id: 1,
      runnerName: "Test One",
      submitTime: "09:20",
      proofImage:
        "https://images.unsplash.com/photo-1557166983-5939644443a0?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: 2,
      runnerName: "Sarah Runner",
      submitTime: "10:45",
      proofImage:
        "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: 3,
      runnerName: "John Doe",
      submitTime: "11:30",
      proofImage:
        "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: 4,
      runnerName: "Michael Smith",
      submitTime: "12:15",
      proofImage:
        "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: 5,
      runnerName: "Anna Bell",
      submitTime: "13:00",
      proofImage:
        "https://images.unsplash.com/photo-1485217988980-11786ced9454?auto=format&fit=crop&w=800&q=80",
    },
  ];

  function removeSubmission(id: number) {
    submissions = submissions.filter((item) => item.id !== id);
  }

  function handleConfirm(item: any) {
    Swal.fire({
      title: "Approve Submission?",
      text: `Confirm verification for ${item.runnerName}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#10B981",
      iconColor: "#10B981",
      cancelButtonColor: "#6B7280",
      confirmButtonText: "Yes, Approve",
      width: "320px",
      customClass: { popup: "my-swal-popup" },
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: "Verified!",
          text: "Submission approved successfully.",
          icon: "success",
          iconColor: "#10B981",
          showConfirmButton: false,
          timer: 1500,
          width: "320px",
          customClass: { popup: "my-swal-popup" },
        });
        removeSubmission(item.id);
      }
    });
  }

  async function handleReject(item: any) {
    const htmlContent = `
            <div class="swal-reject-container">
                <label class="radio-item">
                    <input type="radio" name="reject_reason" value="Unclear / Blurry Image" checked>
                    <span>Unclear / Blurry Image</span>
                </label>
                <label class="radio-item">
                    <input type="radio" name="reject_reason" value="Date / Time Mismatch">
                    <span>Date / Time Mismatch</span>
                </label>
                <label class="radio-item">
                    <input type="radio" name="reject_reason" value="Incorrect Distance / Duration">
                    <span>Incorrect Distance / Duration</span>
                </label>
                <label class="radio-item">
                    <input type="radio" name="reject_reason" value="Duplicate Submission">
                    <span>Duplicate Submission</span>
                </label>
                <label class="radio-item">
                    <input type="radio" name="reject_reason" value="other">
                    <span>Other</span>
                </label>
                
                <textarea 
                    id="swal-other-reason" 
                    class="swal-custom-textarea" 
                    placeholder="Please specify the reason..." 
                ></textarea>
            </div>
        `;

    const { value: reason } = await Swal.fire({
      title: "Reject Submission",
      html: htmlContent,
      icon: "warning",
      iconColor: "#EF4444",
      showCancelButton: true,
      confirmButtonColor: "#EF4444",
      cancelButtonColor: "#6B7280",
      confirmButtonText: "Reject",
      width: "380px",
      customClass: { popup: "my-swal-popup" },

      didOpen: () => {
        const popup = Swal.getPopup()!;
        const radios = popup.querySelectorAll('input[name="reject_reason"]');
        const otherTextarea = popup.querySelector(
          "#swal-other-reason"
        ) as HTMLElement;

        otherTextarea.style.display = "none";

        radios.forEach((radio: any) => {
          radio.addEventListener("change", (e: any) => {
            if (e.target.value === "other") {
              otherTextarea.style.display = "block";
              setTimeout(() => otherTextarea.focus(), 50);
            } else {
              otherTextarea.style.display = "none";
              (otherTextarea as HTMLInputElement).value = "";
            }
          });
        });
      },

      preConfirm: () => {
        const popup = Swal.getPopup()!;
        const selectedRadio = popup.querySelector(
          'input[name="reject_reason"]:checked'
        ) as HTMLInputElement;
        const otherTextarea = popup.querySelector(
          "#swal-other-reason"
        ) as HTMLInputElement;

        if (!selectedRadio) {
          Swal.showValidationMessage("Please select a reason");
          return false;
        }

        let finalValue = selectedRadio.value;

        if (finalValue === "other") {
          const otherText = otherTextarea.value.trim();
          if (!otherText) {
            Swal.showValidationMessage("Please type a reason");
            return false;
          }
          finalValue = otherText;
        }

        return finalValue;
      },
    });

    if (reason) {
      Swal.fire({
        title: "Rejected",
        text: `Reason: ${reason}`,
        icon: "error",
        iconColor: "#EF4444",
        width: "320px",
        showConfirmButton: false,
        timer: 1500,
        customClass: { popup: "my-swal-popup" },
      });
      removeSubmission(item.id);
    }
  }
</script>

<div class="app-screen">
  <div class="glass-header">
    <a href="/createevent-officer" class="back-btn" aria-label="Back">
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg
      >
    </a>
    <div class="header-inner">
      <h1 class="page-title">VERIFY PROOF</h1>
    </div>
  </div>

  <div class="scroll-container">
    <div class="content-wrapper">
      {#if submissions.length === 0}
        <div class="empty-state">
          <p>No pending submissions.</p>
        </div>
      {:else}
        {#each submissions as item (item.id)}
          <div class="verify-card">
            <div class="card-header">
              <h2 class="card-heading">Verify Submission</h2>
            </div>
            <div class="info-section">
              <div class="info-row">
                <span class="info-label">Runner:</span>
                <span class="info-value">{item.runnerName}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Time:</span>
                <span class="info-value">{item.submitTime}</span>
              </div>
            </div>
            <div class="image-container">
              <img src={item.proofImage} alt="Proof" class="proof-img" />
            </div>
            <div class="action-buttons">
              <button class="btn btn-reject" on:click={() => handleReject(item)}
                >REJECT</button
              >
              <button
                class="btn btn-confirm"
                on:click={() => handleConfirm(item)}>CONFIRM</button
              >
            </div>
          </div>
        {/each}
      {/if}
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
  :global(textarea),
  :global(select),
  :global(span),
  :global(p),
  :global(h1), :global(h2), :global(h3), :global(h4), :global(h5), :global(h6) {
    font-family: "Inter", sans-serif !important;
  }

  :global(.swal2-popup),
  :global(.swal2-title),
  :global(.swal2-html-container),
  :global(.swal2-confirm),
  :global(.swal2-cancel),
  :global(.swal2-validation-message),
  :global(.swal2-radio label) {
    font-family: "Inter", sans-serif !important;
  }
  

  :global(.swal2-container) {
    backdrop-filter: blur(8px) !important;
    background: rgba(0, 0, 0, 0.6) !important;
  }
  
  :global(.my-swal-popup) {
    border-radius: 20px !important;
    padding-bottom: 20px !important;
    background-color: #ffffff !important;
  }

  :global(.swal-reject-container) {
    text-align: left;
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 10px;
  }

  :global(.radio-item) {
    display: flex;
    align-items: center;
    cursor: pointer;
    font-size: 14px;
    color: #374151;
    padding: 4px 0;
  }
  :global(.radio-item input) {
    margin-right: 12px;
    width: 18px;
    height: 18px;
    cursor: pointer;
    accent-color: #ef4444;
  }
  :global(.radio-item span) {
    font-weight: 500;
  }

  :global(.swal-custom-textarea) {
    width: 100% !important;
    box-sizing: border-box !important;
    margin-top: 12px !important;
    padding: 12px !important;
    border-radius: 8px !important;
    background-color: #ffffff !important; 
    border: 1px solid #e5e7eb !important; 
    color: #1f2937 !important; 
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05) !important;
    font-family: "Inter", sans-serif !important; 
    font-size: 14px !important;
    min-height: 80px;
    resize: vertical;
  }

  :global(.swal-custom-textarea::placeholder) {
    color: #9ca3af !important;
    font-family: "Inter", sans-serif !important;
  }

  :global(.swal-custom-textarea:focus) {
    outline: none !important;
    border-color: #d1d5db !important;
    box-shadow: 0 0 0 3px rgba(229, 231, 235, 0.5) !important;
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
    background: rgba(17, 24, 39, 0.85);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(17, 24, 39, 0.85);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .header-inner {
    width: 100%;
    max-width: 400px;
    padding: 0 20px;
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
    z-index: 60;
  }
  .back-btn:hover {
    background: rgba(255, 255, 255, 0.2);
  }
  .page-title {
    color: white;
    font-size: 28px;
    font-weight: 700;
    letter-spacing: 1px;
  }
  .scroll-container {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    -webkit-overflow-scrolling: touch;
    padding-top: 110px;
    padding-bottom: 40px;
  }
  .scroll-container::-webkit-scrollbar {
    display: none;
  }
  .content-wrapper {
    width: 100%;
    max-width: 400px;
    margin: 0 auto;
    padding: 0 20px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    box-sizing: border-box;
  }
  .verify-card {
    background: white;
    border-radius: 20px;
    padding: 20px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    display: flex;
    flex-direction: column;
    gap: 16px;
    transition: transform 0.2s;
  }
  .verify-card:active {
    transform: scale(0.98);
  }
  .card-heading {
    font-size: 16px;
    font-weight: 700;
    color: #111827;
    margin: 0;
  }
  .info-section {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 14px;
    color: #374151;
  }
  .info-label {
    font-weight: 600;
    color: #111827;
  }
  .image-container {
    width: 100%;
    height: 220px;
    background: #f3f4f6;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid #e5e7eb;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .proof-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .action-buttons {
    display: flex;
    gap: 10px;
  }
  .btn {
    flex: 1;
    padding: 12px;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    border: none;
    transition: 0.2s;
  }
  .btn:active {
    transform: scale(0.96);
  }
  .btn-reject {
    background: #b4151d;
    color: white;
    border: 1px solid #fca5a5;
  }
  .btn-confirm {
    background: #10b981;
    color: white;
    box-shadow: 0 4px 10px rgba(16, 185, 129, 0.3);
  }
  .empty-state {
    text-align: center;
    color: rgba(255, 255, 255, 0.5);
    margin-top: 50px;
  }
</style>