document.addEventListener("DOMContentLoaded", async () => {

    const response = await fetch("/api/needs");
    const data = await response.json();

    const container = document.getElementById("requestsContainer");

    data.needs.forEach((need) => {

        const card = document.createElement("div");
        card.className = "request-card";

        const initials = need.requestedBy.name.slice(0, 2).toUpperCase();
        const neededByDate = new Date(need.neededBy).toLocaleString();

        card.innerHTML =
            '<div class="avatar" style="background:#FFD9C7">' + initials + '</div>' +

            '<div class="student-info">' +
                '<p class="student-name">' + need.requestedBy.name + '</p>' +
                '<p class="student-branch">' + need.requestedBy.branch + ' · Batch ' + need.requestedBy.batch + '</p>' +
            '</div>' +

            '<div class="item-info">' +
                '<p class="item-title">' + need.itemName + '</p>' +
                '<p class="item-desc">' + need.description + '</p>' +
                '<p class="item-time">' +
                    '📅 Needed by: <b>' + neededByDate + '</b>' +
                    ' &nbsp; ⏰ Duration: <b>' + need.durationValue + ' ' + need.durationUnit + '</b>' +
                '</p>' +
            '</div>' +

            '<div class="action-buttons">' +
                '<button class="help-btn">I Can Help</button>' +
            '</div>';

        container.appendChild(card);
    });

});