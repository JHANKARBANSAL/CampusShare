document.addEventListener("DOMContentLoaded", () => {

  const form = document.getElementById("needForm");
  const successMessage = document.getElementById("successMessage");

  // ---------- AI Post Assistant ----------

  const aiFillBtn = document.getElementById("aiFillBtn");
  const aiText = document.getElementById("aiText");
  const aiStatus = document.getElementById("aiStatus");

  aiFillBtn.addEventListener("click", async () => {

    const text = aiText.value.trim();

    if (!text) {
      aiStatus.textContent = "Pehle kuch to likho";
      return;
    }

    const token = localStorage.getItem("token");

    aiFillBtn.disabled = true;
    aiStatus.textContent = "Soch raha hai...";

    try {

      const response = await fetch("/api/needs/ai-parse", {

        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token
        },

        body: JSON.stringify({ text: text })
      });

      const data = await response.json();

      if (!response.ok) {

        aiStatus.textContent = data.message || "Kuch gadbad ho gayi";

      } else {

        document.getElementById("itemName").value = data.itemName;
        document.getElementById("description").value = data.description;
        document.getElementById("neededBy").value = data.neededBy;
        document.getElementById("durationValue").value = data.durationValue;
        document.getElementById("durationUnit").value = data.durationUnit;

        aiStatus.textContent = "Form bhar diya, ek baar check kar lo";
      }

    } catch (error) {

      console.log("AI assist error:", error);
      aiStatus.textContent = "AI se connect nahi ho paya";
    }

    aiFillBtn.disabled = false;
  });

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