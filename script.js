const projectCards = [...document.querySelectorAll(".project-card")];
const filterButtons = [...document.querySelectorAll(".filter-button")];
const searchInput = document.querySelector("#project-search");
const visibleCount = document.querySelector("#visible-count");
const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector(".nav-links");
const musicUnlockForm = document.querySelector("#music-unlock-form");
const musicAnswer = document.querySelector("#music-answer");
const musicAnswerMessage = document.querySelector("#music-answer-message");
const musicGate = document.querySelector("#music-gate");
const musicLibrary = document.querySelector("#music-library");
const musicLockButton = document.querySelector("#music-lock-button");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let activeFilter = "all";

const updateScrollProgress = () => {
  const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollableHeight > 0 ? window.scrollY / scrollableHeight : 0;
  document.documentElement.style.setProperty("--progress", progress.toFixed(4));
};

const applyProjectFilters = () => {
  const query = searchInput.value.trim().toLowerCase();
  let count = 0;

  projectCards.forEach((card) => {
    const categories = card.dataset.category.split(/\s+/);
    const categoryMatch = activeFilter === "all" || categories.includes(activeFilter);
    const searchableText = `${card.innerText} ${card.dataset.keywords}`.toLowerCase();
    const queryMatch = !query || searchableText.includes(query);
    const shouldShow = categoryMatch && queryMatch;

    card.classList.toggle("is-hidden", !shouldShow);
    card.toggleAttribute("hidden", !shouldShow);

    if (shouldShow) {
      count += 1;
    }
  });

  visibleCount.textContent = count;
};

const closePreview = (card) => {
  const preview = card.querySelector(".preview");
  const button = card.querySelector(".preview-toggle");

  preview.replaceChildren();
  card.classList.remove("has-preview");

  if (button) {
    button.dataset.open = "false";
    button.lastChild.textContent = button.dataset.type === "youtube" ? "Watch" : "Preview";
  }
};

const buildPreview = ({ type, url, title }) => {
  const shell = document.createElement("div");
  shell.className = "preview-inner";

  if (type === "image") {
    const image = document.createElement("img");
    image.src = url;
    image.alt = `${title} preview`;
    image.loading = "lazy";
    shell.append(image);
    return shell;
  }

  const iframe = document.createElement("iframe");
  iframe.src = url;
  iframe.title = `${title} preview`;
  iframe.loading = "lazy";
  iframe.allowFullscreen = true;

  if (type === "youtube") {
    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
  }

  shell.append(iframe);
  return shell;
};

const wireProjectInteractions = () => {
  projectCards.forEach((card) => {
    const previewButton = card.querySelector(".preview-toggle");
    const detailsButton = card.querySelector(".details-toggle");
    const preview = card.querySelector(".preview");
    const title = card.querySelector("h3").textContent.trim();

    if (previewButton) {
      previewButton.addEventListener("click", () => {
      const isOpen = previewButton.dataset.open === "true";

      if (isOpen) {
        closePreview(card);
        return;
      }

      projectCards.forEach((otherCard) => {
        if (otherCard !== card) {
          closePreview(otherCard);
        }
      });

      preview.replaceChildren(
        buildPreview({
          type: previewButton.dataset.type,
          url: previewButton.dataset.url,
          title,
        })
      );

      card.classList.add("has-preview");
      previewButton.dataset.open = "true";
      previewButton.lastChild.textContent = "Hide";
      });
    }

    if (detailsButton) {
      detailsButton.addEventListener("click", () => {
        const isOpen = card.classList.toggle("is-open");
        detailsButton.setAttribute("aria-expanded", String(isOpen));
        detailsButton.lastChild.textContent = isOpen ? "Less" : "Details";
      });
    }
  });
};

const setMusicVaultState = (isUnlocked, announce = false) => {
  musicGate.hidden = isUnlocked;
  musicLibrary.hidden = !isUnlocked;

  if (announce) {
    musicAnswerMessage.classList.remove("is-error");
    musicAnswerMessage.classList.add("is-success");
    musicAnswerMessage.textContent = "Correct. Opening the music vault…";
  }
};

