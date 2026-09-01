// ==========================================================
// CampusShare - MY ACTIVITY
//
// Saare transactions do hisson me dikhata hai:
//   - jo maine di hain  (main lender hoon)
//   - jo maine li hain  (main borrower hoon)
//
// Logic aur API calls bilkul pehle jaisi hain. Naya sirf
// card ka HTML hai (icons + English), aur alert() ki jagah
// toast.
// ==========================================================


const token = localStorage.getItem("token");

if (!token) {
    window.location.href = "./login.html";
}


const lendingContainer =
    document.getElementById("lendingContainer");

const borrowingContainer =
    document.getElementById("borrowingContainer");


// Mera apna user id chahiye taaki pata chale
// ki main is transaction me lender hoon ya borrower
let myId = "";



// ==========================================================
// Har status pe kya button dikhega
//
// role = "lender" ya "borrower"
// Agar null aaya to is bande ke liye koi action nahi hai.
// ==========================================================

function getAction(transaction, role) {

    const status = transaction.status;


    // Borrower offer accept karta hai
    if (status === "offered" && role === "borrower") {
        return {
            label: "Accept Offer",
            icon: "check",
            url: "/api/transactions/" + transaction._id + "/accept"
        };
    }

    // Lender item de deta hai
    if (status === "accepted" && role === "lender") {
        return {
            label: "Item Handed Over",
            icon: "box",
            url: "/api/transactions/" + transaction._id + "/handover"
        };
    }

    // Borrower item wapas karta hai
    if (status === "borrowed" && role === "borrower") {
        return {
            label: "Return Item",
            icon: "swap",
            url: "/api/transactions/" + transaction._id + "/return-request"
        };
    }

    // Lender return confirm karta hai
    if (status === "return_pending" && role === "lender") {
        return {
            label: "Confirm Return",
            icon: "check-circle",
            url: "/api/transactions/" + transaction._id + "/confirm-return"
        };
    }

    // Lender apna offer wapas le sakta hai (accept hone se pehle)
    if (status === "offered" && role === "lender") {
        return {
            label: "Withdraw Offer",
            icon: "x",
            url: "/api/transactions/" + transaction._id + "/withdraw"
        };
    }

    // Iske alawa is bande ke liye koi button nahi
    return null;
}


// Status ko padhne layak text me badalna
function statusText(status) {

    if (status === "offered") return "Offer sent";
    if (status === "accepted") return "Accepted";
    if (status === "borrowed") return "Borrowed";
    if (status === "return_pending") return "Return pending";
    if (status === "completed") return "Completed";
    if (status === "withdrawn") return "Withdrawn";

    return "Rejected";
}


// Left ka icon - state ke hisaab se
function statusIcon(status) {

    if (status === "offered")        return { name: "send",         tone: "" };
    if (status === "accepted")       return { name: "hand",         tone: "tx-icon-blue" };
    if (status === "borrowed")       return { name: "box",          tone: "tx-icon-orange" };
    if (status === "return_pending") return { name: "swap",         tone: "" };
    if (status === "completed")      return { name: "check-circle", tone: "tx-icon-green" };

    return { name: "x", tone: "" };
}


// Item late hai ya nahi
// (sirf tab jab item abhi bhi borrower ke paas ho)
function isOverdue(transaction) {

    return transaction.status === "borrowed" &&
        transaction.dueAt &&
        new Date(transaction.dueAt) < new Date();
}


// Kitne din late hai
function daysLate(transaction) {

    const diff = new Date() - new Date(transaction.dueAt);

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    // Aaj hi due tha par time nikal gaya
    if (days < 1) {
        return "Overdue";
    }

    return days === 1 ? "1 day late" : days + " days late";
}


// Chhoti date, poora timestamp nahi
function shortDate(value) {

    return new Date(value).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}


// Sirf time - card me date aur time alag-alag lines pe hain
function shortTime(value) {

    return new Date(value).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit"
    });
}


// Andar ke saat status teen buckets me. Filter tabs isi pe
// chalte hain - user ko "return_pending" jaisa word dikhane
// ka koi fayda nahi, uske liye wo bas "Active" hai.
function statusBucket(status) {

    if (status === "completed") {
        return "completed";
    }

    if (status === "rejected" || status === "withdrawn") {
        return "rejected";
    }

    return "active";
}


