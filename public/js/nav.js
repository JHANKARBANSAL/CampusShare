// ==========================================================
// SHARED NAVBAR SCRIPT
// Har page pe navbar me user ka asli naam aur pehla akshar
// bhar deta hai. Pehle har page pe "Jhankar" hardcoded tha.
// ==========================================================

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


        if (nameElement) {
            nameElement.textContent = user.name;
        }

        // Avatar me naam ka pehla akshar
        if (avatarElement) {
            avatarElement.textContent =
                user.name.charAt(0).toUpperCase();
        }

    }

    catch (error) {
        console.log("Navbar load error:", error);
    }

})();
