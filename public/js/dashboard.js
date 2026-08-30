/* ==========================================================================
   Explore / Dashboard
   Data source is unchanged: GET /api/needs (public) and POST /api/offers/:needId.
   Search, quick filters and sorting all run over the real response — nothing
   on this page is hardcoded.
   ========================================================================== */

document.addEventListener("DOMContentLoaded", async () => {

  const token = CS.requireAuth();
  if (!token) return;

  CS.renderAppBar("dashboard");

  const container = document.getElementById("requestsContainer");
  const countEl = document.getElementById("requestsCount");
  const searchInput = document.getElementById("searchInput");
  const searchForm = document.getElementById("searchForm");
  const searchClear = document.getElementById("searchClear");
  const quickFilters = document.getElementById("quickFilters");
  const sortControls = document.getElementById("sortControls");

  document.getElementById("searchIcon").innerHTML = CS.icon("search");
  searchClear.innerHTML = CS.icon("x", "icon-sm");

  // View state, all client-side over the fetched list
  let allNeeds = [];
  let currentUserId = null;
  let query = "";
  let sort = "latest";          // latest | urgent | today
  let openOnly = false;

  /* ---- Filter controls ------------------------------------------------- */

  // Keyword shortcuts. Each one matches against the item name + description of
  // real requests, so a chip never promises a category the data cannot back up.
  const QUICK_FILTERS = [
    { label: "All", terms: [] },
    { label: "Electronics", terms: ["calculator", "laptop", "charger", "camera", "dslr", "tripod", "cable", "drive", "headphone", "speaker", "adapter"] },
    { label: "Books", terms: ["book", "textbook", "novel", "notes", "guide"] },
    { label: "Academic", terms: ["lab", "coat", "apron", "instrument", "drafter", "exam", "assignment", "project", "kit"] },
    { label: "Sports", terms: ["bat", "ball", "racket", "racquet", "cycle", "bicycle", "gym", "shoes", "jersey"] }
  ];

  let activeFilter = QUICK_FILTERS[0];

  quickFilters.innerHTML = QUICK_FILTERS.map((filter, index) =>
    '<button type="button" class="chip" data-filter="' + index + '" aria-pressed="' + (index === 0) + '">' +
      CS.escapeHtml(filter.label) +
    '</button>'
  ).join("");

  quickFilters.addEventListener("click", (event) => {
    const button = event.target.closest("[data-filter]");
    if (!button) return;
    activeFilter = QUICK_FILTERS[Number(button.dataset.filter)];
    quickFilters.querySelectorAll(".chip").forEach((chip) => {
      chip.setAttribute("aria-pressed", String(chip === button));
    });
    render();
  });

  const SORTS = [
    { key: "latest", label: "Latest" },
    { key: "urgent", label: "Urgent" },
    { key: "today", label: "Today" }
  ];

  sortControls.innerHTML =
    SORTS.map((option) =>
      '<button type="button" class="chip" data-sort="' + option.key + '" aria-pressed="' + (option.key === sort) + '">' +
        option.label +
      '</button>'
    ).join("") +
    '<button type="button" class="chip" id="openOnlyChip" aria-pressed="false">' +
      CS.icon("check", "icon-sm") + 'Open only' +
    '</button>';

  sortControls.addEventListener("click", (event) => {
    const sortButton = event.target.closest("[data-sort]");
    if (sortButton) {
      sort = sortButton.dataset.sort;
      sortControls.querySelectorAll("[data-sort]").forEach((chip) => {
        chip.setAttribute("aria-pressed", String(chip === sortButton));
      });
      render();
      return;
    }

    const openButton = event.target.closest("#openOnlyChip");
    if (openButton) {
      openOnly = !openOnly;
      openButton.setAttribute("aria-pressed", String(openOnly));
      render();
    }
  });

  searchForm.addEventListener("submit", (event) => event.preventDefault());

  let searchTimer;
  searchInput.addEventListener("input", () => {
    searchClear.hidden = searchInput.value.length === 0;
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      query = searchInput.value.trim().toLowerCase();
      render();
    }, 180);
  });

  searchClear.addEventListener("click", () => {
    searchInput.value = "";
    searchClear.hidden = true;
    query = "";
    render();
    searchInput.focus();
  });

  /* ---- States ---------------------------------------------------------- */

  function showSkeletons() {
    container.setAttribute("aria-busy", "true");
    container.innerHTML = Array.from({ length: 4 }).map(() =>
      '<div class="skeleton-card" aria-hidden="true">' +
        '<div class="skeleton-row">' +
          '<div class="skeleton" style="width:40px;height:40px;border-radius:999px"></div>' +
          '<div style="flex:1">' +
            '<div class="skeleton skeleton-line" style="width:45%"></div>' +
            '<div class="skeleton skeleton-line" style="width:30%;margin-bottom:0"></div>' +
          '</div>' +
        '</div>' +
        '<div class="skeleton skeleton-line" style="width:60%;height:18px"></div>' +
        '<div class="skeleton skeleton-line" style="width:100%"></div>' +
        '<div class="skeleton skeleton-line" style="width:80%;margin-bottom:0"></div>' +
      '</div>'
    ).join("");
  }

  function showState(iconName, title, message, actionHtml) {
    container.setAttribute("aria-busy", "false");
    container.innerHTML =
      '<div class="state">' +
        '<span class="state-icon">' + CS.icon(iconName, "icon-lg") + '</span>' +
        '<h3>' + CS.escapeHtml(title) + '</h3>' +
        '<p>' + CS.escapeHtml(message) + '</p>' +
        (actionHtml || "") +
      '</div>';
  }

  /* ---- Card template --------------------------------------------------- */

  function cardHtml(need) {
    const person = need.requestedBy || {};
    const isOwn = currentUserId && person._id === currentUserId;

    const badges = [];
    if (CS.isUrgent(need)) {
      badges.push('<span class="badge badge-urgent">' + CS.icon("clock", "icon-sm") + 'Urgent</span>');
    }
    if (need.status === "matched") {
      badges.push('<span class="badge badge-matched">Matched</span>');
    } else if (need.status === "closed") {
      badges.push('<span class="badge badge-closed">Closed</span>');
    } else {
      badges.push('<span class="badge badge-open">Open</span>');
    }

    // Verification is only shown when the API actually reports it; the current
    // /api/needs response does not populate it, so this stays hidden until it does.
    const verified = person.verificationStatus === "verified"
      ? CS.icon("shield-check", "icon-sm verified")
      : "";

    const branchBatch = [person.branch, person.batch ? "Batch " + person.batch : ""]
      .filter(Boolean)
      .join(" · ");

    const duration = CS.formatDuration(need.durationValue, need.durationUnit);

    const action = isOwn
      ? '<span class="own-note">This is your request</span>' +
        '<a class="btn btn-secondary btn-sm" href="activity.html">See offers</a>'
      : (need.status === "open"
          ? '<button type="button" class="btn btn-primary btn-sm help-btn" data-id="' + need._id + '">' +
              CS.icon("hand-helping", "icon-sm") + 'I can help' +
            '</button>'
          : '<button type="button" class="btn btn-secondary btn-sm" disabled>Already matched</button>');

    return '' +
      '<article class="request-card">' +

        '<div class="request-person">' +
          '<span class="avatar">' + CS.escapeHtml(CS.initials(person.name)) + '</span>' +
          '<span class="request-person-text">' +
            '<span class="request-name">' + CS.escapeHtml(person.name || "Student") + verified + '</span>' +
            (branchBatch ? '<span class="request-meta">' + CS.escapeHtml(branchBatch) + '</span>' : "") +
          '</span>' +
          '<span class="request-posted">' + CS.escapeHtml(CS.timeAgo(need.createdAt)) + '</span>' +
        '</div>' +

        '<div>' +
          '<div class="request-item-head">' +
            '<h3 class="request-item">' + CS.escapeHtml(need.itemName) + '</h3>' +
            '<span class="request-badges">' + badges.join("") + '</span>' +
          '</div>' +
          '<p class="request-desc clamp-2">' + CS.escapeHtml(need.description) + '</p>' +
        '</div>' +

        '<div class="request-facts">' +
          '<span class="request-fact">' + CS.icon("calendar", "icon-sm") +
            'Needed <strong>' + CS.escapeHtml(CS.formatNeededBy(need.neededBy)) + '</strong></span>' +
          (duration
            ? '<span class="request-fact">' + CS.icon("hourglass", "icon-sm") +
              'For <strong>' + CS.escapeHtml(duration) + '</strong></span>'
            : "") +
        '</div>' +

        '<div class="request-actions">' + action + '</div>' +

      '</article>';
  }

  /* ---- Render ---------------------------------------------------------- */

  function matchesFilter(need) {
    if (activeFilter.terms.length === 0) return true;
    const haystack = (need.itemName + " " + need.description).toLowerCase();
    return activeFilter.terms.some((term) => haystack.includes(term));
  }

  function matchesQuery(need) {
    if (!query) return true;
    const person = need.requestedBy || {};
    const haystack = [need.itemName, need.description, person.name, person.branch]
      .filter(Boolean).join(" ").toLowerCase();
    return haystack.includes(query);
  }

  function render() {
    let needs = allNeeds.filter((need) => matchesFilter(need) && matchesQuery(need));

    if (openOnly) {
      needs = needs.filter((need) => need.status === "open");
    }

    if (sort === "today") {
      needs = needs.filter(CS.isDueToday);
    }

    if (sort === "urgent") {
      // Soonest deadline first; requests already past their time sink to the bottom.
      needs = needs.slice().sort((a, b) => {
        const aDue = new Date(a.neededBy).getTime();
        const bDue = new Date(b.neededBy).getTime();
        const now = Date.now();
        const aPast = aDue < now;
        const bPast = bDue < now;
        if (aPast !== bPast) return aPast ? 1 : -1;
        return aDue - bDue;
      });
    } else if (sort === "today") {
      needs = needs.slice().sort((a, b) => new Date(a.neededBy) - new Date(b.neededBy));
    } else {
      needs = needs.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    countEl.textContent = needs.length === 1
      ? "1 request"
      : needs.length + " requests";

    if (needs.length === 0) {
      const filtering = query || activeFilter.terms.length > 0 || sort !== "latest" || openOnly;
      if (filtering) {
        showState(
          "search",
          "No matching requests",
          "Try a different word, or clear the filters to see everything on campus."
        );
      } else {
        showState(
          "inbox",
          "No requests yet",
          "Nobody has asked for anything yet. Be the first to post what you need.",
          '<a class="btn btn-primary" href="post-need.html">Post a Need</a>'
        );
      }
      return;
    }

    container.setAttribute("aria-busy", "false");
    container.innerHTML = needs.map(cardHtml).join("");
  }

  /* ---- Offer help ------------------------------------------------------ */

  container.addEventListener("click", async (event) => {

    const button = event.target.closest(".help-btn");
    if (!button) return;

    const needId = button.dataset.id;
    const originalHtml = button.innerHTML;

    button.disabled = true;
    button.innerHTML = '<span class="spinner"></span>Sending';

    try {
      const response = await fetch("/api/offers/" + needId, {
        method: "POST",
        headers: CS.authHeaders()
      });

      const data = await response.json();

      if (response.ok) {
        button.innerHTML = CS.icon("check", "icon-sm") + "Offer sent";
        CS.toast("Help offer sent. They will see it on their request.", "success");
      } else if (response.status === 409) {
        // Already offered — keep it disabled and say so plainly.
        button.innerHTML = CS.icon("check", "icon-sm") + "Already offered";
        CS.toast(data.message || "You have already offered help.");
      } else {
        button.disabled = false;
        button.innerHTML = originalHtml;
        CS.toast(data.message || "Could not send your offer.", "error");
      }

    } catch (error) {
      console.log("Offer error:", error);
      button.disabled = false;
      button.innerHTML = originalHtml;
      CS.toast("Unable to send offer. Check your connection.", "error");
    }
  });

  /* ---- Load ------------------------------------------------------------ */

  showSkeletons();

  // Greeting + navbar identity, from the existing /api/users/me endpoint.
  CS.getCurrentUser().then((payload) => {
    if (!payload || !payload.user) return;
    currentUserId = payload.user._id;
    document.getElementById("dashGreeting").textContent =
      CS.greeting() + ", " + payload.user.name.split(" ")[0];
    CS.fillAppBarUser(payload.user);
    if (allNeeds.length) render();   // re-render so own requests are marked
  });

  try {
    const response = await fetch("/api/needs");

    if (!response.ok) throw new Error("Request failed: " + response.status);

    const data = await response.json();
    allNeeds = Array.isArray(data.needs) ? data.needs : [];
    render();

  } catch (error) {
    console.log("Needs load error:", error);
    showState(
      "alert-circle",
      "Could not load requests",
      "Something went wrong while reaching the server. Please try again.",
      '<button type="button" class="btn btn-secondary" onclick="location.reload()">Retry</button>'
    );
  }

});
