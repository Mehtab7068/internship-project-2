(() => {
  "use strict";

  const projectImages = {
    interview: [
      { src: "assets/ai-interviewer-dashboard.png", alt: "Google AI Interview dashboard with interview setup and session history" }
    ],
    strategy: [
      { src: "assets/interviewai-strategy.png", alt: "InterviewAI strategy dashboard with personalized interview preparation" }
    ]
  };
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const menuButton = document.querySelector(".menu-toggle");
  const navigation = document.querySelector(".site-nav");
  const themeButtons = document.querySelectorAll(".theme-toggle");
  const lightbox = document.querySelector(".lightbox");
  const palette = document.querySelector(".command-palette");
  let galleryProject = "";
  let galleryIndex = 0;
  let paletteSelection = 0;
  let helloSequence = "";
  let helloTimer = null;
  let toastTimer = null;

  function initializeIntro() {
    const intro = document.querySelector(".intro-screen");
    const finish = () => {
      if (!intro.isConnected) return;
      intro.remove();
      window.removeEventListener("keydown", finish);
      window.removeEventListener("pointerdown", finish);
    };
    window.addEventListener("keydown", finish, { once: true });
    window.addEventListener("pointerdown", finish, { once: true });
    window.setTimeout(finish, reducedMotion.matches ? 0 : 1050);
  }

  function initializeTheme() {
    let preference = null;
    try {
      preference = localStorage.getItem("mehtab-portfolio-theme");
    } catch (error) {
      console.warn("Theme preference is unavailable.", error);
    }

    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const darkMode = preference === "dark" || (preference === null && systemPrefersDark);
    document.body.classList.toggle("dark-theme", darkMode);
    updateThemeLabels(darkMode);

    themeButtons.forEach((button) => button.addEventListener("click", () => {
      const nextIsDark = !document.body.classList.contains("dark-theme");
      document.body.classList.toggle("dark-theme", nextIsDark);
      updateThemeLabels(nextIsDark);
      try {
        localStorage.setItem("mehtab-portfolio-theme", nextIsDark ? "dark" : "light");
      } catch (error) {
        console.warn("Theme preference could not be saved.", error);
      }
    }));
  }

  function updateThemeLabels(isDark) {
    themeButtons.forEach((button) => {
      button.setAttribute("aria-label", isDark ? "Switch to light theme" : "Switch to dark theme");
      button.title = isDark ? "Switch to light theme" : "Switch to dark theme";
    });
  }

  function initializeNavigation() {
    menuButton.addEventListener("click", () => {
      const open = menuButton.getAttribute("aria-expanded") !== "true";
      menuButton.setAttribute("aria-expanded", String(open));
      menuButton.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      navigation.classList.toggle("is-open", open);
      document.body.classList.toggle("menu-open", open);
    });

    navigation.querySelectorAll('a[href^="#"]').forEach((link) => link.addEventListener("click", closeNavigation));
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && navigation.classList.contains("is-open")) closeNavigation();
    });
    window.matchMedia("(min-width: 768px)").addEventListener("change", (event) => {
      if (event.matches) closeNavigation();
    });
  }

  function closeNavigation() {
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "Open menu");
    navigation.classList.remove("is-open");
    document.body.classList.remove("menu-open");
  }

  function initializeProfilePhoto() {
    const frame = document.querySelector("[data-profile-frame]");
    const image = frame.querySelector("img");
    image.addEventListener("load", () => frame.classList.add("has-image"), { once: true });
    image.addEventListener("error", () => frame.remove(), { once: true });
    if (image.complete && image.naturalWidth > 0) frame.classList.add("has-image");
  }

  function initializeClock() {
    const clock = document.querySelector("#local-clock");
    const formatter = new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    });
    const update = () => {
      clock.textContent = `IST ${formatter.format(new Date())}`;
      clock.dateTime = new Date().toISOString();
    };
    update();
    window.setInterval(update, 1000);
  }

  function initializeReadingProgress() {
    const progress = document.querySelector(".reading-progress span");
    let scheduled = false;
    const update = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const percentage = scrollable > 0 ? Math.min(window.scrollY / scrollable, 1) * 100 : 0;
      progress.style.width = `${percentage}%`;
      scheduled = false;
    };
    window.addEventListener("scroll", () => {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(update);
    }, { passive: true });
    update();
  }

  function initializeReveals() {
    const elements = document.querySelectorAll(".reveal");
    if (reducedMotion.matches || !("IntersectionObserver" in window)) {
      elements.forEach((element) => element.classList.add("is-visible"));
      return;
    }
    const observer = new IntersectionObserver((entries, currentObserver) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        currentObserver.unobserve(entry.target);
      });
    }, { threshold: 0.08 });
    elements.forEach((element) => observer.observe(element));
  }

  function initializeProjectFilters() {
    const filters = document.querySelectorAll(".project-filters button");
    const projects = document.querySelectorAll(".case-study");
    filters.forEach((button) => button.addEventListener("click", () => {
      const filter = button.dataset.filter;
      filters.forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
      projects.forEach((project) => {
        project.hidden = filter !== "all" && !project.dataset.category.split(" ").includes(filter);
      });
    }));
  }

  function initializeCaseGalleries() {
    document.querySelectorAll(".case-study").forEach((project) => {
      const key = project.dataset.project;
      const images = projectImages[key];
      let currentIndex = 0;
      const image = project.querySelector(".case-image");
      const count = project.querySelector(".case-count");
      const controls = project.querySelectorAll("[data-case-step]");

      function showImage(index) {
        currentIndex = (index + images.length) % images.length;
        image.classList.remove("image-failed");
        image.src = images[currentIndex].src;
        image.alt = images[currentIndex].alt;
        count.textContent = `${String(currentIndex + 1).padStart(2, "0")} / ${String(images.length).padStart(2, "0")}`;
      }

      image.addEventListener("load", () => project.querySelector(".case-gallery").classList.add("image-loaded"));
      image.addEventListener("error", () => {
        image.classList.add("image-failed");
        project.querySelector(".case-gallery").classList.remove("image-loaded");
      });
      if (image.complete && image.naturalWidth > 0) project.querySelector(".case-gallery").classList.add("image-loaded");
      controls.forEach((button) => {
        button.hidden = images.length < 2;
        button.addEventListener("click", () => showImage(currentIndex + Number(button.dataset.caseStep)));
      });
      project.querySelector(".case-gallery").addEventListener("click", () => openLightbox(key, currentIndex));
    });
  }

  function renderLightbox() {
    const image = lightbox.querySelector("figure img");
    const caption = lightbox.querySelector("figcaption");
    const count = lightbox.querySelector(".lightbox-count");
    const items = projectImages[galleryProject];
    image.src = items[galleryIndex].src;
    image.alt = items[galleryIndex].alt;
    caption.textContent = items[galleryIndex].alt;
    count.textContent = `${String(galleryIndex + 1).padStart(2, "0")} / ${String(items.length).padStart(2, "0")}`;
    lightbox.querySelector(".lightbox-previous").hidden = items.length < 2;
    lightbox.querySelector(".lightbox-next").hidden = items.length < 2;
  }

  function openLightbox(key, index = 0) {
    galleryProject = key;
    galleryIndex = index;
    renderLightbox();
    lightbox.showModal();
  }

  function stepLightbox(step) {
    const length = projectImages[galleryProject].length;
    galleryIndex = (galleryIndex + step + length) % length;
    renderLightbox();
  }

  function initializeLightbox() {
    lightbox.querySelector(".lightbox-close").addEventListener("click", () => lightbox.close());
    lightbox.querySelector(".lightbox-previous").addEventListener("click", () => stepLightbox(-1));
    lightbox.querySelector(".lightbox-next").addEventListener("click", () => stepLightbox(1));
    lightbox.addEventListener("click", (event) => {
      if (event.target === lightbox) lightbox.close();
    });
    lightbox.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") stepLightbox(-1);
      if (event.key === "ArrowRight") stepLightbox(1);
    });
    lightbox.querySelector("figure img").addEventListener("error", (event) => {
      event.currentTarget.alt = `${projectImages[galleryProject][galleryIndex].alt}. Image file not found.`;
    });
  }

  function showToast(message) {
    const toast = document.querySelector(".toast");
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2200);
  }

  async function copyEmail() {
    const email = "Mehtabaliali255@gmail.com";
    try {
      if (!navigator.clipboard || !window.isSecureContext) throw new Error("Clipboard API unavailable");
      await navigator.clipboard.writeText(email);
      showToast("Copied");
    } catch {
      const temporaryInput = document.createElement("textarea");
      temporaryInput.value = email;
      temporaryInput.setAttribute("readonly", "");
      temporaryInput.style.position = "fixed";
      temporaryInput.style.opacity = "0";
      document.body.append(temporaryInput);
      temporaryInput.select();
      const copied = document.execCommand("copy");
      temporaryInput.remove();
      showToast(copied ? "Copied" : "Copy this address: Mehtabaliali255@gmail.com");
    }
  }

  function initializeContactForm() {
    const form = document.querySelector("#contact-form");
    const message = form.elements.message;
    const count = document.querySelector("#message-count");
    const fields = [
      { input: form.elements.name, error: document.querySelector("#name-error"), validate: (value) => value.trim() ? "" : "Please enter your name." },
      { input: form.elements.email, error: document.querySelector("#email-error"), validate: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ? "" : "Please enter a valid email address." },
      { input: form.elements.subject, error: document.querySelector("#subject-error"), validate: (value) => value.trim() ? "" : "Please enter a subject." },
      { input: message, error: document.querySelector("#message-error"), validate: (value) => value.trim().length >= 20 ? "" : "Please write at least 20 characters." }
    ];

    message.addEventListener("input", () => { count.textContent = String(message.value.length); });
    fields.forEach(({ input, error, validate }) => {
      input.addEventListener("input", () => {
        if (!input.hasAttribute("aria-invalid")) return;
        const text = validate(input.value);
        input.setAttribute("aria-invalid", String(Boolean(text)));
        error.textContent = text;
      });
    });
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      let valid = true;
      fields.forEach(({ input, error, validate }) => {
        const text = validate(input.value);
        error.textContent = text;
        input.setAttribute("aria-invalid", String(Boolean(text)));
        if (text) valid = false;
      });
      const status = document.querySelector("#form-status");
      status.textContent = "";
      if (!valid) {
        form.querySelector('[aria-invalid="true"]').focus();
        return;
      }

      const values = new FormData(form);
      const subject = encodeURIComponent(values.get("subject").trim());
      const body = encodeURIComponent(`Name: ${values.get("name").trim()}\nEmail: ${values.get("email").trim()}\n\n${values.get("message").trim()}`);
      status.textContent = "Your email draft is ready to open.";
      window.location.href = `mailto:Mehtabaliali255@gmail.com?subject=${subject}&body=${body}`;
    });

    document.querySelector(".copy-email").addEventListener("click", copyEmail);
  }

  function visiblePaletteOptions() {
    return [...palette.querySelectorAll('[role="option"]:not([hidden])')];
  }

  function filterPalette() {
    const query = document.querySelector("#palette-input").value.trim().toLowerCase();
    const options = palette.querySelectorAll('[role="option"]');
    options.forEach((option) => {
      option.hidden = !option.textContent.toLowerCase().includes(query);
      option.setAttribute("aria-selected", "false");
    });
    const visible = visiblePaletteOptions();
    paletteSelection = 0;
    if (visible[0]) visible[0].setAttribute("aria-selected", "true");
  }

  function movePaletteSelection(direction) {
    const options = visiblePaletteOptions();
    if (!options.length) return;
    paletteSelection = (paletteSelection + direction + options.length) % options.length;
    options.forEach((option, index) => option.setAttribute("aria-selected", String(index === paletteSelection)));
    options[paletteSelection].scrollIntoView({ block: "nearest" });
  }

  function executePaletteCommand(option) {
    const { command, target } = option.dataset;
    palette.close();
    if (command === "section") document.querySelector(target).scrollIntoView({ behavior: reducedMotion.matches ? "auto" : "smooth" });
    if (command === "project") openLightbox(target);
    if (command === "theme") themeButtons[0].click();
    if (command === "copy") copyEmail();
  }

  function openPalette() {
    closeNavigation();
    palette.showModal();
    const input = document.querySelector("#palette-input");
    input.value = "";
    filterPalette();
    input.focus();
  }

  function initializePalette() {
    document.querySelectorAll("[data-open-palette]").forEach((button) => button.addEventListener("click", openPalette));
    document.querySelector("#palette-input").addEventListener("input", filterPalette);
    palette.querySelectorAll('[role="option"]').forEach((option) => option.addEventListener("click", () => executePaletteCommand(option)));
    palette.addEventListener("keydown", (event) => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        movePaletteSelection(1);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        movePaletteSelection(-1);
      } else if (event.key === "Enter") {
        event.preventDefault();
        const selected = visiblePaletteOptions()[paletteSelection];
        if (selected) executePaletteCommand(selected);
      }
    });
    document.addEventListener("keydown", (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (palette.open) palette.close();
        else openPalette();
      }
    });
  }

  function initializeHelloEasterEgg() {
    const message = document.querySelector(".easter-egg");
    document.addEventListener("keydown", (event) => {
      if (event.ctrlKey || event.metaKey || event.altKey || event.key.length !== 1) return;
      const target = event.target;
      if (target instanceof HTMLElement && (target.isContentEditable || /INPUT|TEXTAREA|SELECT/.test(target.tagName))) return;
      helloSequence = `${helloSequence}${event.key.toLowerCase()}`.slice(-5);
      if (helloSequence === "hello") {
        message.classList.add("is-visible");
        window.setTimeout(() => message.classList.remove("is-visible"), 2400);
        helloSequence = "";
      }
      window.clearTimeout(helloTimer);
      helloTimer = window.setTimeout(() => { helloSequence = ""; }, 1500);
    });
  }

  function initializeGithubRepos() {
    const section = document.querySelector("#github-work");
    const list = document.querySelector("#repo-list");
    fetch("https://api.github.com/users/Mehtab7068/repos?sort=updated&per_page=30")
      .then((response) => {
        if (!response.ok) throw new Error(`GitHub returned ${response.status}`);
        return response.json();
      })
      .then((repositories) => {
        const recent = repositories
          .filter((repository) => !repository.fork)
          .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
          .slice(0, 6);
        if (!recent.length) return;
        list.replaceChildren(...recent.map((repository) => {
          const card = document.createElement("a");
          card.className = "repo-card";
          card.href = repository.html_url;
          card.target = "_blank";
          card.rel = "noopener noreferrer";
          const title = document.createElement("h4");
          title.textContent = repository.name;
          const description = document.createElement("p");
          description.textContent = repository.description || "No description provided.";
          const meta = document.createElement("span");
          meta.className = "mono";
          const language = document.createElement("span");
          language.textContent = repository.language || "Repository";
          const updated = document.createElement("time");
          updated.dateTime = repository.updated_at;
          updated.textContent = new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(repository.updated_at));
          meta.append(language, updated);
          card.append(title, description, meta);
          return card;
        }));
        section.hidden = false;
        section.classList.add("reveal");
        initializeReveals();
      })
      .catch(() => {
        section.hidden = true;
      });
  }

  initializeIntro();
  initializeTheme();
  initializeNavigation();
  initializeProfilePhoto();
  initializeClock();
  initializeReadingProgress();
  initializeReveals();
  initializeProjectFilters();
  initializeCaseGalleries();
  initializeLightbox();
  initializeContactForm();
  initializePalette();
  initializeHelloEasterEgg();
  initializeGithubRepos();
})();
