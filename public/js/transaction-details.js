// ============================================
// TOKEN
// ============================================

const token = localStorage.getItem("token");

if (!token) {
    window.location.href = "./login.html";
}



// ============================================
// URL SE TRANSACTION ID
// ============================================

const params = new URLSearchParams(window.location.search);

const transactionId = params.get("id");


if (!transactionId) {

    document.querySelector(".page-content").innerHTML = `

        <div class="empty-box">

            <svg class="icon no-transaction-icon" aria-hidden="true">
                <use href="#i-file-text"></use>
            </svg>

            <b class="empty-title">No transaction selected</b>

            <p class="empty-text">
                This page shows the details of one transaction.
                Open My Activity and choose "Details" on any card.
            </p>

            <a href="./activity.html" class="btn btn-primary btn-sm">
                <svg class="icon" aria-hidden="true">
                    <use href="#i-arrow-left"></use>
                </svg>
                Go to My Activity
            </a>

        </div>
    `;
}


const defaultProfileImage = "../images/icons8-customer-48.png";


// Poora transaction yahan rakhte hain taaki modal
// bhi ise padh sake (role ke hisaab se reasons dikhane ke liye)
let currentTransaction = null;
let currentRole = null;



// ============================================
// CHHOTE HELPERS
// ============================================

function formatDate(date) {

    if (!date) {
        return "—";
    }

    return new Date(date).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}