// Item ke naam aur logon ke naam database se aate hain aur
// yahan seedhe HTML me jaate hain. Bina iske koi apne item
// ka naam "<img onerror=...>" rakh kar script chala sakta
// hai, kyunki card innerHTML se banta hai.
function esc(value) {

    return String(value == null ? "" : value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}



// ==========================================================
// Ek transaction ka card banana
// ==========================================================

function makeCard(transaction, role) {

    const card = document.createElement("div");

    card.className = "tx-card";

    const overdue = isOverdue(transaction);

    if (overdue) {
        card.classList.add("is-overdue");
    }


    // Doosra banda kaun hai
    const otherPerson =
        role === "lender"
            ? transaction.borrower
            : transaction.lender;


    // ---- left icon ----
    // Late hone par icon laal ho jaata hai
    const chosen = statusIcon(transaction.status);

    const iconTone = overdue ? "tx-icon-red" : chosen.tone;

    const iconHtml =
        '<span class="tx-icon ' + iconTone + '">' +
            icon(chosen.name) +
        "</span>";


    // Filter tabs isi attribute ko dekhte hain
    card.dataset.status = statusBucket(transaction.status);


    // ---- time / return date column ----
    let whenHtml = "";

    if (transaction.dueAt) {

        const lateClass = overdue ? " is-late" : "";

        whenHtml =
            '<div class="tx-when-row">' +
                icon("clock") +
                "<div>" +
                    "<span>Time</span>" +
                    "<b>" + shortTime(transaction.dueAt) + "</b>" +
                "</div>" +
            "</div>" +

            '<div class="tx-when-row' + lateClass + '">' +
                icon("calendar") +
                "<div>" +
                    "<span>" + (overdue ? "Was due" : "Return by") + "</span>" +
                    "<b>" + shortDate(transaction.dueAt) + "</b>" +
                "</div>" +
            "</div>";

    } else {

        // Item abhi handover hi nahi hua, to due date hai hi nahi
        whenHtml =
            '<div class="tx-when-row">' +
                icon("calendar") +
                "<div>" +
                    "<span>Return by</span>" +
                    "<b>Not set yet</b>" +
                "</div>" +
            "</div>";
    }


    // ---- status pills ----
    let pillsHtml =
        '<span class="pill tx-status st-' + transaction.status + '">' +
            '<span class="pill-dot"></span>' +
            statusText(transaction.status) +
        "</span>";

    if (overdue) {

        pillsHtml +=
            '<span class="pill tx-overdue st-overdue">' +
                icon("alert") +
                daysLate(transaction) +
            "</span>";
    }


    // ---- action button ----
    const action = getAction(transaction, role);

    let actionHtml = '<span class="tx-wait">Waiting for the other person</span>';

    if (action) {

        actionHtml =
            '<button class="btn btn-primary btn-sm tx-btn" ' +
                'data-url="' + action.url + '">' +
                icon(action.icon) + " " + action.label +
            "</button>";
    }

    // Ye teen status band ho chuke hain, koi action nahi bachta
    if (transaction.status === "completed" ||
        transaction.status === "rejected" ||
        transaction.status === "withdrawn") {

        actionHtml = "";
    }


    // ---- branch / batch line ----
    // Dono optional hain, isliye jo maujood hai wahi jodte hain
    const metaParts = [];

    if (otherPerson.branch) {
        metaParts.push("<span>" + esc(otherPerson.branch) + "</span>");
    }

    if (otherPerson.batch) {
        metaParts.push("<span>Batch " + esc(otherPerson.batch) + "</span>");
    }

    const metaHtml = metaParts.length
        ? '<p class="tx-meta">' +
              metaParts.join('<span class="meta-dot"></span>') +
          "</p>"
        : "";


    card.innerHTML =

        iconHtml +

        '<div class="tx-info">' +
            '<p class="tx-item">' +
                esc(transaction.needPost.itemName) +
            "</p>" +
            '<p class="tx-person">' +
                (role === "lender" ? "Lent to " : "Borrowed from ") +
                "<b>" + esc(otherPerson.name) + "</b>" +
            "</p>" +
            metaHtml +
        "</div>" +

        '<div class="tx-when">' + whenHtml + "</div>" +

        '<div class="tx-pills">' + pillsHtml + "</div>" +

        '<div class="tx-actions">' +

            // Details page ka link
            '<a class="btn btn-ghost btn-sm view-details-btn" ' +
                'href="./transaction-details.html?id=' + transaction._id + '">' +
                "Details" +
            "</a>" +

            actionHtml +

        "</div>";


    return card;
}



// ==========================================================
// Saare transactions load karna
// ==========================================================

async function loadActivity() {

    try {

        // Pehle apna id nikal lete hain
        const meResponse = await fetch("/api/users/me", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (meResponse.status === 401) {
            localStorage.removeItem("token");
            window.location.href = "./login.html";
            return;
        }

        const meData = await meResponse.json();

        myId = meData.user._id;

        document.getElementById("navUserName").textContent =
            meData.user.name;


        // Ab transactions
        const response = await fetch("/api/transactions/me", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            console.log(data.message);
            return;
        }


        lendingContainer.innerHTML = "";
        borrowingContainer.innerHTML = "";

        let lendingCount = 0;
        let borrowingCount = 0;


        data.transactions.forEach((transaction) => {

            // Main lender hoon ya borrower?
            if (transaction.lender._id === myId) {

                lendingContainer.appendChild(
                    makeCard(transaction, "lender")
                );

                lendingCount = lendingCount + 1;

            } else {

                borrowingContainer.appendChild(
                    makeCard(transaction, "borrower")
                );

                borrowingCount = borrowingCount + 1;
            }

        });


        // Heading ke saath count
        document.getElementById("lendingCount").textContent =
            lendingCount > 0 ? "· " + lendingCount : "";

        document.getElementById("borrowingCount").textContent =
            borrowingCount > 0 ? "· " + borrowingCount : "";


        // Cards har baar naye bante hain, isliye filter dobara
        // lagana padta hai - warna action button dabane ke baad
        // list wapas "All" pe chali jaati.
        updateFilterCounts();
        applyFilter(currentFilter);


        // ---- empty states ----

        if (lendingCount === 0) {

            lendingContainer.innerHTML =
                '<div class="empty-box">' +
                    '<img class="empty-art" ' +
                        'src="../images/Swipe Profiles-pana.png" alt="">' +
                    '<b class="empty-title">You have not helped anyone yet</b>' +
                    '<p class="empty-text">' +
                        "See what students around you are looking for, " +
                        "and send your first offer." +
                    "</p>" +
                    '<a href="./dashboard.html#requests" ' +
                        'class="btn btn-primary btn-sm">' +
                        "Browse Requests " + icon("arrow-right") +
                    "</a>" +
                "</div>";
        }

        if (borrowingCount === 0) {

            borrowingContainer.innerHTML =
                '<div class="empty-box">' +
                    '<img class="empty-art" ' +
                        'src="../images/Stuck at Home - Happy Place.png" alt="">' +
                    '<b class="empty-title">You have not borrowed anything yet</b>' +
                    '<p class="empty-text">' +
                        "Post what you need and someone on campus " +
                        "will offer to help." +
                    "</p>" +
                    '<a href="./post-need.html" class="btn btn-primary btn-sm">' +
                        icon("plus") + " Post a Need" +
                    "</a>" +
                "</div>";
        }

    }

    catch (error) {

        console.log("Activity loading error:", error);
    }

}



// ==========================================================
// Kisi bhi action button par click
// ==========================================================

document.addEventListener("click", async (event) => {

    const button = event.target.closest(".tx-btn");

    if (!button) {
        return;
    }


    try {

        const response = await fetch(button.dataset.url, {

            method: "PATCH",

            headers: {
                Authorization: `Bearer ${token}`
            }
        });


        const data = await response.json();


        if (!response.ok) {
            showToast(data.message || "Something went wrong", "error");
            return;
        }


        showToast(data.message);

        // List dobara load kar lo taaki naya status dikhe
        loadActivity();

    }

    catch (error) {

        console.log("Action error:", error);
        showToast("Something went wrong", "error");
    }

});



// ==========================================================
// FILTER TABS
//
// Ye poori tarah client-side hai - koi nayi API call nahi
// hoti. Cards already DOM me hain, filter sirf unhe chhupata
// hai. Isliye tab badalna turant hota hai.
// ==========================================================

const filterButtons = document.querySelectorAll(".filter");

let currentFilter = "all";


function applyFilter(filter) {

    currentFilter = filter;


    document.querySelectorAll(".tx-card").forEach((card) => {

        const show =
            filter === "all" || card.dataset.status === filter;

        card.classList.toggle("hidden", !show);
    });


    filterButtons.forEach((button) => {

        const isOn = button.dataset.filter === filter;

        button.classList.toggle("active", isOn);

        // Screen reader ko pata chalna chahiye ki kaunsa
        // tab chuna hua hai - sirf rang se nahi
        button.setAttribute("aria-pressed", isOn ? "true" : "false");
    });


    // Agar kisi section ke saare card chhup gaye to us
    // section ke neeche khaali jagah bach jaati thi, jo
    // toota hua lagta tha. Ab wahan ek chhoti line aati hai.
    [lendingContainer, borrowingContainer].forEach(showNoMatchNote);
}


function showNoMatchNote(container) {

    const existing = container.querySelector(".filter-empty");

    if (existing) {
        existing.remove();
    }


    const cards = container.querySelectorAll(".tx-card");

    // Section bilkul khaali hai - wahan already empty-box hai
    if (cards.length === 0) {
        return;
    }

    const visible = container.querySelectorAll(".tx-card:not(.hidden)");

    if (visible.length > 0) {
        return;
    }


    const note = document.createElement("p");

    note.className = "filter-empty";
    note.textContent = "Nothing here under this filter.";

    container.appendChild(note);
}


// Har tab pe kitne card hain
function updateFilterCounts() {

    const cards = document.querySelectorAll(".tx-card");

    const totals = { all: cards.length, active: 0, completed: 0, rejected: 0 };

    cards.forEach((card) => {
        totals[card.dataset.status] = totals[card.dataset.status] + 1;
    });


    document.querySelectorAll(".filter-count").forEach((element) => {

        const value = totals[element.dataset.count];

        element.textContent = value > 0 ? value : "";
    });
}


filterButtons.forEach((button) => {

    button.addEventListener("click", () => {
        applyFilter(button.dataset.filter);
    });

});



// ==========================================================
// CAROUSEL
//
// Sirf dikhne ki cheez hai. Agar kisi wajah se markup na
// mile to chup-chaap ruk jaata hai, taaki baaki page
// (transactions) chalta rahe.
// ==========================================================

const carousel = document.getElementById("activityCarousel");
const carouselTrack = document.getElementById("carouselTrack");

if (carousel && carouselTrack) {

    const slides = carouselTrack.querySelectorAll(".carousel-slide");
    const dots = document.querySelectorAll(".carousel-dot");

    let currentSlide = 0;
    let timer = null;


    function showSlide(index) {

        // Dono taraf se ghoom jaata hai
        if (index < 0) {
            currentSlide = slides.length - 1;
        } else if (index >= slides.length) {
            currentSlide = 0;
        } else {
            currentSlide = index;
        }


        carouselTrack.style.transform =
            "translateX(-" + currentSlide * 100 + "%)";

        dots.forEach((dot, dotIndex) => {
            dot.classList.toggle("active", dotIndex === currentSlide);
        });
    }


    function startCarousel() {

        stopCarousel();

        timer = setInterval(() => {
            showSlide(currentSlide + 1);
        }, 6000);
    }


    function stopCarousel() {

        if (timer) {
            clearInterval(timer);
            timer = null;
        }
    }


    document.getElementById("nextSlide")
        .addEventListener("click", () => {
            showSlide(currentSlide + 1);
            startCarousel();
        });

    document.getElementById("previousSlide")
        .addEventListener("click", () => {
            showSlide(currentSlide - 1);
            startCarousel();
        });

    dots.forEach((dot) => {

        dot.addEventListener("click", () => {
            showSlide(Number(dot.dataset.slide));
            startCarousel();
        });

    });


    // Padhte waqt slide na badle
    carousel.addEventListener("mouseenter", stopCarousel);
    carousel.addEventListener("mouseleave", startCarousel);

    // Doosre tab me hone par timer chalane ka koi matlab nahi
    document.addEventListener("visibilitychange", () => {
        document.hidden ? stopCarousel() : startCarousel();
    });


    startCarousel();
}



// ==========================================================
// START
// ==========================================================

loadActivity();
