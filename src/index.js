// ===============================
// Safe Keystroke + Input Tracking
// ===============================

// --- Utility: Check if field is sensitive ---
function isSensitiveField(el) {
    if (!el) return false;
    const type = el.type ? el.type.toLowerCase() : "";
    const name = (el.name || "").toLowerCase();
    const autocomplete = (el.autocomplete || "").toLowerCase();
  
    return (
      type === "password" ||
      type === "hidden" ||
      name.includes("card") ||
      name.includes("cvv") ||
      name.includes("password") ||
      name.includes("ssn") ||
      autocomplete.startsWith("cc-")
    );
  }
  
  // --- Utility: Sanitize text before logging ---
  function sanitizeText(text) {
    if (!text) return "";
    const onlyDigits = /^\d+$/;
  
    if (onlyDigits.test(text)) {
      return `Typed [${text.length}] digits`; // hides actual numbers
    }
    return `Typed [${text.length}] characters`; // hides raw content
  }
  
  // --- Utility: Debounce function ---
  function debounce(fn, delay) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn.apply(this, args), delay);
    };
  }
  
  // --- Core: Setup Typing Tracking ---
  function setupTypingTracking() {
    try {
      const debouncedLog = debounce((target, value) => {
        if (isSensitiveField(target)) return; // ignore sensitive fields
  
        const sanitized = sanitizeText(value);
        console.log("Keystroke event:", {
          element: target.tagName,
          type: target.type,
          sanitized,
        });
  
        // Example: send to server (make sure backend is HTTPS + secured)
        // fetch("/track", {
        //   method: "POST",
        //   headers: { "Content-Type": "application/json" },
        //   body: JSON.stringify({ sanitized }),
        // });
      }, 400);
  
      // --- Observer: Detect live DOM text changes ---
      const observer = new MutationObserver((mutations) => {
        try {
          for (const mutation of mutations) {
            if (mutation.type === "characterData") {
              const el = mutation.target.parentElement;
              if (!el || isSensitiveField(el)) continue;
  
              const value = mutation.target.nodeValue;
              debouncedLog(el, value);
            }
          }
        } catch (err) {
          console.warn("Observer error:", err);
        }
      });
  
      // --- Attach listeners to inputs ---
      function attachListeners() {
        document.querySelectorAll("input, textarea").forEach((input) => {
          if (isSensitiveField(input)) return;
  
          input.addEventListener("input", (e) => {
            debouncedLog(e.target, e.target.value);
          });
        });
      }
  
      // Start observing body
      observer.observe(document.body, {
        subtree: true,
        characterData: true,
        childList: true,
      });
  
      attachListeners();
  
      // Return cleanup function
      return () => observer.disconnect();
    } catch (err) {
      console.error("Error in setupTypingTracking:", err);
    }
  }
  
  // --- Consent Check ---
  function initTracking() {
    const userConsented = localStorage.getItem("trackingConsent") === "true";
  
    if (userConsented) {
      console.log("✅ Tracking enabled with consent.");
      return setupTypingTracking();
    } else {
      console.log("❌ Tracking not started (no consent).");
      return () => {};
    }
  }
  
  // Start tracking only after DOM loaded
  document.addEventListener("DOMContentLoaded", () => {
    initTracking();
  });
  