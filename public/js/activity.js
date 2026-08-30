/* ==========================================================================
   My Activity — offers received on your requests
   Endpoints unchanged: GET /api/offers/received, PATCH /api/offers/:id/accept
   and /reject.
   ========================================================================== */

document.addEventListener("DOMContentLoaded", async () => {

  const token = CS.requireAuth();
  if (!token) return;

  CS.renderAppBar("activity");
  CS.getCurrentUser().then(CS.fillAppBarUser);

  const container = document.getElementById("offersContainer");

  /* ---- States ----------------------------------------------------------- */

  function showSkeletons() {
    container.innerHTML = Array.from({ length: 3 }).map(() =>
      '<div class="offer-card is-loading">' +
        '<div class="skeleton" style="width:40px;height:40px;border-radius:999px"></div>' +
        '<div style="flex:1">' +
          '<div class="skeleton" style="width:45%;height:14px;margin-bottom:10px"></div>' +
          '<div class="skeleton" style="width:70%;height:12px"></div>' +
        "</div>" +
      "</div>"
    ).join("");
  }

  function showState(iconName, title, text, actionHtml) {
    container.innerHTML =
      '<div class="state">' +
        '<span class="state-icon">' + CS.icon(iconName) + "</span>" +
        "<h3>" + CS.escapeHtml(title) + "</h3>" +
        "<p>" + CS.escapeHtml(text) + "</p>" +
        (actionHtml || "") +
      "</div>";
  }

  /* ---- Card ------------------------------------------------------------- */

  function cardHtml(offer) {
    const helper = offer.offeredBy || {};
    const need = offer.need || {};

    const meta = [helper.branch, helper.batch ? "Batch " + helper.batch : ""]
      .filter(Boolean)
      .map(CS.escapeHtml)
      .join(" · ");

    return '<article class="offer-card" data-id="' + CS.escapeHtml(offer._id) + '">' +

      '<div class="offer-top">' +
        '<span class="avatar">' + CS.escapeHtml(CS.initials(helper.name)) + "</span>" +
        '<div class="offer-who">' +
          '<p class="offer-name">' + CS.escapeHtml(helper.name || "A student") + "</p>" +
          (meta ? '<p class="offer-meta">' + meta + "</p>" : "") +
        "</div>" +
        '<span class="badge badge-open">Wants to help</span>' +
      "</div>" +

      '<div class="offer-need">' +
        '<p class="offer-need-label">On your request</p>' +
        '<p class="offer-item">' + CS.escapeHtml(need.itemName || "Your request") + "</p>" +
        (need.description
          ? '<p class="offer-desc clamp-2">' + CS.escapeHtml(need.description) + "</p>"
          : "") +
      "</div>" +

      '<div class="offer-actions">' +
        '<button type="button" class="btn btn-secondary btn-sm reject-btn">Decline</button>' +
        '<button type="button" class="btn btn-primary btn-sm accept-btn">Accept help</button>' +
      "</div>" +

    "</article>";
  }

  /* ---- Accept / reject --------------------------------------------------- */

  async function respondToOffer(card, action) {
    const buttons = card.querySelectorAll("button");
    buttons.forEach(b => { b.disabled = true; });

    try {
      const response = await fetch("/api/offers/" + card.dataset.id + "/" + action, {
        method: "PATCH",
        headers: CS.authHeaders()
      });

      const result = await response.json();

      if (!response.ok) {
        CS.toast(result.message || "That did not go through.", "error");
        buttons.forEach(b => { b.disabled = false; });
        return;
      }

      CS.toast(
        result.message || (action === "accept" ? "Offer accepted." : "Offer declined."),
        action === "accept" ? "success" : null
      );

      // Removing just this card keeps scroll position instead of reloading.
      card.classList.add("is-leaving");
      setTimeout(() => {
        card.remove();
        if (!container.querySelector(".offer-card")) renderEmpty();
      }, 180);

    } catch (error) {
      console.log("Offer response error:", error);
      CS.toast("Network problem. Try again.", "error");
      buttons.forEach(b => { b.disabled = false; });
    }
  }

  function renderEmpty() {
    showState(
      "inbox",
      "No offers waiting",
      "When someone offers to help with one of your requests, it will appear here.",
      '<a href="post-need.html" class="btn btn-primary btn-sm">Post a need</a>'
    );
  }

  /* ---- Load -------------------------------------------------------------- */

  showSkeletons();

  try {
    const response = await fetch("/api/offers/received", { headers: CS.authHeaders() });
    const data = await response.json();

    container.setAttribute("aria-busy", "false");

    if (!response.ok) {
      showState("alert-circle", "Could not load your activity", data.message || "Please try again in a moment.");
      return;
    }

    const pending = (data.offers || []).filter(offer => offer.status === "pending");

    if (pending.length === 0) {
      renderEmpty();
      return;
    }

    container.innerHTML = pending.map(cardHtml).join("");

    container.querySelectorAll(".offer-card").forEach((card) => {
      card.querySelector(".accept-btn").addEventListener("click", () => respondToOffer(card, "accept"));
      card.querySelector(".reject-btn").addEventListener("click", () => respondToOffer(card, "reject"));
    });

  } catch (error) {
    console.log("Activity load error:", error);
    container.setAttribute("aria-busy", "false");
    showState("alert-circle", "Could not load your activity", "Check your connection and refresh the page.");
  }

});
