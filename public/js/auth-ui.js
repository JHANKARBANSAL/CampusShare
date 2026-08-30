/* ==========================================================================
   Auth pages — shared chrome and form behaviour (login + signup)
   Purely presentational. The API calls stay in login.js / signup.js so the
   request bodies and endpoints are untouched.
   ========================================================================== */

const CSAuth = (() => {

  /* ---- Static chrome --------------------------------------------------- */

  // The three trust points on the green panel. Kept short and honest: each one
  // describes something the product actually does.
  const POINTS = [
    { icon: "shield-check", text: "Verified students only" },
    { icon: "map-pin", text: "Sharing stays inside your campus" },
    { icon: "hand-helping", text: "Built on community trust" }
  ];

  function renderChrome() {
    const brand = document.getElementById("asideBrand");
    if (brand) brand.insertAdjacentHTML("afterbegin", CS.icon("book-open", "icon-lg"));

    const back = document.getElementById("authBack");
    if (back) back.insertAdjacentHTML("beforeend", CS.icon("arrow-left"));

    const note = document.getElementById("photoNote");
    if (note) note.insertAdjacentHTML("afterbegin", CS.icon("info", "icon-sm"));

    const points = document.getElementById("authPoints");
    if (points) {
      points.innerHTML = POINTS
        .map(p => "<li>" + CS.icon(p.icon) + "<span>" + p.text + "</span></li>")
        .join("");
    }
  }

  /* ---- Password reveal -------------------------------------------------- */

  // Buttons are marked up as <button class="password-toggle" data-target="id">.
  function bindPasswordToggles() {
    document.querySelectorAll(".password-toggle").forEach((button) => {
      const input = document.getElementById(button.dataset.target);
      if (!input) return;

      const paint = () => {
        const shown = input.type === "text";
        button.innerHTML = CS.icon(shown ? "eye-off" : "eye");
        button.setAttribute("aria-pressed", String(shown));
        button.setAttribute("aria-label", shown ? "Hide password" : "Show password");
      };

      paint();

      button.addEventListener("click", () => {
        input.type = input.type === "password" ? "text" : "password";
        paint();
        input.focus();
      });
    });
  }

  /* ---- Field validation -------------------------------------------------- */

  // Each field's error element is <input id>Error by convention.
  function errorEl(input) {
    return document.getElementById(input.id + "Error");
  }

  function setFieldError(input, message) {
    input.classList.add("is-invalid");
    input.setAttribute("aria-invalid", "true");

    const el = errorEl(input);
    if (el) {
      el.innerHTML = CS.icon("alert-circle", "icon-sm") + "<span>" + CS.escapeHtml(message) + "</span>";
      el.classList.add("show");
      if (!el.id) return;
      input.setAttribute("aria-describedby", el.id);
    }
  }

  function clearFieldError(input) {
    input.classList.remove("is-invalid");
    input.removeAttribute("aria-invalid");
    const el = errorEl(input);
    if (el) {
      el.classList.remove("show");
      el.textContent = "";
    }
  }

  // Returns a message string when the value is not acceptable, else "".
  function checkField(input) {
    const value = input.value.trim();

    if (input.required && !value) {
      return (input.dataset.label || "This field") + " is required";
    }
    if (!value) return "";

    if (input.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return "Enter a valid email address";
    }
    if (input.type === "password" && input.dataset.minlength) {
      const min = Number(input.dataset.minlength);
      if (value.length < min) return "Use at least " + min + " characters";
    }
    return "";
  }

  // Validates every required/typed control in the form. Focuses the first
  // problem so keyboard users are taken straight to it.
  function validateForm(form) {
    const inputs = Array.from(form.querySelectorAll("input, textarea, select"));
    let firstBad = null;

    inputs.forEach((input) => {
      const message = checkField(input);
      if (message) {
        setFieldError(input, message);
        if (!firstBad) firstBad = input;
      } else {
        clearFieldError(input);
      }
    });

    if (firstBad) firstBad.focus();
    return !firstBad;
  }

  // Re-validate on blur, and clear an existing error as soon as the user types.
  function bindLiveValidation(form) {
    form.querySelectorAll("input, textarea, select").forEach((input) => {
      input.addEventListener("blur", () => {
        const message = checkField(input);
        if (message) setFieldError(input, message);
        else clearFieldError(input);
      });

      input.addEventListener("input", () => {
        if (input.classList.contains("is-invalid")) clearFieldError(input);
      });
    });
  }

  /* ---- Form-level message + submit state --------------------------------- */

  // Writes into the existing #message element the page scripts already use.
  function setMessage(el, text, type) {
    if (!el) return;
    if (!text) {
      el.classList.remove("show", "is-error", "is-success");
      el.textContent = "";
      return;
    }
    el.className = "form-message show is-" + (type === "success" ? "success" : "error");
    el.innerHTML =
      CS.icon(type === "success" ? "check-circle" : "alert-circle", "icon-sm") +
      "<span>" + CS.escapeHtml(text) + "</span>";
  }

  function setLoading(button, loading, loadingLabel) {
    if (!button) return;

    if (loading) {
      if (!button.dataset.label) button.dataset.label = button.textContent.trim();
      button.disabled = true;
      button.innerHTML = '<span class="spinner" aria-hidden="true"></span><span>' +
        CS.escapeHtml(loadingLabel || "Please wait") + "</span>";
    } else {
      button.disabled = false;
      button.textContent = button.dataset.label || button.textContent;
    }
  }

  /* ---- Init -------------------------------------------------------------- */

  function init() {
    renderChrome();
    bindPasswordToggles();
    const form = document.querySelector("form");
    if (form) bindLiveValidation(form);
  }

  document.addEventListener("DOMContentLoaded", init);

  return { validateForm, setMessage, setLoading, setFieldError, clearFieldError };
})();
