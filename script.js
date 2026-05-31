/* -------------------------------------------------
  Scroll navigation + UI
---------------------------------------------------*/

const sections = Array.from(document.querySelectorAll("[data-page]"));
const navLinks = Array.from(document.querySelectorAll("[data-route]"));
const sideNav = document.getElementById("sideNav");
const navToggle = document.getElementById("navToggle");

const SCROLL_OFFSET = 20;

function getSectionId(route) {
  return sections.some((s) => s.id === route) ? route : "home";
}

function scrollToSection(route, behavior = "smooth") {
  const id = getSectionId(route);
  const el = document.getElementById(id);
  if (!el) return;

  const top = el.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET;
  window.scrollTo({ top, behavior });

  if (history.replaceState) {
    history.replaceState(null, "", `#${id}`);
  } else {
    window.location.hash = id;
  }

  setActiveNav(id);
  closeMobileNav();
}

function setActiveNav(route) {
  navLinks.forEach((link) => {
    link.classList.toggle("isActive", link.dataset.route === route);
  });
}

function closeMobileNav() {
  if (sideNav) sideNav.classList.remove("isOpen");
  if (navToggle) navToggle.setAttribute("aria-expanded", "false");
}

navLinks.forEach((link) => {
  link.addEventListener("click", (e) => {
    const route = link.dataset.route;
    if (!route) return;
    e.preventDefault();
    scrollToSection(route);
  });
});

const observer = new IntersectionObserver(
  (entries) => {
    const visible = entries
      .filter((e) => e.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

    if (visible.length > 0) {
      setActiveNav(visible[0].target.id);
    }
  },
  { rootMargin: "-20% 0px -55% 0px", threshold: [0, 0.15, 0.4] }
);

sections.forEach((section) => observer.observe(section));

function scrollFromHash() {
  const raw = (window.location.hash || "#home").replace("#", "");
  const route = raw.split("?")[0];
  const id = getSectionId(route);

  requestAnimationFrame(() => {
    scrollToSection(id, "auto");
  });
}

window.addEventListener("hashchange", () => scrollFromHash());
scrollFromHash();

if (navToggle) {
  navToggle.addEventListener("click", () => {
    const open = sideNav.classList.toggle("isOpen");
    navToggle.setAttribute("aria-expanded", open ? "true" : "false");
  });
}
