// ==========================================
// TOKEN
// ==========================================

const token = localStorage.getItem("token");

if (!token) {
  window.location.href = "./login.html";
}



// ==========================================
// ELEMENTS
// ==========================================

const profileImage =
  document.getElementById("profileImage");

const changePhotoBtn =
  document.getElementById("changePhotoBtn");

const profilePhotoInput =
  document.getElementById("profilePhotoInput");

const logoutBtn =
  document.getElementById("logoutBtn");

const editProfileBtn =
  document.getElementById("editProfileBtn");


// Recent activity ke liye chahiye - ye jaanne ke liye ki
// main is transaction me lender tha ya borrower
let myId = "";



// ==========================================
// CHHOTE HELPERS
// ==========================================

// Item ke naam database se aate hain aur recent activity ki
// rows innerHTML se banti hain, isliye escape zaroori hai.
function esc(value) {

  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}


// Ek field ki value bharo. Agar backend se value nahi aayi
// to us poori row ko chhupa do - "Course: —" dikhane se
// achha hai wo cell hi na dikhe.
function setDetail(valueId, rowId, value) {

  const row = document.getElementById(rowId);

  if (!value) {
    row.hidden = true;
    return;
  }

  row.hidden = false;

  document.getElementById(valueId).textContent = value;
}



// ==========================================
// LOAD PROFILE
// ==========================================

async function loadProfile() {

  try {

    const response = await fetch("/api/users/me", {

      headers: {
        Authorization: `Bearer ${token}`
      }

    });


    const data = await response.json();


    if (response.status === 401) {

      localStorage.removeItem("token");

      window.location.href = "./login.html";

      return;
    }


    if (!response.ok) {

      console.log(data.message);

      return;
    }


    const user = data.user;

    myId = user._id;


    // Name

    document.getElementById("profileName").textContent =
      user.name;

    document.getElementById("navUserName").textContent =
      user.name;


    // Verified tick.
    // Ye markup me hidden rehta hai aur sirf tab dikhta hai
    // jab backend sach me isVerified: true bhejta hai. Pehle
    // ye har profile pe hamesha lagta tha, matlab har banda
    // "verified" dikhta tha - jo jhooth tha.

    // element.hidden HTMLElement pe hi kaam karti hai. Ye
    // ek <svg> hai (SVGElement), jahan `.hidden = false`
    // sirf ek bekaar JS property banata hai aur attribute
    // waise ka waisa laga rehta hai. Isliye seedhe attribute
    // se kaam lete hain.

    const tick = document.getElementById("verifiedTick");

    if (user.isVerified === true) {
      tick.removeAttribute("hidden");
    } else {
      tick.setAttribute("hidden", "");
    }


    // ---- detail grid ----
    // user.course abhi User schema me hai hi nahi, isliye wo
    // cell apne aap chhup jaayega. Jis din schema me course
    // add hoga, ye line bina badle kaam karne lagegi.

    setDetail("profileBranch", "branchRow", user.branch);
    setDetail("profileBatch",  "batchRow",  user.batch);
    setDetail("profileCourse", "courseRow", user.course);
    setDetail("profileEmail",  "emailRow",  user.email);

    // enrollmentNumber jaan-boojh kar nahi dikhaya jaata.


    // Profile Image

    if (user.profileImage) {

      profileImage.src =
        user.profileImage;

    }

  }

  catch (error) {

    console.log(
      "Profile loading error:",
      error
    );

  }

}



// ==========================================
// OPEN FILE PICKER
// ==========================================

changePhotoBtn.addEventListener(
  "click",
  function () {

    profilePhotoInput.click();

  }
);



// ==========================================
// UPLOAD PROFILE PHOTO
// ==========================================

profilePhotoInput.addEventListener(
  "change",
  async function () {

    const file =
      profilePhotoInput.files[0];


    if (!file) {
      return;
    }


    const formData =
      new FormData();


    formData.append(
      "profileImage",
      file
    );


    try {

      const response = await fetch(
        "/api/users/me/profile-photo",
        {

          method: "POST",

          headers: {
            Authorization: `Bearer ${token}`
          },

          body: formData

        }
      );


      const data =
        await response.json();


      if (!response.ok) {

        showToast(
          data.message ||
          "Unable to upload image",
          "error"
        );

        return;
      }


      // Update profile immediately

      profileImage.src =
        data.profileImage;


      showToast("Profile photo updated");

    }

    catch (error) {

      console.log(
        "Photo upload error:",
        error
      );

    }

  }
);



