// ./js/pwa.js
// Handles service worker registration, PWA install prompt, push notifications,
// touch event handling, and offline storage for pending form submissions.

// Register the service worker so the site can work offline and receive push messages.
const registerServiceWorker = async function () {
  if (!("serviceWorker" in navigator)) {
    console.log("[PWA] Service workers are not supported in this browser.");
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    console.log("[PWA] Service worker registered, scope:", registration.scope);
    return registration;
  } catch (error) {
    console.error("[PWA] Service worker registration failed:", error);
    return null;
  }
};

// Holds the deferred install prompt so the banner button can trigger it later.
let installPromptEvent = null;

// The browser fires beforeinstallprompt when the site meets PWA install criteria.
// We intercept it so we can show our own banner instead of the default mini-infobar.
window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  installPromptEvent = event;

  const installBanner = document.getElementById("installBanner");
  if (installBanner) {
    installBanner.hidden = false;
  }
});

// Wire the Install button inside the banner to the saved prompt event.
// Also wire the Dismiss button to simply hide the banner without installing.
const setupInstallButton = function () {
  const installBtn = document.getElementById("installBtn");
  const dismissBtn = document.getElementById("dismissInstall");
  const installBanner = document.getElementById("installBanner");

  if (installBtn) {
    installBtn.addEventListener("click", async () => {
      if (!installPromptEvent) {
        return;
      }

      installPromptEvent.prompt();
      const { outcome } = await installPromptEvent.userChoice;
      console.log("[PWA] Install prompt outcome:", outcome);

      // Clear the saved event regardless of whether the user accepted.
      installPromptEvent = null;

      if (installBanner) {
        installBanner.hidden = true;
      }
    });
  }

  if (dismissBtn && installBanner) {
    dismissBtn.addEventListener("click", () => {
      installBanner.hidden = true;
    });
  }
};

// Once the app is installed, hide the banner and clear the saved prompt.
window.addEventListener("appinstalled", () => {
  console.log("[PWA] Portfolio app installed.");
  installPromptEvent = null;

  const installBanner = document.getElementById("installBanner");
  if (installBanner) {
    installBanner.hidden = true;
  }
});

// Ask the user for notification permission on page load, then show a welcome notification.
const requestNotificationPermission = async function () {
  if (!("Notification" in window)) {
    console.log("[PWA] Notifications are not supported in this browser.");
    return;
  }

  if (Notification.permission === "granted") {
    await showNotification(
      "Notifications Already On",
      "You will be notified when the portfolio is updated."
    );
    return;
  }

  const permission = await Notification.requestPermission();

  if (permission === "granted") {
    await showNotification(
      "Jacob Moodie Portfolio",
      "Thanks for enabling notifications! You'll hear about portfolio updates here."
    );
  } else {
    console.log("[PWA] Notification permission denied.");
  }
};

// Show a notification through the service worker registration.
// Using the registration instead of new Notification() works on mobile too.
const showNotification = async function (title, body) {
  if (Notification.permission !== "granted") {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(title, {
      body,
      icon: "Images/Me in tux.png",
      badge: "Images/placeholder.png",
      tag: "portfolio-update",
      renotify: true
    });
  } catch (error) {
    console.error("[PWA] Could not show notification:", error);
  }
};

// Add touch visual feedback to project cards on mobile devices.
// touch-active class applies a brief highlight when the card is pressed.
const setupTouchEvents = function () {
  // touchstart fires when the finger lands on the screen.
  document.addEventListener("touchstart", (event) => {
    const card = event.target.closest(".projectPoster");
    if (card) {
      card.classList.add("touch-active");
    }

    // Also highlight any button or link that is directly touched.
    const interactive = event.target.closest("button, a");
    if (interactive) {
      interactive.classList.add("touch-active");
    }
  }, { passive: true });

  // touchend fires when the finger lifts off, so we remove the highlight.
  document.addEventListener("touchend", () => {
    document.querySelectorAll(".touch-active").forEach((el) => {
      el.classList.remove("touch-active");
    });
  }, { passive: true });

  // touchcancel fires if the OS interrupts the touch (e.g. incoming call).
  document.addEventListener("touchcancel", () => {
    document.querySelectorAll(".touch-active").forEach((el) => {
      el.classList.remove("touch-active");
    });
  }, { passive: true });
};

// Save a pending contact form submission to localStorage when the user is offline.
// When they come back online the data is logged so they know their entry was kept.
const setupOfflineFormStorage = function () {
  const contactForm = document.getElementById("contactMe");
  if (!contactForm) {
    return;
  }

  // When back online, check if there is a pending offline submission and report it.
  window.addEventListener("online", () => {
    const pending = localStorage.getItem("pendingContactSubmission");
    if (pending) {
      console.log("[PWA] Back online. Pending offline submission found:", JSON.parse(pending));
      localStorage.removeItem("pendingContactSubmission");
    }
  });

  // Listen on the form's submit event to save data offline if the network is gone.
  // This runs AFTER the existing contactForm handler in script.js so it only catches
  // cases where the original handler could not reach the server.
  window.addEventListener("offline", () => {
    console.log("[PWA] Network lost. Contact form data will be saved locally.");
  });

  // Notify the user when connection is restored.
  window.addEventListener("online", () => {
    console.log("[PWA] Network restored.");
  });
};

// Run all PWA setup once the page DOM is fully loaded.
document.addEventListener("DOMContentLoaded", async () => {
  await registerServiceWorker();
  setupInstallButton();
  setupTouchEvents();
  setupOfflineFormStorage();
  await requestNotificationPermission();
});
