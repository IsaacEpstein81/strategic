const deck = document.querySelector(".deck");
const sections = [...document.querySelectorAll("[data-section]")];
const navLinks = [...document.querySelectorAll(".deck-nav__link")];
const currentSection = document.querySelector("[data-current-section]");
const totalSections = document.querySelector("[data-total-sections]");

let activeSectionId = null;
let scrollTicking = false;

if (totalSections) {
  totalSections.textContent = String(sections.length).padStart(2, "0");
}

const updateNav = (id) => {
  const index = sections.findIndex((section) => section.id === id);

  if (index === -1) {
    return;
  }

  navLinks.forEach((link) => {
    const isActive = link.getAttribute("href") === `#${id}`;
    link.classList.toggle("is-active", isActive);
  });

  if (currentSection) {
    currentSection.textContent = String(index + 1).padStart(2, "0");
  }
};

const setActiveSection = (id) => {
  if (!id || id === activeSectionId) {
    return;
  }

  sections.forEach((section) => {
    section.classList.toggle("is-visible", section.id === id);
  });

  updateNav(id);
  activeSectionId = id;
};

const getReferenceTop = () => deck?.getBoundingClientRect().top ?? 0;

const getNearestSection = () => {
  let nearestSection = sections[0] ?? null;
  let nearestDistance = Number.POSITIVE_INFINITY;
  const referenceTop = getReferenceTop();

  sections.forEach((section) => {
    const distance = Math.abs(section.getBoundingClientRect().top - referenceTop);

    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestSection = section;
    }
  });

  return nearestSection;
};

const syncActiveSection = () => {
  const nearestSection = getNearestSection();

  if (nearestSection) {
    setActiveSection(nearestSection.id);
  }
};

const requestSync = () => {
  if (scrollTicking) {
    return;
  }

  scrollTicking = true;

  requestAnimationFrame(() => {
    scrollTicking = false;
    syncActiveSection();
  });
};

const goToSection = (section, behavior = "smooth") => {
  if (!section) {
    return;
  }

  setActiveSection(section.id);
  section.scrollIntoView({ behavior, block: "start" });

  if (window.location.hash !== `#${section.id}`) {
    try {
      history.replaceState(null, "", `#${section.id}`);
    } catch {
      window.location.hash = section.id;
    }
  }
};

const setupVideoPlayers = () => {
  const players = [...document.querySelectorAll("[data-video-player]")];

  players.forEach((player) => {
    player.addEventListener("click", () => {
      const src = player.getAttribute("data-video-src");
      const title = player.getAttribute("data-video-title") || "Embedded video";
      const frame = player.closest(".video-frame");

      if (!src || !frame) {
        return;
      }

      const iframe = document.createElement("iframe");
      iframe.className = "video-frame__embed";
      iframe.src = `${src}${src.includes("?") ? "&" : "?"}autoplay=1`;
      iframe.title = title;
      iframe.allow = "autoplay; encrypted-media; picture-in-picture";
      iframe.allowFullscreen = true;
      iframe.loading = "lazy";

      frame.replaceChildren(iframe);
    });
  });
};

const initialTarget = window.location.hash
  ? document.querySelector(window.location.hash)
  : sections[0];

if (initialTarget) {
  setActiveSection(initialTarget.id);

  if (initialTarget !== sections[0]) {
    requestAnimationFrame(() => {
      goToSection(initialTarget, "auto");
    });
  }
}

navLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    const targetId = link.getAttribute("href");
    const target = targetId ? document.querySelector(targetId) : null;

    if (!target) {
      return;
    }

    event.preventDefault();
    goToSection(target);
  });
});

(deck || window).addEventListener("scroll", requestSync, { passive: true });
window.addEventListener("resize", requestSync);
window.addEventListener("hashchange", () => {
  const target = window.location.hash
    ? document.querySelector(window.location.hash)
    : sections[0];

  if (target) {
    goToSection(target, "auto");
  }
});

document.addEventListener("keydown", (event) => {
  const isInteractive = ["INPUT", "TEXTAREA", "SELECT", "BUTTON", "SUMMARY"].includes(
    document.activeElement?.tagName,
  );

  if (isInteractive) {
    return;
  }

  const currentIndex = Math.max(
    0,
    sections.findIndex((section) => section.id === activeSectionId),
  );

  let targetIndex = currentIndex;

  if (["ArrowDown", "PageDown", " "].includes(event.key)) {
    targetIndex = Math.min(currentIndex + 1, sections.length - 1);
  } else if (["ArrowUp", "PageUp"].includes(event.key)) {
    targetIndex = Math.max(currentIndex - 1, 0);
  } else if (event.key === "Home") {
    targetIndex = 0;
  } else if (event.key === "End") {
    targetIndex = sections.length - 1;
  } else {
    return;
  }

  event.preventDefault();
  goToSection(sections[targetIndex]);
});

setupVideoPlayers();
requestSync();