// ==========================================
// LOGOUT
// ==========================================

logoutBtn.addEventListener(
  "click",
  function () {

    localStorage.removeItem("token");

    window.location.href =
      "./login.html";

  }
);




// ==========================================
// STATS + TRUST SCORE (live data)
// ==========================================

// Bar ki width nikalne ke liye chhota helper
function percent(part, total) {

  if (!total) {
    return 0;
  }

  return Math.round((part / total) * 100);
}


async function loadStats() {

  try {

    const response = await fetch("/api/users/me/stats", {

      headers: {
        Authorization: `Bearer ${token}`
      }

    });


    const data = await response.json();


    if (!response.ok) {
      console.log(data.message);
      return;
    }


    const stats = data.stats;
    const trust = data.trust;


    // ---- 4 cards ----

    document.getElementById("peopleHelpedCount").textContent =
      stats.peopleHelped;

    document.getElementById("askedCount").textContent =
      stats.askedForHelp;

    document.getElementById("activeHelpsCount").textContent =
      stats.activeHelps;

    document.getElementById("activeBorrowsCount").textContent =
      stats.activeBorrows;


    // ---- score number ----

    document.getElementById("trustScore").textContent =
      trust.score;


    // ---- score circle ----
    // conic-gradient me sirf percentage badalna hai

    // Naye user ke liye ring poori khaali dikhti hai. Us
    // haalat me ring ko 100% bharna galat hoga, par usko
    // "0% bharosemand" jaisa dikhana bhi galat hai - isliye
    // sirf pill aur uska text badalte hain, ring nahi.
    const isNewMember = trust.total === 0;

    // Wahi orange aur wahi track colour jo tokens.css me hai
    // (--brand aur --line-soft)
    document.getElementById("scoreRing").style.background =
      "conic-gradient(#ff6845 0% " + trust.score + "%, " +
      "#f6f0ec " + trust.score + "% 100%)";


    // ---- trusted member / new member pill ----

    const pill = document.getElementById("trustPill");

    pill.classList.toggle("is-new", isNewMember);

    document.getElementById("trustPillText").textContent =
      isNewMember
        ? "New member"
        : "Trusted member";


    // ---- 4 rows: value + bar ----

    const rows = [
      ["successValue", "successBar", trust.successful],
      ["onTimeValue",  "onTimeBar",  trust.onTime],
      ["lateValue",    "lateBar",    trust.late],
      ["issuesValue",  "issuesBar",  trust.issues]
    ];

    rows.forEach((row) => {

      const valueId = row[0];
      const barId = row[1];
      const count = row[2];

      document.getElementById(valueId).textContent =
        count + "/" + trust.total;

      document.getElementById(barId).style.width =
        percent(count, trust.total) + "%";

    });

  }

  catch (error) {

    console.log("Stats loading error:", error);
  }

}



// ==========================================
// EDIT PROFILE
//
// Backend me abhi profile update ka koi endpoint nahi hai -
// userRoutes.js me sirf GET /me, GET /me/stats aur
// POST /me/profile-photo hain. Isliye ye button jhooth nahi
// bolta: jo cheez sach me badli ja sakti hai (photo) wahi
// kholta hai, aur baaki ke baare me saaf bata deta hai.
// ==========================================

editProfileBtn.addEventListener("click", function () {

  showToast("Right now only your profile photo can be changed.");

  profilePhotoInput.click();

});



// ==========================================
// RECENT ACTIVITY
//
// Iske liye koi alag API nahi hai, aur ek nayi banane ki
// zaroorat bhi nahi - /api/transactions/me already newest
// first sorted aati hai. Yahan usme se sirf teen sabse
// nayi lete hain.
// ==========================================

const recentList = document.getElementById("recentList");


