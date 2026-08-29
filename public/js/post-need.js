document.addEventListener("DOMContentLoaded", () => {

  const form = document.getElementById("needForm");
  const successMessage = document.getElementById("successMessage");

  form.addEventListener("submit", async (event) => {

    event.preventDefault();

    // Form se values lena
    const itemName = document.getElementById("itemName").value;
    const description = document.getElementById("description").value;
    const neededBy = document.getElementById("neededBy").value;
    const durationValue =
  document.getElementById("durationValue").value;

const durationUnit =
  document.getElementById("durationUnit").value;

    // Login ke time save hua JWT
    const token = localStorage.getItem("token");

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

      } else {

        alert(data.message);

      }

    } catch (error) {

      console.log("Error posting need:", error);
      alert("Unable to post need");

    }

  });

});