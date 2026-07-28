const enquiryForm = document.getElementById("enquiry-form");

if (enquiryForm) {
  const steps = Array.from(enquiryForm.querySelectorAll("[data-form-step]"));
  const nextButton = enquiryForm.querySelector("[data-form-next]");
  const backButton = enquiryForm.querySelector("[data-form-back]");
  const progressLabel = enquiryForm.querySelector("[data-form-progress-label]");
  const progressBar = enquiryForm.querySelector("[data-form-progress-bar]");
  const submitButton = enquiryForm.querySelector('button[type="submit"]');
  const formMessage = enquiryForm.querySelector("[data-form-message]");
  const startedAt = enquiryForm.querySelector('input[name="startedAt"]');
  let currentStep = 0;
  let submitting = false;

  if (startedAt) startedAt.value = String(Date.now());

  function showStep(index) {
    currentStep = index;
    steps.forEach((step, stepIndex) => {
      step.hidden = stepIndex !== index;
    });
    if (progressLabel) progressLabel.textContent = `Step ${index + 1} of ${steps.length}`;
    if (progressBar) progressBar.style.width = `${((index + 1) / steps.length) * 100}%`;
    formMessage.textContent = "";
    formMessage.className = "form-message";
  }

  function validateStep(step) {
    const fields = Array.from(step.querySelectorAll("input, select, textarea"));
    for (const field of fields) {
      if (!field.checkValidity()) {
        field.reportValidity();
        field.focus();
        return false;
      }
    }
    return true;
  }

  nextButton?.addEventListener("click", () => {
    if (!validateStep(steps[currentStep])) return;
    showStep(1);
    steps[1].querySelector("input, select, textarea")?.focus();
  });

  backButton?.addEventListener("click", () => {
    showStep(0);
    steps[0].querySelector("input, select, textarea")?.focus();
  });

  enquiryForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (submitting || !validateStep(steps[currentStep])) return;

    const formData = new FormData(enquiryForm);
    const messageParts = [
      `Phone: ${formData.get("phone") || "Not provided"}`,
      `Coaching tier: ${formData.get("coachingType")}`,
      `Training experience: ${formData.get("experience")}`,
      `What has been making progress difficult: ${formData.get("challenge")}`,
    ];
    const extraMessage = String(formData.get("message") || "").trim();
    if (extraMessage) messageParts.push(`Additional message: ${extraMessage}`);

    const payload = {
      name: String(formData.get("name") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      goal: String(formData.get("goal") || ""),
      message: messageParts.join("\n\n").slice(0, 2000),
      company: String(formData.get("company") || ""),
      startedAt: Number(formData.get("startedAt") || Date.now()),
    };

    submitting = true;
    submitButton.disabled = true;
    submitButton.textContent = "Sending...";
    formMessage.textContent = "Sending your enquiry securely...";
    formMessage.className = "form-message";

    try {
      const response = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || "Your enquiry could not be sent. Please try again.");
      }

      formMessage.textContent = result.autoReplySent
        ? "Thanks, your enquiry is in. Check your inbox for Jaraad's welcome email and booking link."
        : "Thanks, your enquiry is in. Jaraad will reply to you by email.";
      formMessage.className = "form-message success";
      enquiryForm.querySelectorAll("input, select, textarea, button").forEach((field) => {
        field.disabled = true;
      });
    } catch (error) {
      formMessage.textContent =
        error instanceof Error ? error.message : "Your enquiry could not be sent. Please try again.";
      formMessage.className = "form-message error";
      submitButton.disabled = false;
      submitButton.textContent = "Send Enquiry";
      submitting = false;
    }
  });

  showStep(0);
}
