// ==========================================================
// SHARED NAVBAR SCRIPT
// Har page pe navbar me user ka asli naam aur avatar (photo/akshar)
// bhar deta hai. Pehle se save data turant dikhata hai taaki layout shift na ho.
// ==========================================================

function renderAvatar(avatarElement, name, photoUrl) {
    if (!avatarElement) return;

    if (photoUrl) {
        avatarElement.innerHTML = `<img src="${photoUrl}" alt="${name || 'User'}">`;
        avatarElement.style.background = "transparent";
    } else if (name) {
        avatarElement.textContent = name.charAt(0).toUpperCase();
        avatarElement.style.background = "";
    }
}

(async function fillNavbar() {

    const token = localStorage.getItem("token");

    // Login nahi hai to kuch mat karo, page waise hi chalega
    if (!token) {
        return;
    }

    const nameElement = document.getElementById("navUserName");
    const avatarElement = document.getElementById("navAvatar");

    if (!nameElement && !avatarElement) {
        return;
    }

    // Cache se turant naam aur avatar dikhao taaki page switch pe koi shift na ho
    const cachedName = localStorage.getItem("userName");
    const cachedPhoto = localStorage.getItem("userProfileImage");

    if (cachedName && nameElement) {
        nameElement.textContent = cachedName;
    }
    if (cachedPhoto || cachedName) {
        renderAvatar(avatarElement, cachedName, cachedPhoto);
    }

    try {

        const response = await fetch("/api/users/me", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!response.ok) {
            return;
        }

        const user = (await response.json()).user;

        if (user && user.name) {
            localStorage.setItem("userName", user.name);
            if (nameElement) {
                nameElement.textContent = user.name;
            }

            if (user.profileImage) {
                localStorage.setItem("userProfileImage", user.profileImage);
                renderAvatar(avatarElement, user.name, user.profileImage);
            } else {
                localStorage.removeItem("userProfileImage");
                renderAvatar(avatarElement, user.name, null);
            }
        }

    }

    catch (error) {
        console.log("Navbar load error:", error);
    }

})();
