// ==========================================================
// CampusShare - TOAST
//
// alert() ki jagah. Pehle 11 jagah alert() use hota tha:
// offer bhejne pe, action fail hone pe, photo upload pe.
//
// alert() ke teen problem the:
//   1. poora page block ho jaata hai jab tak OK na dabao
//   2. "localhost:4000 says" upar likha aata hai
//   3. style bilkul nahi ho sakta
//
// Ye uska chhota replacement hai. Corner me aata hai,
// 4 second baad khud chala jaata hai, page block nahi karta.
//
// Use:
//     showToast("Offer sent to Prathmesh.");
//     showToast("Unable to send offer", "error");
// ==========================================================

function showToast(message, type) {

    // Sabhi toasts ek hi container me jaate hain.
    // Pehli baar me container bana lo.
    let box = document.getElementById("toastBox");

    if (!box) {

        box = document.createElement("div");
        box.id = "toastBox";
        box.className = "toast-box";

        // role="status" ka matlab: screen reader ise
        // padh dega, bina user ka kaam roke.
        box.setAttribute("role", "status");
        box.setAttribute("aria-live", "polite");

        document.body.appendChild(box);
    }


    const toast = document.createElement("div");

    toast.className = "toast";

    if (type === "error") {
        toast.className = "toast toast-error";
    }


    const iconName = (type === "error") ? "alert" : "check-circle";

    toast.innerHTML =
        '<svg class="icon toast-icon" aria-hidden="true">' +
        '<use href="#i-' + iconName + '"></use></svg>' +
        "<span>" + message + "</span>";


    box.appendChild(toast);


    // 4 second baad hata do
    setTimeout(function () {

        toast.classList.add("toast-out");

        // fade khatam hone ke baad DOM se nikaal do
        setTimeout(function () {
            toast.remove();
        }, 250);

    }, 4000);
}
