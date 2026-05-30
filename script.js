/* -------------------------------------------------
  Scroll navigation + UI
  Stripe checkout
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

/* Donate preset logic */
const chips = Array.from(document.querySelectorAll(".chip"));
const customAmount = document.getElementById("customAmount");
const donateBtn = document.getElementById("donateBtn");
let selectedAmount = 25;

function updateDonateButton(amount) {
  if (donateBtn) {
    donateBtn.innerHTML = `Donate $${amount} <i class="ph ph-arrow-right"></i>`;
  }
}

function setSelectedAmount(amount) {
  selectedAmount = amount;
  chips.forEach((chip) => {
    chip.classList.toggle("isSelected", Number(chip.dataset.amt) === amount);
  });
  updateDonateButton(amount);
}

chips.forEach((chip) => {
  chip.addEventListener("click", () => {
    setSelectedAmount(Number(chip.dataset.amt));
    if (customAmount) customAmount.value = "";
  });
});

if (customAmount) {
  customAmount.addEventListener("input", () => {
    const cleaned = customAmount.value.replace(/[^\d]/g, "");
    customAmount.value = cleaned;

    if (!cleaned) {
      updateDonateButton(selectedAmount);
      return;
    }

    chips.forEach((chip) => chip.classList.remove("isSelected"));
    updateDonateButton(Number(cleaned));
  });
}

/* Goal of month UI */
const goalTotal = 500;
let raised = 0;

const raisedLabel = document.getElementById("raisedLabel");
const goalLabel = document.getElementById("goalLabel");
const goalBar = document.getElementById("goalBar");
const percentLabel = document.getElementById("percentLabel");
const remainingLabel = document.getElementById("remainingLabel");
const progressEl = document.querySelector(".progress");

function formatMoney(n) {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function updateGoalUI() {
  if (goalLabel) goalLabel.textContent = formatMoney(goalTotal);
  if (raisedLabel) raisedLabel.textContent = formatMoney(raised);

  const pct = Math.max(0, Math.min(1, raised / goalTotal));

  if (goalBar) goalBar.style.width = `${pct * 100}%`;
  if (percentLabel) percentLabel.textContent = `${Math.round(pct * 100)}%`;

  const remaining = Math.max(0, goalTotal - raised);
  if (remainingLabel) remainingLabel.textContent = `${formatMoney(remaining)} to go`;

  if (progressEl) progressEl.setAttribute("aria-valuenow", String(raised));
}

updateGoalUI();

/* Donate submit */
const donateForm = document.getElementById("donateForm");

function getDonationAmountCents() {
  const custom = customAmount && customAmount.value.trim();
  const dollars = custom ? Number(custom) : selectedAmount;
  return Math.round(dollars * 100);
}

if (donateForm) {
  donateForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const amountCents = getDonationAmountCents();
    if (amountCents < 50) {
      alert("Please enter at least $0.50.");
      return;
    }

    const btn = document.getElementById("donateBtn");
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = "Redirecting to Stripe…";

    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amountCents }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Something went wrong");
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err) {
      alert(err.message || "Could not start checkout. Try again.");
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  });
}
