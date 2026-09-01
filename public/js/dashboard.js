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


// Date ko chhota aur padhne layak banao.
// Pehle toLocaleString() use hota tha jo poora
// "9/3/2026, 12:00:00 AM" chhaap deta tha - card me
// wo ek line kha jaata tha.
function shortDate(value) {

    return new Date(value).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short"
    });
}


// ==========================================================
// OPEN NEEDS LOAD KARNA
// ==========================================================

document.addEventListener("DOMContentLoaded", async () => {

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
                need.requestedBy.name.slice(0, 2).toUpperCase();


            card.innerHTML =

                // ---- kaun maang raha hai ----
                '<div class="student-row">' +

                    '<div class="avatar">' + initials + "</div>" +

                    '<div class="student-info">' +
                        '<p class="student-name">' +
                            need.requestedBy.name +
                        "</p>" +
                        '<p class="student-branch">' +
                            need.requestedBy.branch +
                            " · Batch " + need.requestedBy.batch +
                        "</p>" +
                    "</div>" +

                "</div>" +


                // ---- kya chahiye ----
                '<div class="item-info">' +
                    '<p class="item-title">' + need.itemName + "</p>" +
                    '<p class="item-desc">' + need.description + "</p>" +
                "</div>" +


                // ---- kab tak / kitne der ----
                '<div class="item-meta">' +

                    '<span class="chip">' +
                        icon("clock") +
                        need.durationValue + " " + need.durationUnit +
                    "</span>" +

                    '<span class="chip">' +
                        icon("calendar") +
                        "By " + shortDate(need.neededBy) +
                    "</span>" +

                "</div>" +


                // ---- button ----
                // .help-btn aur data-need-id bilkul same hain,
                // niche wala click handler inhi pe chalta hai.
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


        showToast("Offer sent. Track it under My Activity.");

        button.innerHTML = icon("check") + " Offer Sent";
        button.disabled = true;

    }

    catch (error) {

        console.log("Offer error:", error);
        showToast("Something went wrong", "error");
    }

});
