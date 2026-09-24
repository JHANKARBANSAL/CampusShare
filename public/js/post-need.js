document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("needForm");
  const successMessage = document.getElementById("successMessage");
  
  // Prevent selecting past dates
  const neededByInput = document.getElementById("neededBy");
  if (neededByInput) {
    const today = new Date().toISOString().split("T")[0];
    neededByInput.setAttribute("min", today);
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    // Form se values lena
    const itemName = document.getElementById("itemName").value.trim();
    const description = document.getElementById("description").value.trim();
    const neededBy = document.getElementById("neededBy").value;
    const durationValue = document.getElementById("durationValue").value;
    const durationUnit = document.getElementById("durationUnit").value;

    // Login ke time save hua JWT
    const token = localStorage.getItem("token");

    if (!token) {
      window.location.href = "./login.html";
      return;
    }

    try {
      const response = await fetch("/api/needs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          itemName,
          description,
          neededBy,
          durationValue,
          durationUnit
        })
      });

      const data = await response.json();

      if (response.ok) {
        successMessage.textContent = "Need posted successfully!";
        successMessage.classList.add("show");
        form.reset();

        setTimeout(() => {
          window.location.href = "./dashboard.html";
        }, 1500);
      } else {
        alert(data.message || "Unable to post need");
      }
    } catch (error) {
      console.log("Error posting need:", error);
      alert("Unable to post need");
    }
  });
});