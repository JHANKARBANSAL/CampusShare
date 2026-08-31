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

        alert(
          data.message ||
          "Unable to upload image"
        );

        return;
      }


      // Update profile immediately

      profileImage.src =
        data.profileImage;


      alert(
        "Profile photo updated"
      );

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
// START
// ==========================================

loadProfile();
