const siteHeader = document.querySelector("[data-site-header]");
const menuToggle = document.querySelector("[data-menu-toggle]");
const mobileMenu = document.querySelector("[data-mobile-menu]");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function setHeaderState() {
  siteHeader?.classList.toggle("is-scrolled", window.scrollY > 12);
}

function closeMenu({ restoreFocus = false } = {}) {
  if (!menuToggle || !mobileMenu) return;

  menuToggle.setAttribute("aria-expanded", "false");
  mobileMenu.classList.remove("is-open");
  siteHeader?.classList.remove("menu-active");
  document.body.classList.remove("menu-open");

  if (restoreFocus) menuToggle.focus();
}

function openMenu() {
  if (!menuToggle || !mobileMenu) return;

  menuToggle.setAttribute("aria-expanded", "true");
  mobileMenu.classList.add("is-open");
  siteHeader?.classList.add("menu-active");
  document.body.classList.add("menu-open");
  mobileMenu.querySelector("a")?.focus();
}

setHeaderState();
window.addEventListener("scroll", setHeaderState, { passive: true });

menuToggle?.addEventListener("click", () => {
  const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
  if (isOpen) {
    closeMenu();
  } else {
    openMenu();
  }
});

mobileMenu?.addEventListener("click", (event) => {
  if (event.target.closest("a")) closeMenu();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && menuToggle?.getAttribute("aria-expanded") === "true") {
    closeMenu({ restoreFocus: true });
  }
});

window.addEventListener("resize", () => {
  if (window.innerWidth > 920) closeMenu();
});

document.querySelectorAll("[data-current-year]").forEach((element) => {
  element.textContent = String(new Date().getFullYear());
});

const revealElements = document.querySelectorAll("[data-reveal]");

if (reducedMotion.matches || !("IntersectionObserver" in window)) {
  revealElements.forEach((element) => element.classList.add("is-visible"));
} else {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
  );

  revealElements.forEach((element) => revealObserver.observe(element));
}

document.querySelectorAll("[data-accordion-button]").forEach((button) => {
  const panelId = button.getAttribute("aria-controls");
  const panel = panelId ? document.getElementById(panelId) : null;

  button.addEventListener("click", () => {
    const isOpen = button.getAttribute("aria-expanded") === "true";
    button.setAttribute("aria-expanded", String(!isOpen));
    if (panel) panel.hidden = isOpen;
  });
});

let activeDialogTrigger = null;

document.querySelectorAll("[data-dialog-open]").forEach((trigger) => {
  const dialogId = trigger.getAttribute("data-dialog-open");
  const dialog = dialogId ? document.getElementById(dialogId) : null;

  trigger.addEventListener("click", () => {
    if (!(dialog instanceof HTMLDialogElement)) return;
    activeDialogTrigger = trigger;
    dialog.showModal();
    dialog.querySelector("[data-dialog-close]")?.focus();
  });
});

document.querySelectorAll("dialog").forEach((dialog) => {
  dialog.querySelectorAll("[data-dialog-close]").forEach((button) => {
    button.addEventListener("click", () => dialog.close());
  });

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });

  dialog.addEventListener("close", () => {
    activeDialogTrigger?.focus();
    activeDialogTrigger = null;
  });
});