// "2 days ago" jaisa text
function timeAgo(value) {

  const seconds = (Date.now() - new Date(value)) / 1000;

  const units = [
    ["year",  31536000],
    ["month", 2592000],
    ["week",  604800],
    ["day",   86400],
    ["hour",  3600],
    ["minute", 60]
  ];

  for (const unit of units) {

    const count = Math.floor(seconds / unit[1]);

    if (count >= 1) {
      return count + " " + unit[0] + (count > 1 ? "s" : "") + " ago";
    }
  }

  return "just now";
}


// Transaction ka sabse naya waqt. createdAt aakhri fallback
// hai - baaki sab optional hain.
function lastTouched(transaction) {

  return transaction.completedAt ||
    transaction.returnRequestedAt ||
    transaction.handedOverAt ||
    transaction.acceptedAt ||
    transaction.createdAt;
}


// Ek transaction ko ek line me likhna, mere role ke hisaab se
function describe(transaction, isLender) {

  const item = "<b>&ldquo;" +
    esc(transaction.needPost ? transaction.needPost.itemName : "an item") +
    "&rdquo;</b>";

  const status = transaction.status;


  if (status === "completed") {

    if (isLender) {
      return { tone: "tone-green", icon: "check-circle",
               text: "You helped someone with " + item };
    }

    return {
      tone: "tone-green",
      icon: "swap",
      text: "You returned " + item +
        (transaction.returnedOnTime ? " on time" : " late")
    };
  }

  if (status === "return_pending") {
    return { tone: "tone-blue", icon: "swap",
             text: "You marked " + item + " as returned" };
  }

  if (status === "borrowed") {
    return isLender
      ? { tone: "tone-orange", icon: "box",
          text: "You handed over " + item }
      : { tone: "tone-orange", icon: "box",
          text: "You borrowed " + item };
  }

  if (status === "accepted") {
    return { tone: "tone-blue", icon: "check",
             text: "An offer was accepted for " + item };
  }

  if (status === "offered") {
    return isLender
      ? { tone: "tone-blue", icon: "send",
          text: "You offered to help with " + item }
      : { tone: "tone-blue", icon: "send",
          text: "You received an offer for " + item };
  }

  if (status === "withdrawn") {
    return { tone: "tone-red", icon: "x",
             text: "An offer for " + item + " was withdrawn" };
  }

  return { tone: "tone-red", icon: "x",
           text: "An offer for " + item + " was not selected" };
}


async function loadRecent() {

  try {

    const response = await fetch("/api/transactions/me", {

      headers: {
        Authorization: `Bearer ${token}`
      }

    });


    const data = await response.json();


    if (!response.ok) {
      console.log(data.message);
      recentList.innerHTML = "";
      return;
    }


    const transactions = data.transactions || [];


    if (transactions.length === 0) {

      recentList.innerHTML =
        '<p class="recent-empty">' +
          "Nothing here yet. Your first help or borrow will show up on this list." +
        "</p>";

      return;
    }


    // Sabse naya kaam pehle. Backend createdAt se sort karta
    // hai, par ek purana transaction kal hi complete hua ho
    // sakta hai - isliye yahan dobara sort karte hain.
    const recent = transactions
      .slice()
      .sort((a, b) => new Date(lastTouched(b)) - new Date(lastTouched(a)))
      .slice(0, 3);


    recentList.innerHTML = "";


    recent.forEach((transaction) => {

      const isLender =
        transaction.lender && transaction.lender._id === myId;

      const line = describe(transaction, isLender);


      const row = document.createElement("div");

      row.className = "recent-row";

      row.innerHTML =
        '<span class="recent-icon ' + line.tone + '">' +
          icon(line.icon) +
        "</span>" +
        '<span class="recent-text">' + line.text + "</span>" +
        '<span class="recent-when">' +
          timeAgo(lastTouched(transaction)) +
        "</span>";

      recentList.appendChild(row);
    });

  }

  catch (error) {

    console.log("Recent activity error:", error);

    recentList.innerHTML = "";
  }

}



// ==========================================
// START
// ==========================================

// loadRecent ko myId chahiye, jo loadProfile set karta hai -
// isliye ye uske poora hone ka intezaar karta hai.
loadProfile().then(loadRecent);

loadStats();