function formatSimpleDate(date) {

    if (!date) {
        return "—";
    }

    return new Date(date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}


// Item late hai ya nahi
function isOverdue(transaction) {

    return transaction.status === "borrowed" &&
        transaction.dueAt &&
        new Date(transaction.dueAt) < new Date();
}


function getStatusText(status) {

    // Sentence case, ALL CAPS nahi - is size pe padhna aasan hai
    const statusMap = {
        offered: "Offer sent",
        accepted: "Accepted",
        borrowed: "Borrowed",
        return_pending: "Return pending",
        completed: "Completed",
        rejected: "Rejected",
        withdrawn: "Withdrawn"
    };

    return statusMap[status] || status;
}



// ============================================
// TRANSACTION LOAD
// ============================================

async function loadTransaction() {

    try {

        const response = await fetch(
            `/api/transactions/${transactionId}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const data = await response.json();


        if (response.status === 401) {
            localStorage.removeItem("token");
            window.location.href = "./login.html";
            return;
        }

        if (!response.ok) {
            showToast(data.message || "Unable to load transaction", "error");
            return;
        }


        currentTransaction = data.transaction;
        currentRole = data.myRole;

        populateTransaction(data.transaction, data.myRole);

    }

    catch (error) {
        console.log("Transaction load error:", error);
    }
}



// ============================================
// PAGE BHARO
// ============================================

function populateTransaction(transaction, myRole) {

    const need = transaction.needPost;
    const borrower = transaction.borrower;
    const lender = transaction.lender;


    // ---------- title row ----------

    const pill = document.getElementById("statusPill");

    pill.textContent = isOverdue(transaction)
        ? "OVERDUE"
        : getStatusText(transaction.status);

    pill.className = "status-pill";

    if (isOverdue(transaction)) {
        pill.classList.add("is-late");
    } else if (transaction.status === "completed") {
        pill.classList.add("is-done");
    } else if (
        transaction.status === "rejected" ||
        transaction.status === "withdrawn"
    ) {
        pill.classList.add("is-ended");
    }


    document.getElementById("transactionId").textContent =
        transaction._id;

    document.getElementById("acceptedOn").textContent =
        transaction.acceptedAt
            ? "Accepted on " + formatSimpleDate(transaction.acceptedAt)
            : "";


    // ---------- item ----------

    document.getElementById("itemName").textContent = need.itemName;

    document.getElementById("itemDescription").textContent =
        need.description;

    document.getElementById("neededBy").textContent =
        formatSimpleDate(need.neededBy);

    document.getElementById("duration").textContent =
        need.durationValue + " " + need.durationUnit;


    // ---------- dono log ----------

    document.getElementById("borrowerName").textContent = borrower.name;

    document.getElementById("borrowerDetails").textContent =
        (borrower.branch || "") +
        (borrower.batch ? " • Batch " + borrower.batch : "");

    if (borrower.profileImage) {
        document.getElementById("borrowerImage").src = borrower.profileImage;
    }


    document.getElementById("lenderName").textContent = lender.name;

    document.getElementById("lenderDetails").textContent =
        (lender.branch || "") +
        (lender.batch ? " • Batch " + lender.batch : "");

    if (lender.profileImage) {
        document.getElementById("lenderImage").src = lender.profileImage;
    }


    // "You" tag — jo main hoon uspe
    document.getElementById("borrowerYou").hidden = myRole !== "borrower";
    document.getElementById("lenderYou").hidden = myRole !== "lender";


    // ---------- summary ----------

    document.getElementById("sumDuration").textContent =
        need.durationValue + " " + need.durationUnit;

    document.getElementById("sumHandover").textContent =
        formatDate(transaction.handedOverAt);

    const dueEl = document.getElementById("sumDueAt");
    dueEl.textContent = formatDate(transaction.dueAt);
    dueEl.className = isOverdue(transaction) ? "late" : "";

    document.getElementById("sumCreated").textContent =
        formatSimpleDate(transaction.createdAt);


    renderStepper(transaction);
    renderTimeline(transaction);
    setProgressMessage(transaction, myRole);
    renderAction(transaction, myRole);
}



// ============================================
// STAGES (stepper aur timeline dono isi se bante hain)
// ============================================

function getStages(transaction) {

    return [
        {
            title: "Offer Accepted",
            short: "Accepted",
            description: "The help offer was accepted",
            date: transaction.acceptedAt
        },
        {
            title: "Item Handed Over",
            short: "Handed Over",
            description: "The item was handed over",
            date: transaction.handedOverAt
        },
        {
            title: "Borrowed",
            short: "Borrowed",
            description: "Item is with the borrower",
            date: transaction.handedOverAt
        },
        {
            title: "Return Pending",
            short: "Return Pending",
            description: "Borrower has requested return",
            date: transaction.returnRequestedAt
        },
        {
            title: "Completed",
            short: "Completed",
            description: "Lender confirmed the return",
            date: transaction.completedAt
        }
    ];
}


// Har status kis step tak pahuncha hai
function getCurrentIndex(status) {

    const order = {
        offered: -1,
        accepted: 0,
        borrowed: 2,
        return_pending: 3,
        completed: 4,
        rejected: -2,
        withdrawn: -2
    };

    return order[status];
}


// state nikalo: done / current / pending
function getState(index, currentIndex, status) {

    if (index < currentIndex) {
        return "done";
    }

    if (index === currentIndex) {
        return status === "completed" ? "done" : "current";
    }

    return "pending";
}



// ============================================
// UPAR WALA HORIZONTAL STEPPER
// ============================================

function renderStepper(transaction) {

    const stepper = document.getElementById("stepper");

    const stages = getStages(transaction);

    const currentIndex = getCurrentIndex(transaction.status);

    stepper.innerHTML = "";


    stages.forEach((stage, index) => {

        // "Borrowed" alag step hai par uski date handover wali hi hai,
        // isliye stepper me use skip kar dete hain warna do same date
        if (index === 1) {
            return;
        }


        const state = getState(index, currentIndex, transaction.status);

        const box = document.createElement("div");

        box.className = "stp " + state;


        // icon() helper js/icons.js me hai
        let dotIcon = icon("circle");

        if (state === "done") {
            dotIcon = icon("check");
        } else if (state === "current") {
            dotIcon = icon("box");
        }


        box.innerHTML = `
            <div class="stp-dot">${dotIcon}</div>
            <div class="stp-label">${stage.short}</div>
            <div class="stp-date">${stage.date ? formatSimpleDate(stage.date) : "--"}</div>
        `;

        stepper.appendChild(box);
    });
}



// ============================================
// NEECHE WALA VERTICAL TIMELINE
// ============================================

function renderTimeline(transaction) {

    const timeline = document.getElementById("transactionTimeline");

    const stages = getStages(transaction);

    const currentIndex = getCurrentIndex(transaction.status);

    timeline.innerHTML = "";


    stages.forEach((stage, index) => {

        const state = getState(index, currentIndex, transaction.status);

        const item = document.createElement("div");

        const lastClass = index === stages.length - 1 ? " last" : "";

        // CSS me class ka naam "completed" hai
        const cssState = state === "done" ? "completed" : state;

        item.className = "timeline-item " + cssState + lastClass;


        let marker = "";

        if (state === "done") {
            marker = icon("check");
        } else if (state === "current") {
            marker = '<div class="current-dot"></div>';
        }


        item.innerHTML = `

            <div class="timeline-marker">${marker}</div>

            <div class="timeline-content">

                <div>
                    <h3>${stage.title}</h3>
                    <p>${stage.description}</p>
                </div>

                <span class="timeline-date">
                    ${stage.date ? formatDate(stage.date) : "—"}
                </span>

            </div>
        `;

        timeline.appendChild(item);
    });
}



// ============================================
// SUMMARY KE NEECHE WALA MESSAGE
// ============================================

function setProgressMessage(transaction, myRole) {

    const message = document.getElementById("progressMessage");

    const status = transaction.status;


    if (status === "offered") {

        message.textContent = myRole === "borrower"
            ? "You received a help offer. Accept it to continue."
            : "Waiting for the borrower to accept your offer.";

    }

    else if (status === "accepted") {

        message.textContent = myRole === "lender"
            ? "Hand over the item and mark it as handed over."
            : "Waiting for the lender to hand over the item.";

    }

    else if (status === "borrowed") {

        if (isOverdue(transaction)) {

            message.textContent = myRole === "borrower"
                ? "This item is overdue. Please return it as soon as possible."
                : `This item is overdue. ${transaction.borrower.name} still has it.`;

        } else {

            message.textContent = myRole === "borrower"
                ? `You currently have this item. Return it by ${formatDate(transaction.dueAt)}.`
                : `The item is currently with ${transaction.borrower.name}.`;
        }

    }

    else if (status === "return_pending") {

        message.textContent = myRole === "lender"
            ? "The borrower has returned the item. Confirm once you receive it."
            : "Waiting for the lender to confirm your return.";

    }

    else if (status === "completed") {

        message.textContent = transaction.returnedOnTime
            ? "Transaction completed and returned on time."
            : "Transaction completed.";

    }

    else if (status === "rejected") {

        message.textContent = "This offer was not selected.";

    }

    else if (status === "withdrawn") {

        message.textContent = myRole === "lender"
            ? "You withdrew this offer."
            : "The lender withdrew this offer.";
    }
}



// ============================================
// ACTIONS PANEL
// Sirf wahi button dikhta hai jo is waqt
// is bande ka hai. Ye sirf UX hai -
// asli rok backend me lagi hui hai.
// ============================================

const REPORTABLE = ["accepted", "borrowed", "return_pending"];


function renderAction(transaction, myRole) {

    const container = document.getElementById("actionContainer");

    const status = transaction.status;

    container.innerHTML = "";


    // ---------- main action ----------

    if (status === "offered" && myRole === "borrower") {

        addButton(container, "Accept Offer", "check",
            () => updateTransaction("accept"));

    }

    else if (status === "offered" && myRole === "lender") {

        addButton(container, "Withdraw Offer", "x",
            () => updateTransaction("withdraw"));

    }

    else if (status === "accepted" && myRole === "lender") {

        addButton(container, "Item Handed Over", "hand",
            () => updateTransaction("handover"));

    }

    else if (status === "borrowed" && myRole === "borrower") {

        addButton(container, "Mark as Returned", "swap",
            () => updateTransaction("return-request"));

    }

    else if (status === "return_pending" && myRole === "lender") {

        addButton(container, "Confirm Return", "check-circle",
            () => updateTransaction("confirm-return"));

    }

    else if (status === "completed") {

        const done = document.createElement("button");
        done.className = "btn btn-ghost btn-full action-button";
        done.disabled = true;
        done.innerHTML =
            icon("check-circle") + " Transaction Completed";
        container.appendChild(done);

    }

    else {

        const wait = document.createElement("div");
        wait.className = "waiting-box";
        wait.innerHTML =
            icon("clock") + " Waiting for the other person";
        container.appendChild(wait);
    }


    // ---------- report an issue ----------

    if (REPORTABLE.includes(status)) {
        addReportButton(container);
    }
}


// iconName sprite ka naam hai, jaise "check" ya "swap"
function addButton(container, text, iconName, action) {

    const button = document.createElement("button");

    button.className = "btn btn-primary btn-full action-button";

    button.innerHTML = icon(iconName) + " " + text;

    button.addEventListener("click", action);

    container.appendChild(button);
}


// Pehle poochte hain ki maine already report to nahi kiya
async function addReportButton(container) {

    try {

        const response = await fetch(
            `/api/disputes/transaction/${transactionId}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const data = await response.json();


        if (data.reported) {

            const box = document.createElement("div");
            box.className = "reported-box";
            box.innerHTML = icon("alert") + " Issue reported";
            container.appendChild(box);

            return;
        }

    }

    catch (error) {
        console.log("Dispute check error:", error);
    }


    const button = document.createElement("button");

    button.className = "btn btn-ghost btn-full action-button danger";

    button.innerHTML = icon("flag") + " Report an Issue";

    button.addEventListener("click", openDisputeModal);

    container.appendChild(button);
}



// ============================================
// TRANSACTION AAGE BADHAO
// ============================================

async function updateTransaction(action) {

    try {

        const response = await fetch(
            `/api/transactions/${transactionId}/${action}`,
            {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const data = await response.json();


        if (!response.ok) {
            showToast(data.message || "Action failed", "error");
            return;
        }


        // UI khud se badalne ke bajaye DB se fresh data lo
        await loadTransaction();

    }

    catch (error) {
        console.log("Transaction update error:", error);
        showToast("Something went wrong", "error");
    }
}



// ============================================
// REPORT AN ISSUE MODAL
// ============================================

const modal = document.getElementById("disputeModal");
const reasonList = document.getElementById("reasonList");
const descriptionBox = document.getElementById("disputeDescription");
const charCount = document.getElementById("charCount");
const photoInput = document.getElementById("disputePhotos");
const photoNames = document.getElementById("photoNames");
const errorBox = document.getElementById("disputeError");
const submitBtn = document.getElementById("disputeSubmit");


// Reasons role ke hisaab se badalte hain.
// Lender borrower ki shikayat karta hai, borrower lender ki.

const LENDER_REASONS = [
    { value: "not_returned", label: "Item not returned" },
    { value: "damaged", label: "Item returned damaged" },
    { value: "other", label: "Other" }
];

const BORROWER_REASONS = [
    { value: "wrong_item", label: "Item was different from what was promised" },
    { value: "not_handed_over", label: "Lender never handed over the item" },
    { value: "damaged", label: "Item was already damaged" },
    { value: "other", label: "Other" }
];


function openDisputeModal() {

    const reasons = currentRole === "lender"
        ? LENDER_REASONS
        : BORROWER_REASONS;


    reasonList.innerHTML = "";

    reasons.forEach((reason, index) => {

        const label = document.createElement("label");

        label.className = "reason";

        label.innerHTML = `
            <input
                type="radio"
                name="disputeReason"
                value="${reason.value}"
                ${index === 0 ? "checked" : ""}
            >
            <span>${reason.label}</span>
        `;

        reasonList.appendChild(label);
    });


    // form saaf karo
    descriptionBox.value = "";
    charCount.textContent = "0/500";
    photoInput.value = "";
    photoNames.textContent = "";
    errorBox.hidden = true;

    modal.classList.add("open");
}


function closeDisputeModal() {
    modal.classList.remove("open");
}


document.getElementById("disputeClose")
    .addEventListener("click", closeDisputeModal);

document.getElementById("disputeCancel")
    .addEventListener("click", closeDisputeModal);


// Bahar click karne pe band
modal.addEventListener("click", (event) => {
    if (event.target === modal) {
        closeDisputeModal();
    }
});


// Escape dabane pe band
document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        closeDisputeModal();
    }
});


// Character counter
descriptionBox.addEventListener("input", () => {
    charCount.textContent = descriptionBox.value.length + "/500";
});


// Chuni hui photos ke naam dikhao
photoInput.addEventListener("change", () => {

    if (photoInput.files.length === 0) {
        photoNames.textContent = "";
        return;
    }

    const names = [];

    for (const file of photoInput.files) {
        names.push(file.name);
    }

    photoNames.textContent = names.join(", ");
});



// ---------- SUBMIT ----------

document.getElementById("disputeForm")
    .addEventListener("submit", async (event) => {

    event.preventDefault();


    const selected =
        document.querySelector('input[name="disputeReason"]:checked');

    const description = descriptionBox.value.trim();


    if (!selected || !description) {
        errorBox.textContent =
            "Choose a reason and describe what happened.";
        errorBox.hidden = false;
        return;
    }


    // Photos ki wajah se FormData bhej rahe hain, JSON nahi.
    // Content-Type khud mat lagana - browser boundary set karta hai.
    const formData = new FormData();

    formData.append("transactionId", transactionId);
    formData.append("reason", selected.value);
    formData.append("description", description);

    for (const file of photoInput.files) {
        formData.append("photos", file);
    }


    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting...";


    try {

        const response = await fetch("/api/disputes", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`
            },
            body: formData
        });

        const data = await response.json();


        if (!response.ok) {
            errorBox.textContent = data.message || "Unable to report the issue";
            errorBox.hidden = false;
            return;
        }


        closeDisputeModal();

        showToast("Issue reported. We have recorded it.");

        // Actions panel dobara bharo taaki "Issue reported" dikhe
        await loadTransaction();

    }

    catch (error) {

        console.log("Dispute submit error:", error);

        errorBox.textContent = "Something went wrong";
        errorBox.hidden = false;
    }

    finally {

        submitBtn.disabled = false;
        submitBtn.textContent = "Submit Report";
    }
});



// ============================================
// NAVBAR
//
// Pehle is page ka apna topbar tha, aur uska naam bharne
// ke liye yahan alag loadTopbar() function likha tha - ek
// hi kaam do jagah. Ab page pe wahi navbar hai jo baaki
// pages pe hai, aur usko js/nav.js bharta hai.
// ============================================



// ============================================
// COPY TRANSACTION ID
// ============================================

const copyButton = document.getElementById("copyTransactionId");

if (copyButton) {

    copyButton.addEventListener("click", async () => {

        const id = document.getElementById("transactionId").textContent;

        await navigator.clipboard.writeText(id);

        showToast("Transaction ID copied");
    });
}



// ============================================
// START
// ============================================

if (token && transactionId) {
    loadTransaction();
}
