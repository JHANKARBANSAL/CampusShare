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


    // Name

    document.getElementById("profileName").textContent =
      user.name;

    document.getElementById("navUserName").textContent =
      user.name;


    // Branch

    document.getElementById("profileBranch").textContent =
      user.branch;


    // Batch

    document.getElementById("profileBatch").textContent =
      user.batch;


    // Email

    document.getElementById("profileEmail").textContent =
      user.email;


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

    // Wahi orange jo tokens.css me hai (--brand)
    document.getElementById("scoreRing").style.background =
      "conic-gradient(#ff6845 0% " + trust.score + "%, " +
      "#f1e7e1 " + trust.score + "% 100%)";


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
// START
// ==========================================

loadProfile();
loadStats();
