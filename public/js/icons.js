// ==========================================================
// CampusShare - ICON SPRITE
//
// Pehle icons teen alag tareeke se aate the:
//   1. emoji seedha HTML me (🔶 🤝 ✎ 🛡️ ⏱️ 📷 ...)  - 14 jagah
//   2. Font Awesome CDN se, sirf transaction-details pe
//   3. chhoti PNG files (house.png, send.png ...)
//
// Emoji har operating system pe alag dikhte hain, unka size
// aur colour control nahi hota, aur screen reader unhe bol
// deta hai. Font Awesome ke liye 30KB ka network request
// jaata tha sirf kuch icons ke liye.
//
// Ab sab kuch yahan hai - ek SVG sprite, zero network calls.
//
// Use karne ka tareeka:
//     <svg class="icon"><use href="#i-home"></use></svg>
//
// Icon apne aap parent ka colour aur font-size le leta hai,
// kyunki .icon rule (tokens.css me) stroke: currentColor
// aur width: 1em use karta hai.
//
// Ye file <body> ke bilkul shuru me load hoti hai (defer ke
// bina), taaki sprite page ke baaki HTML se pehle maujood ho.
// ==========================================================

(function injectIconSprite() {

    // Har icon ka sirf path data. Baaki attributes (stroke,
    // width waghairah) .icon class se aate hain.
    const paths = {

        // ---- navigation ----
        "home":     '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.7V21h14V9.7"/>',
        "activity": '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 8h6M8 12h9M8 16h4"/>',
        "user":     '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
        "users":    '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',

        // ---- actions ----
        "plus":     '<path d="M12 5v14M5 12h14"/>',
        "search":   '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
        "pencil":   '<path d="M21.2 6.8a1 1 0 0 0-4-4L3.8 16.2a2 2 0 0 0-.5.8l-1.3 4.4a.5.5 0 0 0 .6.6l4.4-1.3a2 2 0 0 0 .8-.5z"/>',
        "camera":   '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3"/><circle cx="12" cy="13" r="3"/>',
        "upload":   '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 9l5-5 5 5M12 4v12"/>',
        "logout":   '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/>',
        "copy":     '<rect x="8" y="8" width="14" height="14" rx="2"/><path d="M4 16a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2"/>',
        "flag":     '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V4s-1 1-4 1-5-2-8-2-4 1-4 1z"/><path d="M4 22v-7"/>',
        "send":     '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',

        // ---- arrows ----
        "arrow-right": '<path d="M5 12h14m-7-7 7 7-7 7"/>',
        "arrow-left":  '<path d="M19 12H5m7-7-7 7 7 7"/>',
        "arrow-up":    '<path d="M12 19V5m-7 7 7-7 7 7"/>',
        "chevron-down":'<path d="m6 9 6 6 6-6"/>',
        "swap":        '<path d="M8 3 4 7l4 4"/><path d="M4 7h16"/><path d="m16 21 4-4-4-4"/><path d="M20 17H4"/>',

        // ---- status ----
        "check":        '<path d="m4 12.5 5 5L20 6.5"/>',
        "check-circle": '<circle cx="12" cy="12" r="9"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
        "circle":       '<circle cx="12" cy="12" r="9"/>',
        "clock":        '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
        "alert":        '<path d="m21.7 18-8-14a2 2 0 0 0-3.5 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3"/><path d="M12 9v4M12 17h.01"/>',
        "info":         '<circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/>',
        "x":            '<path d="M18 6 6 18M6 6l12 12"/>',
        "shield":       '<path d="M20 13c0 5-3.5 7.5-7.7 9a1 1 0 0 1-.7 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.2-2.7a1.2 1.2 0 0 1 1.5 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z"/>',
        "star":         '<path d="m12 3 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.2l5.9-.9z"/>',

        // ---- objects ----
        "box":       '<path d="m7.5 4.3 9 5.2"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5M12 22V12"/>',
        // Ek haath doosre ko cheez de raha hai. Pehla version
        // do tooti hui lakeeron ka tha jo 20px pe ek lehar
        // jaisa dikhta tha, hand jaisa bilkul nahi.
        "hand":      '<path d="M11 12h2a2 2 0 0 0 0-4H9.5a2 2 0 0 0-1.4.6L3 14"/><path d="m7 18 1.6-1.4a2 2 0 0 1 1.4-.6h4a2 2 0 0 0 1.4-.6l4.2-4a2 2 0 0 0-2.8-2.9l-3.9 3.6"/><path d="m2 13 6 6"/>',
        "calendar":  '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
        "mail":      '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-9 5.7a2 2 0 0 1-2 0L2 7"/>',
        "book":      '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a2.5 2.5 0 0 1 0-5H20"/>',
        "cap":       '<path d="M21.4 10.9a1 1 0 0 0 0-1.8L12.8 5.2a2 2 0 0 0-1.6 0L2.6 9.1a1 1 0 0 0 0 1.8l8.6 3.9a2 2 0 0 0 1.6 0z"/><path d="M22 10v6M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>',
        "file-text": '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 13h6M9 17h6"/>'
    };


    // Har path ko ek <symbol> me lapet do
    let symbols = "";

    for (const name in paths) {

        symbols +=
            '<symbol id="i-' + name + '" viewBox="0 0 24 24">' +
            paths[name] +
            "</symbol>";
    }


    // Sprite khud invisible hai, sirf definitions rakhta hai
    const sprite =
        '<svg xmlns="http://www.w3.org/2000/svg" ' +
        'style="position:absolute;width:0;height:0;overflow:hidden" ' +
        'aria-hidden="true" focusable="false">' +
        symbols +
        "</svg>";


    document.body.insertAdjacentHTML("afterbegin", sprite);

})();


// ==========================================================
// Chhota helper - JS se icon ka HTML banane ke liye.
// dashboard.js aur activity.js cards banate waqt use karte hain.
// ==========================================================

function icon(name) {

    return '<svg class="icon" aria-hidden="true"><use href="#i-' +
        name + '"></use></svg>';
}
