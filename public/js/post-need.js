/* ==========================================================================
   Post a Need
   Unchanged contract: POST /api/needs with
   { itemName, description, neededBy, durationValue, durationUnit }.
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {

  const token = CS.requireAuth();
  if (!token) return;

  CS.renderAppBar("post-need");

  const form = document.getElementById("needForm");
  const submitBtn = document.getElementById("submitBtn");
  const successMessage = document.getElementById("successMessage");
  const messageEl = document.getElementById("Message");
  const description = document.getElementById("description");
  const countEl = document.getElementById("descriptionCount");

  /* ---- Static chrome ---------------------------------------------------- */

  document.getElementById("backLink").insertAdjacentHTML("afterbegin", CS.icon("arrow-left", "icon-sm"));
  document.getElementById("visibilityNote").insertAdjacentHTML("afterbegin", CS.icon("shield-check", "icon-sm"));

  // Suggestions only prefill the item field; they are not a taxonomy.
  const SUGGESTIONS = ["Calculator", "Textbook", "Lab coat", "DSLR", "Tripod", "Charger"];

  const suggestionBox = document.getElementById("itemSuggestions");
  const itemName = document.getElementById("itemName");

  suggestionBox.innerHTML = SUGGESTIONS
    .map(s => '<button type="button" class="chip suggestion">' + CS.escapeHtml(s) + "</button>")
    .join("");

  suggestionBox.querySelectorAll(".suggestion").forEach((chip) => {
    chip.addEventListener("click", () => {
      itemName.value = chip.textContent;
      CSAuth.clearFieldError(itemName);
      itemName.focus();
    });
  });

  /* ---- Character counter ------------------------------------------------ */

  const paintCount = () => {
    countEl.textContent = description.value.length + " / 300";
  };
  description.addEventListener("input", paintCount);
  paintCount();

  /* ---- Sensible datetime bounds ----------------------------------------- */

  // A request for a moment already past helps nobody, so the picker starts now.
  const neededBy = document.getElementById("neededBy");
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  neededBy.min = now.toISOString().slice(0, 16);

  /* ---- Submit ------------------------------------------------------------ */

  form.addEventListener("submit", async (event) => {

    event.preventDefault();
    CSAuth.setMessage(messageEl, "");

    if (!CSAuth.validateForm(form)) return;

    // Past dates pass the required check, so they are caught separately.
    if (neededBy.value && new Date(neededBy.value).getTime() < Date.now()) {
      CSAuth.setFieldError(neededBy, "Pick a time in the future");
      neededBy.focus();
      return;
    }

    const payload = {
      itemName: itemName.value.trim(),
      description: description.value.trim(),
      neededBy: neededBy.value,
      durationValue: document.getElementById("durationValue").value,
      durationUnit: document.getElementById("durationUnit").value
    };

    CSAuth.setLoading(submitBtn, true, "Posting");

    try {
      const response = await fetch("/api/needs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        showSuccess(payload.itemName);
        return;
      }

      CSAuth.setMessage(messageEl, data.message || "We could not post your request.", "error");
      CSAuth.setLoading(submitBtn, false);

    } catch (error) {
      console.log("Error posting need:", error);
      CSAuth.setMessage(messageEl, "Network problem. Check your connection and try again.", "error");
      CSAuth.setLoading(submitBtn, false);
    }
  });

  // Replaces the form with a confirmation so the page has a real end state
  // instead of an empty form and a green line of text.
  function showSuccess(item) {
    successMessage.innerHTML =
      '<span class="success-icon">' + CS.icon("check-circle") + "</span>" +
      "<h2>Your request is live</h2>" +
      "<p>Students on your campus can now see that you need " +
      "<strong>" + CS.escapeHtml(item) + "</strong>. Offers to help show up under My Activity.</p>" +
      '<div class="success-actions">' +
        '<a href="./dashboard.html" class="btn btn-primary">Back to Explore</a>' +
        '<a href="./activity.html" class="btn btn-secondary">View My Activity</a>' +
      "</div>";

    successMessage.classList.add("show");
    form.reset();
    form.hidden = true;
    paintCount();
    successMessage.focus();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

});
