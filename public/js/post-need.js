// CampusShare - "Post a Need" form logic
// (No backend yet, so we just show a success message when the form is submitted.)

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("needForm");
  const successMessage = document.getElementById("successMessage");

  form.addEventListener("submit", (event) => {
    event.preventDefault(); // stop the page from reloading

    // Read the values the student typed in
    const itemName = document.getElementById("itemName").value;
    const description = document.getElementById("description").value;
    const neededBy = document.getElementById("neededBy").value;
    const duration = document.getElementById("duration").value;

    console.log("New request:", { itemName, description, neededBy, duration });

    // Show the green success message
    successMessage.classList.add("show");

    // Clear the form so it's ready for a new request
    form.reset();

    // Scroll up so the student actually sees the message
    successMessage.scrollIntoView({ behavior: "smooth" });
  });
});
