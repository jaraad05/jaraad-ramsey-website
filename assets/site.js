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

document.querySelectorAll("[data-app-gallery]").forEach((gallery) => {
  const slides = Array.from(gallery.querySelectorAll("[data-app-slide]"));
  const showcase = gallery.closest(".app-mobile-showcase");
  const dots = Array.from(showcase?.querySelectorAll("[data-app-gallery-dot]") ?? []);
  let activeIndex = 0;
  let scrollTimer;

  function setActiveSlide(index) {
    activeIndex = Math.max(0, Math.min(index, slides.length - 1));
    dots.forEach((dot, dotIndex) => {
      dot.setAttribute("aria-pressed", String(dotIndex === activeIndex));
    });
  }

  function scrollToSlide(index) {
    const nextIndex = Math.max(0, Math.min(index, slides.length - 1));
    const slide = slides[nextIndex];
    if (!slide) return;

    const left = slide.offsetLeft - (gallery.clientWidth - slide.clientWidth) / 2;
    gallery.scrollTo({
      left,
      behavior: reducedMotion.matches ? "auto" : "smooth",
    });
    setActiveSlide(nextIndex);
  }

  function updateFromScroll() {
    const galleryCenter = gallery.scrollLeft + gallery.clientWidth / 2;
    const nearestIndex = slides.reduce((nearest, slide, index) => {
      const slideCenter = slide.offsetLeft + slide.clientWidth / 2;
      const nearestSlide = slides[nearest];
      const nearestCenter = nearestSlide.offsetLeft + nearestSlide.clientWidth / 2;
      return Math.abs(slideCenter - galleryCenter) < Math.abs(nearestCenter - galleryCenter)
        ? index
        : nearest;
    }, 0);

    setActiveSlide(nearestIndex);
  }

  dots.forEach((dot, index) => {
    dot.addEventListener("click", () => scrollToSlide(index));
  });

  gallery.addEventListener("keydown", (event) => {
    const keyTargets = {
      ArrowLeft: activeIndex - 1,
      ArrowRight: activeIndex + 1,
      Home: 0,
      End: slides.length - 1,
    };

    if (!(event.key in keyTargets)) return;
    event.preventDefault();
    scrollToSlide(keyTargets[event.key]);
  });

  gallery.addEventListener(
    "scroll",
    () => {
      window.clearTimeout(scrollTimer);
      scrollTimer = window.setTimeout(updateFromScroll, 80);
    },
    { passive: true },
  );

  setActiveSlide(0);
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
