document.addEventListener("DOMContentLoaded", () => {
  const notice = document.getElementById("notice");
  const dismissBtn = notice.querySelector(".dismiss");

  chrome.storage.local.get(["noticeShownCount", "noticeDismissed"], (data) => {
    const count = data.noticeShownCount || 0;
    const dismissed = data.noticeDismissed || false;

    // Show notice only if the notice hasn't been dismissed and has been shown less than 3 times
    if (!dismissed && count < 3) {
      notice.style.display = "block";

      // Increment count
      chrome.storage.local.set({ noticeShownCount: count + 1 });
    }
  });

  // When the user dismisses the notice manually
  dismissBtn.addEventListener("click", () => {
    notice.style.display = "none";
    chrome.storage.local.set({ noticeDismissed: true });
  });
});
