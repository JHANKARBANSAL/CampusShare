/* ==========================================================================
   Profile
   Endpoints unchanged: GET /api/users/me, POST /api/users/me/profile-photo,
   POST /api/users/me/id-card, GET /api/needs/mine.
   ========================================================================== */

document.addEventListener("DOMContentLoaded", async () => {

  const token = CS.requireAuth();
  if (!token) return;

  CS.renderAppBar("profile");

  /* ---- Static icons ------------------------------------------------------ */

  document.getElementById("changePhotoBtn").innerHTML = CS.icon("camera", "icon-sm");
  document.getElementById("verifyBanner").insertAdjacentHTML("afterbegin", CS.icon("shield-check", "icon-sm"));
  document.getElementById("verifiedBadge").insertAdjacentHTML("afterbegin", CS.icon("check-circle", "icon-sm"));
  document.getElementById("postNeedBtn").insertAdjacentHTML("afterbegin", CS.icon("plus", "icon-sm"));
  document.getElementById("logoutBtn").insertAdjacentHTML("afterbegin", CS.icon("log-out", "icon-sm"));

  document.querySelectorAll(".detail-icon[data-icon]").forEach((el) => {
    el.innerHTML = CS.icon(el.dataset.icon, "icon-sm");
  });

  /* ---- Controls are wired first, so a failed data load never leaves the
         page inert. ---------------------------------------------------------- */

  const changePhotoBtn = document.getElementById("changePhotoBtn");
  const photoInput = document.getElementById("photoInput");

  changePhotoBtn.addEventListener("click", () => photoInput.click());

  photoInput.addEventListener("change", async () => {
    const file = photoInput.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("profileImage", file);

    changePhotoBtn.disabled = true;

    try {
      const response = await fetch("/api/users/me/profile-photo", {
        method: "POST",
        headers: CS.authHeaders(),
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        document.getElementById("profilePhoto").src = data.profileImage;
        CS.fillAppBarUser({ name: document.getElementById("navName").textContent, profileImage: data.profileImage });
        CS.toast("Profile photo updated.", "success");
      } else {
        CS.toast(data.message || "Could not upload that photo.", "error");
      }
    } catch (error) {
      console.log("Photo upload error:", error);
      CS.toast("Photo upload failed. Try again.", "error");
    } finally {
      changePhotoBtn.disabled = false;
    }
  });

  const verifyBanner = document.getElementById("verifyBanner");
  const idCardInput = document.getElementById("idCardInput");

  verifyBanner.addEventListener("click", () => idCardInput.click());

  idCardInput.addEventListener("change", async () => {
    const file = idCardInput.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("idCard", file);

    verifyBanner.disabled = true;

    try {
      const response = await fetch("/api/users/me/id-card", {
        method: "POST",
        headers: CS.authHeaders(),
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        showVerificationState(data.verificationStatus);
        CS.toast("ID card submitted.", "success");
      } else {
        CS.toast(data.message || "Could not upload your ID card.", "error");
      }
    } catch (error) {
      console.log("ID card upload error:", error);
      CS.toast("ID card upload failed. Try again.", "error");
    } finally {
      verifyBanner.disabled = false;
    }
  });

  document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("token");
    window.location.href = "./login.html";
  });

  /* ---- Helpers ----------------------------------------------------------- */

  function showVerificationState(status) {
    const banner = document.getElementById("verifyBanner");
    const badge = document.getElementById("verifiedBadge");
    const verified = status === "verified";

    banner.classList.toggle("hidden", verified);
    badge.classList.toggle("hidden", !verified);
  }

  function statusBadge(status) {
    if (status === "open") return '<span class="badge badge-open">Open</span>';
    if (status === "matched") return '<span class="badge badge-matched">Matched</span>';
    return '<span class="badge badge-closed">Closed</span>';
  }

  /* ---- Profile + stats ---------------------------------------------------- */

  try {
    const response = await fetch("/api/users/me", { headers: CS.authHeaders() });
    const data = await response.json();

    if (!response.ok) {
      CS.toast(data.message || "Could not load your profile.", "error");
    } else {
      const user = data.user;
      const stats = data.stats || {};

      document.getElementById("profileName").textContent = user.name;
      document.getElementById("profileBranchBatch").textContent =
        [user.branch, user.batch ? "Batch " + user.batch : ""].filter(Boolean).join(" · ");

      document.getElementById("profileEmail").textContent = user.email;
      document.getElementById("profileEnrollment").textContent = user.enrollmentNumber;
      document.getElementById("profileBranch").textContent = user.branch;
      document.getElementById("profileBatch").textContent = user.batch;

      if (user.profileImage) document.getElementById("profilePhoto").src = user.profileImage;

      CS.fillAppBarUser(user);
      showVerificationState(user.verificationStatus);

      document.getElementById("statMyRequests").textContent = stats.myRequestsCount ?? 0;
      document.getElementById("statCompleted").textContent = stats.completedCount ?? 0;
      document.getElementById("statOngoing").textContent = stats.ongoingCount ?? 0;
      document.getElementById("statPeopleHelped").textContent = stats.peopleHelpedCount ?? 0;
    }
  } catch (error) {
    console.log("Profile load error:", error);
    CS.toast("Could not load your profile.", "error");
  }

  /* ---- My requests --------------------------------------------------------- */

  const container = document.getElementById("myRequestsContainer");

  container.innerHTML = Array.from({ length: 2 }).map(() =>
    '<div class="request-row"><div class="skeleton" style="width:100%;height:40px"></div></div>'
  ).join("");

  try {
    const response = await fetch("/api/needs/mine", { headers: CS.authHeaders() });
    const data = await response.json();

    container.setAttribute("aria-busy", "false");

    if (!response.ok) {
      container.innerHTML =
        '<div class="state"><span class="state-icon">' + CS.icon("alert-circle") + "</span>" +
        "<h3>Could not load your requests</h3><p>Please refresh the page.</p></div>";
      return;
    }

    const needs = data.needs || [];

    if (needs.length === 0) {
      container.innerHTML =
        '<div class="state"><span class="state-icon">' + CS.icon("package") + "</span>" +
        "<h3>No requests yet</h3>" +
        "<p>Post what you need and students on your campus can offer to help.</p>" +
        '<a href="post-need.html" class="btn btn-primary btn-sm">Post a need</a></div>';
      return;
    }

    container.innerHTML = needs.map(need =>
      '<article class="request-row">' +
        '<span class="request-icon">' + CS.icon("package", "icon-sm") + "</span>" +
        '<div class="request-info">' +
          "<h3>" + CS.escapeHtml(need.itemName) + "</h3>" +
          '<p class="clamp-2">' + CS.escapeHtml(need.description || "") + "</p>" +
          '<p class="request-when">' + CS.icon("clock", "icon-sm") +
            "<span>" + CS.escapeHtml(CS.formatNeededBy(need.neededBy)) + "</span></p>" +
        "</div>" +
        statusBadge(need.status) +
      "</article>"
    ).join("");

  } catch (error) {
    console.log("My requests error:", error);
    container.setAttribute("aria-busy", "false");
    container.innerHTML =
      '<div class="state"><span class="state-icon">' + CS.icon("alert-circle") + "</span>" +
      "<h3>Could not load your requests</h3><p>Check your connection and refresh.</p></div>";
  }

});
