const projectCards = [...document.querySelectorAll(".project-card")];
const filterButtons = [...document.querySelectorAll(".filter-button")];
const searchInput = document.querySelector("#project-search");
const visibleCount = document.querySelector("#visible-count");
const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector(".nav-links");
const musicDialog = document.querySelector("#music-dialog");
const musicTrigger = document.querySelector("#music-trigger");
const musicAudio = document.querySelector("#music-audio");
const musicPlay = document.querySelector("#music-play");
const musicNext = document.querySelector("#music-next");
const musicStatus = document.querySelector("#music-status");
let musicPlaylist = [{ title: "B@BY", src: "assets/music/BABY.mp3" }];
let musicIndex = 0;
let musicRequest = 0;

const updateMusicTrack = () => {
  document.querySelector("#music-title").textContent = musicPlaylist[musicIndex].title;
  document.querySelector("#music-position").textContent =
    `TRACK ${String(musicIndex + 1).padStart(2, "0")} / ${String(musicPlaylist.length).padStart(2, "0")}`;
};

// The deployment workflow rebuilds this playlist from assets/music.
fetch("assets/music/playlist.json")
  .then((response) => {
    if (!response.ok) throw new Error("Playlist unavailable");
    return response.json();
  })
  .then((tracks) => {
    if (!Array.isArray(tracks) || !tracks.length ||
        !tracks.every((track) => typeof track.title === "string" && typeof track.src === "string")) return;
    const currentSource = musicPlaylist[musicIndex].src;
    musicPlaylist = tracks;
    const currentIndex = tracks.findIndex((track) => track.src === currentSource);
    musicIndex = Math.max(0, currentIndex);
    if (currentIndex === -1) musicAudio.src = tracks[0].src;
    updateMusicTrack();
  })
  .catch(() => { /* Keep the bundled song available if the playlist cannot load. */ });

const playMusic = async () => {
  const request = ++musicRequest;
  musicStatus.textContent = "Loading…";
  try {
    await musicAudio.play();
  } catch (error) {
    if (request === musicRequest && error.name !== "AbortError") {
      musicStatus.textContent = "Unable to play. Try again or press Next.";
    }
  }
};

const nextMusic = () => {
  musicIndex = (musicIndex + 1) % musicPlaylist.length;
  musicAudio.src = musicPlaylist[musicIndex].src;
  updateMusicTrack();
  playMusic();
};
musicPlay.addEventListener("click", () => {
  if (musicAudio.paused) playMusic();
  else {
    musicRequest++;
    musicAudio.pause();
  }
});
musicNext.addEventListener("click", nextMusic);
musicAudio.addEventListener("ended", nextMusic);
musicAudio.addEventListener("play", () => {
  musicPlay.innerHTML = '<span aria-hidden="true">Ⅱ</span> Pause';
  musicPlay.setAttribute("aria-label", "Pause");
  musicDialog.classList.add("is-playing");
});
musicAudio.addEventListener("playing", () => { musicStatus.textContent = "Now playing"; });
musicAudio.addEventListener("pause", () => {
  musicPlay.innerHTML = '<span aria-hidden="true">▶</span> Play';
  musicPlay.setAttribute("aria-label", "Play");
  musicStatus.textContent = "Paused";
  musicDialog.classList.remove("is-playing");
});
musicAudio.addEventListener("error", () => {
  musicStatus.textContent = "Unable to play. Try again or press Next.";
  musicDialog.classList.remove("is-playing");
});
musicTrigger.addEventListener("click", () => {
  if (musicDialog.open) musicDialog.close();
  else musicDialog.show();
});
musicDialog.querySelector(".music-dialog-close").addEventListener("click", () => musicDialog.close());
musicDialog.addEventListener("keydown", (event) => {
  if (event.key === "Escape") musicDialog.close();
});
musicDialog.addEventListener("close", () => {
  musicRequest++;
  musicAudio.pause();
  musicTrigger.focus({ preventScroll: true });
});
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

  if (preview) {
    preview.replaceChildren();
  }

  card.classList.remove("has-preview");

  if (button) {
    button.dataset.open = "false";
    button.setAttribute("aria-expanded", "false");
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
        previewButton.setAttribute("aria-expanded", "true");
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
wireTiltEffects();
wireRevealEffects();
wireNavState();
applyProjectFilters();
updateScrollProgress();
