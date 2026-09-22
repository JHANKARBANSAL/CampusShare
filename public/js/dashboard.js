// ==========================================================
// CampusShare - DASHBOARD
//
// Do kaam karta hai:
//   1. /api/needs se open requests laake cards banata hai
//   2. "I Can Help" dabane pe /api/transactions pe offer bhejta hai
//
// Ye dono cheezein pehle jaisi hi hain. Sirf card ka HTML
// naya hai (emoji ki jagah SVG icons) aur alert() ki jagah
// toast aa gaya hai.
// ==========================================================


// HTML Escaping to prevent XSS (Fix 1)
function escapeHTML(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Date ko chhota aur padhne layak banao.
function shortDate(value) {
    return new Date(value).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short"
    });
}


// ==========================================================
// 1. TOP HELPERS (Campus Hall of Fame)
// ==========================================================

async function loadTopHelpers() {
    const container = document.getElementById("topHelpersContainer");
    const section = document.getElementById("topHelpersSection");
    if (!container) return;

    try {
        const response = await fetch("/api/users/top-helpers");
        if (!response.ok) return;

        const data = await response.json();
        const helpers = data.topHelpers || [];

        if (helpers.length === 0) {
            if (section) section.style.display = "none";
            return;
        }

        if (section) section.style.display = "block";
        container.innerHTML = "";

        const medals = ["🥇", "🥈", "🥉", "4th", "5th"];

        helpers.forEach((helper, index) => {
            const card = document.createElement("div");
            card.className = "helper-card";

            const avatarContent = helper.profileImage
                ? `<img class="helper-avatar" src="${escapeHTML(helper.profileImage)}" alt="${escapeHTML(helper.name)}">`
                : `<div class="helper-avatar">${escapeHTML(helper.name.slice(0, 2).toUpperCase())}</div>`;

            card.innerHTML = `
                <span class="helper-rank">${medals[index] || index + 1}</span>
                ${avatarContent}
                <div class="helper-details">
                    <span class="helper-name">${escapeHTML(helper.name)}</span>
                    <span class="helper-badge-pill">${escapeHTML(helper.badge)}</span>
                </div>
                <span class="helper-count">${helper.helpCount} helped</span>
            `;

            container.appendChild(card);
        });

    } catch (err) {
        console.log("Top helpers load error:", err);
    }
}


// ==========================================================
// 2. OPEN NEEDS LOAD KARNA
// ==========================================================

document.addEventListener("DOMContentLoaded", async () => {

    loadTopHelpers();

    const container = document.getElementById("requestsContainer");

    try {

        const response = await fetch("/api/needs");
        const data = await response.json();

        const needs = data.needs || [];


        // Ek bhi request nahi hai
        if (needs.length === 0) {

            container.innerHTML =
                '<div class="empty-box">' +
                    '<img class="empty-art" ' +
                        'src="../images/Swipe Profiles-pana.png" alt="">' +
                    '<b class="empty-title">No open requests right now</b>' +
                    '<p class="empty-text">' +
                        "Nobody is looking for anything at the moment. " +
                        "Post what you need and someone will see it here." +
                    "</p>" +
                    '<a href="./post-need.html" class="btn btn-primary btn-sm">' +
                        icon("plus") + " Post a Need" +
                    "</a>" +
                "</div>";

            return;
        }


        // Heading ke saath count
        const countLabel = document.getElementById("requestsCount");

        if (countLabel) {
            countLabel.textContent = "· " + needs.length;
        }


        // Hero badge me bhi wahi number
        const badge = document.getElementById("openNeedsBadge");

        if (badge) {

            badge.textContent =
                needs.length === 1
                    ? "1 student needs help right now"
                    : needs.length + " students need help right now";
        }


        needs.forEach((need) => {

            const card = document.createElement("div");
            card.className = "request-card";

            const initials =
                escapeHTML(need.requestedBy.name.slice(0, 2).toUpperCase());

            const avatarHtml = need.requestedBy.profileImage
                ? '<img class="avatar" src="' + escapeHTML(need.requestedBy.profileImage) + '" style="object-fit:cover;" alt="">'
                : '<div class="avatar">' + initials + '</div>';

            const priorityBadge = need.isPriority
                ? '<span class="priority-pill">⭐ Priority Request • Helpful Member</span>'
                : '';


            card.innerHTML =

                priorityBadge +

                // ---- kaun maang raha hai ----
                '<div class="student-row">' +

                    avatarHtml +

                    '<div class="student-info">' +
                        '<p class="student-name">' +
                            escapeHTML(need.requestedBy.name) +
                        "</p>" +
                        '<p class="student-branch">' +
                            escapeHTML(need.requestedBy.branch) +
                            " · Batch " + escapeHTML(need.requestedBy.batch) +
                        "</p>" +
                    "</div>" +

                "</div>" +


                // ---- kya chahiye ----
                '<div class="item-info">' +
                    '<p class="item-title">' + escapeHTML(need.itemName) + "</p>" +
                    '<p class="item-desc">' + escapeHTML(need.description) + "</p>" +
                "</div>" +


                // ---- kab tak / kitne der ----
                '<div class="item-meta">' +

                    '<span class="chip">' +
                        icon("clock") +
                        escapeHTML(need.durationValue) + " " + escapeHTML(need.durationUnit) +
                    "</span>" +

                    '<span class="chip">' +
                        icon("calendar") +
                        "By " + shortDate(need.neededBy) +
                    "</span>" +

                "</div>" +


                // ---- button ----
                '<div class="action-buttons">' +
                    '<button class="btn btn-primary btn-sm help-btn" ' +
                        'data-need-id="' + need._id + '">' +
                        icon("hand") + " I Can Help" +
                    "</button>" +
                "</div>";


            container.appendChild(card);
        });

    }

    catch (error) {

        console.log("Needs loading error:", error);
    }

});



