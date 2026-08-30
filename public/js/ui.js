/* ==========================================================================
   CampusShare — shared frontend helpers
   Loaded before every page script. Nothing here talks to the backend except
   getCurrentUser(), which reuses the existing GET /api/users/me endpoint.
   ========================================================================== */

const CS = (() => {

  /* ---- Auth ------------------------------------------------------------ */

  function getToken() {
    return localStorage.getItem("token");
  }

  // Pages that need a logged-in user call this first.
  function requireAuth() {
    const token = getToken();
    if (!token) {
      window.location.href = "./login.html";
      return null;
    }
    return token;
  }

  function authHeaders() {
    return { "Authorization": "Bearer " + getToken() };
  }

  // Profile + stats. Returns null instead of throwing so a failed call never
  // blocks the rest of the page from rendering.
  async function getCurrentUser() {
    try {
      const response = await fetch("/api/users/me", { headers: authHeaders() });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.log("getCurrentUser error:", error);
      return null;
    }
  }

  /* ---- Text safety ----------------------------------------------------- */

  // Every value coming from the API goes through this before it is put into
  // innerHTML, so a student's name or description can never inject markup.
  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function initials(name) {
    const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "?";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  /* ---- Dates ----------------------------------------------------------- */

  function isSameDay(a, b) {
    return a.getFullYear() === b.getFullYear()
      && a.getMonth() === b.getMonth()
      && a.getDate() === b.getDate();
  }

  // "Today, 9:00 AM" / "Tomorrow, 9:00 AM" / "12 Sep, 9:00 AM"
  function formatNeededBy(value) {
    const date = new Date(value);
    if (isNaN(date)) return "Date not set";

    const time = date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);

    if (isSameDay(date, now)) return "Today, " + time;
    if (isSameDay(date, tomorrow)) return "Tomorrow, " + time;

    return date.toLocaleDateString([], { day: "numeric", month: "short" }) + ", " + time;
  }

  function formatDuration(value, unit) {
    const amount = Number(value);
    if (!amount) return "";
    const label = amount === 1 ? String(unit).replace(/s$/, "") : unit;
    return amount + " " + label;
  }

  // "2h ago" style stamp for when a request was posted.
  function timeAgo(value) {
    const date = new Date(value);
    if (isNaN(date)) return "";
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return minutes + "m ago";
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return hours + "h ago";
    const days = Math.floor(hours / 24);
    if (days < 7) return days + "d ago";
    return date.toLocaleDateString([], { day: "numeric", month: "short" });
  }

  // A request is "urgent" when it is needed within the next 24 hours and is
  // still open. Derived from real data, not a backend field.
  function isUrgent(need) {
    if (need.status !== "open") return false;
    const due = new Date(need.neededBy).getTime();
    if (isNaN(due)) return false;
    const hoursLeft = (due - Date.now()) / 3600000;
    return hoursLeft >= 0 && hoursLeft <= 24;
  }

  function isDueToday(need) {
    const due = new Date(need.neededBy);
    if (isNaN(due)) return false;
    return isSameDay(due, new Date());
  }

  function greeting() {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }

  /* ---- Icons (Lucide paths, inlined so there is no extra dependency) ---- */

  const ICON_PATHS = {
    "book-open": '<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
    "home": '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
    "compass": '<circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>',
    "layers": '<path d="m12 2 9 5-9 5-9-5z"/><path d="m3 12 9 5 9-5"/><path d="m3 17 9 5 9-5"/>',
    "user": '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    "bell": '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    "search": '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    "plus": '<path d="M12 5v14"/><path d="M5 12h14"/>',
    "clock": '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    "hourglass": '<path d="M5 22h14"/><path d="M5 2h14"/><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"/><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/>',
    "calendar": '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="M8 2v4"/><path d="M16 2v4"/>',
    "hand-helping": '<path d="M11 12h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 14"/><path d="m7 18 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.75-2.91l-4.2 3.9"/><path d="m2 13 6 6"/>',
    "arrow-left": '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
    "arrow-right": '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    "check": '<path d="M20 6 9 17l-5-5"/>',
    "check-circle": '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
    "shield-check": '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
    "x": '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    "alert-circle": '<circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/>',
    "info": '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
    "inbox": '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
    "package": '<path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
    "mail": '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
    "id-card": '<path d="M16 10h2"/><path d="M16 14h2"/><path d="M6.17 15a3 3 0 0 1 5.66 0"/><circle cx="9" cy="11" r="2"/><rect x="2" y="5" width="20" height="14" rx="2"/>',
    "building": '<rect width="16" height="20" x="4" y="2" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M8 10h.01"/><path d="M16 10h.01"/><path d="M8 14h.01"/><path d="M16 14h.01"/>',
    "graduation-cap": '<path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>',
    "camera": '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z"/><circle cx="12" cy="13" r="3"/>',
    "log-out": '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
    "eye": '<path d="M2.06 12.35a1 1 0 0 1 0-.7 10.8 10.8 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.8 10.8 0 0 1-19.88 0"/><circle cx="12" cy="12" r="3"/>',
    "eye-off": '<path d="M10.73 5.08A10.4 10.4 0 0 1 12 5c4.6 0 8.6 3.1 9.94 7a10.6 10.6 0 0 1-2.17 3.5"/><path d="M6.6 6.6C4.4 8 2.9 9.9 2.06 12a10.8 10.8 0 0 0 13.34 6.4"/><path d="m2 2 20 20"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
    "users": '<path d="M18 21a8 8 0 0 0-12 0"/><circle cx="12" cy="11" r="4"/><circle cx="12" cy="12" r="10"/>',
    "sparkles": '<path d="M11.02 3.6a.55.55 0 0 1 1.03 0l1.7 4.6 4.6 1.7a.55.55 0 0 1 0 1.03l-4.6 1.7-1.7 4.6a.55.55 0 0 1-1.03 0l-1.7-4.6-4.6-1.7a.55.55 0 0 1 0-1.03l4.6-1.7z"/><path d="M20 3v4"/><path d="M18 5h4"/>',
    "map-pin": '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>'
  };

  // Returns an inline <svg>. Decorative by default (aria-hidden) — icon-only
  // controls carry their own aria-label on the button instead.
  function icon(name, className) {
    const path = ICON_PATHS[name];
    if (!path) {
      console.log("Unknown icon:", name);
      return "";
    }
    const classes = "icon" + (className ? " " + className : "");
    return '<svg class="' + classes + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + path + '</svg>';
  }

  /* ---- Toast ----------------------------------------------------------- */

  function toastRegion() {
    let region = document.getElementById("toastRegion");
    if (!region) {
      region = document.createElement("div");
      region.id = "toastRegion";
      region.className = "toast-region";
      region.setAttribute("role", "status");
      region.setAttribute("aria-live", "polite");
      document.body.appendChild(region);
    }
    return region;
  }

  function toast(message, type) {
    const region = toastRegion();
    const node = document.createElement("div");
    node.className = "toast" + (type ? " is-" + type : "");
    node.innerHTML =
      icon(type === "error" ? "alert-circle" : "check-circle") +
      "<span>" + escapeHtml(message) + "</span>";
    region.appendChild(node);
    setTimeout(() => node.remove(), 4000);
  }

  /* ---- Navbar ---------------------------------------------------------- */

  // Builds the shared app navigation. `active` is one of:
  // "dashboard" | "activity" | "profile" | "post-need"
  function renderAppBar(active) {
    const host = document.getElementById("appbar");
    if (!host) return;

    const link = (href, key, iconName, label) =>
      '<a href="' + href + '" class="nav-link' + (active === key ? " active" : "") + '"' +
      (active === key ? ' aria-current="page"' : "") + '>' +
      icon(iconName) + '<span>' + label + '</span></a>';

    host.className = "appbar";
    host.innerHTML =
      '<a href="dashboard.html" class="brand">' + icon("book-open", "icon-lg") + 'CampusShare</a>' +

      '<nav class="appbar-nav" aria-label="Main">' +
        link("dashboard.html", "dashboard", "compass", "Explore") +
        link("activity.html", "activity", "layers", "My Activity") +
      '</nav>' +

      '<div class="appbar-right">' +
        '<a href="post-need.html" class="btn btn-primary btn-sm nav-cta">' +
          icon("plus", "icon-sm") + '<span class="nav-cta-label">Post a Need</span>' +
        '</a>' +
        '<button type="button" class="icon-btn" id="navBell" aria-label="Notifications">' +
          icon("bell") + '<span class="dot" id="navBellDot" hidden></span>' +
        '</button>' +
        '<a href="profile.html" class="profile-chip" aria-label="Your profile">' +
          '<span class="avatar avatar-sm" id="navAvatarWrap">' +
            '<img id="navAvatar" src="../images/default-avatar.svg" alt="" hidden />' +
            '<span id="navInitials">&nbsp;</span>' +
          '</span>' +
          '<span class="profile-name" id="navName"></span>' +
        '</a>' +
      '</div>';

    const bottom = document.getElementById("bottomNav");
    if (bottom) {
      const bLink = (href, key, iconName, label, extra) =>
        '<a href="' + href + '" class="' + (extra || "") + (active === key ? " active" : "") + '"' +
        (active === key ? ' aria-current="page"' : "") + '>' +
        icon(iconName) + '<span>' + label + '</span></a>';

      bottom.className = "bottom-nav";
      bottom.setAttribute("aria-label", "Primary");
      bottom.innerHTML =
        bLink("dashboard.html", "dashboard", "home", "Home") +
        bLink("activity.html", "activity", "layers", "Activity") +
        bLink("post-need.html", "post-need", "plus", "Post", "post") +
        bLink("profile.html", "profile", "user", "Profile");
    }

    // The bell has no backend endpoint yet, so it explains itself instead of
    // pretending to open a notification centre.
    const bell = document.getElementById("navBell");
    if (bell) {
      bell.addEventListener("click", () => {
        toast("Offers on your requests appear under My Activity.");
      });
    }
  }

  // Fills the navbar identity once the user is known. Safe to call with null.
  function fillAppBarUser(user) {
    if (!user) return;
    const nameEl = document.getElementById("navName");
    const initialsEl = document.getElementById("navInitials");
    const avatarEl = document.getElementById("navAvatar");

    if (nameEl) nameEl.textContent = user.name || "";
    if (initialsEl) initialsEl.textContent = initials(user.name);

    if (avatarEl && user.profileImage) {
      avatarEl.src = user.profileImage;
      avatarEl.hidden = false;
      if (initialsEl) initialsEl.hidden = true;
    }
  }

  return {
    getToken, requireAuth, authHeaders, getCurrentUser,
    escapeHtml, initials,
    formatNeededBy, formatDuration, timeAgo, isUrgent, isDueToday, greeting,
    icon, toast, renderAppBar, fillAppBarUser
  };
})();