const digestAnswer = async (answer) => {
  const answerBytes = new TextEncoder().encode(answer);
  const digest = await crypto.subtle.digest("SHA-256", answerBytes);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

const wireMusicVault = () => {
  if (!musicUnlockForm) {
    return;
  }

  const unlockedForSession = sessionStorage.getItem("music-vault-unlocked") === "true";
  setMusicVaultState(unlockedForSession);

  musicUnlockForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const normalizedAnswer = musicAnswer.value.trim().toLowerCase();

    if (!normalizedAnswer) {
      musicAnswer.setAttribute("aria-invalid", "true");
      musicAnswerMessage.className = "music-answer-message is-error";
      musicAnswerMessage.textContent = "Enter an answer to try the lock.";
      musicAnswer.focus();
      return;
    }

    const answerDigest = await digestAnswer(normalizedAnswer);
    const isCorrect =
      answerDigest === "8d2ac8b58ead9744d77286de9b0bcb7a894f238c3149fc9f3b1e3caff36330fe";

    if (!isCorrect) {
      musicAnswer.setAttribute("aria-invalid", "true");
      musicAnswerMessage.className = "music-answer-message is-error";
      musicAnswerMessage.textContent = "That did not open it. Try another answer.";
      musicAnswer.select();
      return;
    }

    musicAnswer.removeAttribute("aria-invalid");
    sessionStorage.setItem("music-vault-unlocked", "true");
    setMusicVaultState(true, true);
  });

  musicAnswer.addEventListener("input", () => {
    musicAnswer.removeAttribute("aria-invalid");
    musicAnswerMessage.className = "music-answer-message";
    musicAnswerMessage.textContent = "";
  });

  musicLockButton.addEventListener("click", () => {
    sessionStorage.removeItem("music-vault-unlocked");
    musicAnswer.value = "";
    musicAnswerMessage.className = "music-answer-message";
    musicAnswerMessage.textContent = "";
    setMusicVaultState(false);
    musicAnswer.focus();
  });
};

const wireTiltEffects = () => {
  if (prefersReducedMotion || !window.matchMedia("(pointer: fine)").matches) {
    return;
  }

  document.querySelectorAll(".tilt-target").forEach((element) => {
    element.addEventListener("pointermove", (event) => {
      const rect = element.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;

      element.style.setProperty("--rotate-x", `${(-y * 5).toFixed(2)}deg`);
      element.style.setProperty("--rotate-y", `${(x * 5).toFixed(2)}deg`);
    });

    element.addEventListener("pointerleave", () => {
      element.style.setProperty("--rotate-x", "0deg");
      element.style.setProperty("--rotate-y", "0deg");
    });
  });
};

const wireRevealEffects = () => {
  const revealItems = document.querySelectorAll(".reveal");

  if (!("IntersectionObserver" in window) || prefersReducedMotion) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.16 }
  );

  revealItems.forEach((item) => observer.observe(item));
};

const wireNavState = () => {
  const sectionLinks = [...document.querySelectorAll(".nav-links a")];
  const sections = sectionLinks
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          sectionLinks.forEach((link) => {
            link.classList.toggle("is-active", link.getAttribute("href") === `#${entry.target.id}`);
          });
        });
      },
      { rootMargin: "-35% 0px -55% 0px" }
    );

    sections.forEach((section) => observer.observe(section));
  }

  sectionLinks.forEach((link) => {
    link.addEventListener("click", () => {
      navToggle.setAttribute("aria-expanded", "false");
      navLinks.classList.remove("is-open");
      document.body.classList.remove("nav-open");
    });
  });
};

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;

    filterButtons.forEach((filterButton) => {
      filterButton.classList.toggle("is-active", filterButton === button);
    });

    applyProjectFilters();
  });
});

searchInput.addEventListener("input", applyProjectFilters);

navToggle.addEventListener("click", () => {
  const isOpen = navToggle.getAttribute("aria-expanded") === "true";
  navToggle.setAttribute("aria-expanded", String(!isOpen));
  navLinks.classList.toggle("is-open", !isOpen);
  document.body.classList.toggle("nav-open", !isOpen);
});

window.addEventListener("scroll", updateScrollProgress, { passive: true });
window.addEventListener("resize", updateScrollProgress);

wireProjectInteractions();
wireMusicVault();
wireTiltEffects();
wireRevealEffects();
wireNavState();
applyProjectFilters();
updateScrollProgress();