// ==========================================================
// APNE NUMBERS (metric strip)
//
// Wahi endpoint jo profile page use karta hai.
// Fail ho jaye to cards 0 pe rehte hain, page nahi tootta.
// ==========================================================

document.addEventListener("DOMContentLoaded", async () => {

    const token = localStorage.getItem("token");

    if (!token) {
        return;
    }


    try {

        const response = await fetch("/api/users/me/stats", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!response.ok) {
            return;
        }


        const data = await response.json();

        const stats = data.stats;
        const trust = data.trust;


        document.getElementById("metricHelped").textContent =
            stats.peopleHelped;

        document.getElementById("metricAsked").textContent =
            stats.askedForHelp;

        document.getElementById("metricActive").textContent =
            stats.activeHelps + stats.activeBorrows;

        document.getElementById("metricTrust").textContent =
            trust.score;

        document.getElementById("metricTrustBar").style.width =
            trust.score + "%";

    }

    catch (error) {

        console.log("Stats loading error:", error);
    }

});



// ==========================================================
// "I Can Help" dabane par offer bhejna
//
// Logic bilkul pehle jaisa hai. Sirf alert() hata ke
// toast lagaya hai.
// ==========================================================

document.addEventListener("click", async (event) => {

    const button = event.target.closest(".help-btn");

    if (!button) {
        return;
    }


    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "./login.html";
        return;
    }


    try {

        const response = await fetch("/api/transactions", {

            method: "POST",

            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },

            body: JSON.stringify({
                needId: button.dataset.needId
            })
        });


        const data = await response.json();


        if (!response.ok) {
            showToast(data.message || "Unable to send offer", "error");
            return;
        }


        showToast("Offer sent & borrower notified via email!");

        button.innerHTML = icon("check") + " Offer Sent";
        button.disabled = true;

        const actionButtons = button.closest(".action-buttons");
        if (actionButtons && data.transaction && data.transaction._id) {
            const chatBtn = document.createElement("button");
            chatBtn.className = "btn btn-ghost btn-sm";
            chatBtn.style.marginLeft = "8px";
            chatBtn.innerHTML = "💬 Chat";
            chatBtn.addEventListener("click", () => {
                if (typeof openChatWidget === "function") {
                    openChatWidget(data.transaction._id);
                }
            });
            actionButtons.appendChild(chatBtn);

            // Automatically open the chat widget right away!
            if (typeof openChatWidget === "function") {
                openChatWidget(data.transaction._id);
            }
        }

    }

    catch (error) {

        console.log("Offer error:", error);
        showToast("Something went wrong", "error");
    }

});
