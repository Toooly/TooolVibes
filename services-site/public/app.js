(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const body = document.body;
  const header = document.querySelector("[data-header]");
  const menuToggle = document.querySelector("[data-menu-toggle]");
  const mobileNav = document.querySelector("[data-mobile-nav]");
  const contactForm = document.querySelector("[data-contact-form]");
  const formStatus = document.querySelector("[data-form-status]");
  const trackedSections = new Set();

  function track(eventName) {
    const allowed = new Set([
      "cta_header",
      "cta_hero",
      "cta_mobile_menu",
      "service_ai_view",
      "service_social_view",
      "service_web_view",
      "contact_submit",
      "contact_success",
      "contact_error",
    ]);

    if (!allowed.has(eventName)) return;
    const body = JSON.stringify({ event: eventName, path: window.location.pathname });
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/event", new Blob([body], { type: "application/json" }));
      return;
    }
    void fetch("/api/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => undefined);
  }

  document.querySelectorAll("[data-track]").forEach((element) => {
    element.addEventListener("click", () => track(element.dataset.track), { passive: true });
  });

  function setMenu(open) {
    if (!menuToggle || !mobileNav) return;
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? "Chiudi il menu" : "Apri il menu");
    mobileNav.hidden = !open;
  }

  menuToggle?.addEventListener("click", () => {
    setMenu(menuToggle.getAttribute("aria-expanded") !== "true");
  });
  mobileNav?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setMenu(false));
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setMenu(false);
  });

  let headerScrolled = null;
  const syncHeader = () => {
    const scrolled = window.scrollY > 18;
    if (scrolled === headerScrolled) return;
    headerScrolled = scrolled;
    header?.classList.toggle("is-scrolled", scrolled);
  };
  syncHeader();
  window.addEventListener("scroll", syncHeader, { passive: true });

  const serviceScreens = {
    web: `<svg class="service-screen" viewBox="0 0 1280 721" aria-hidden="true"><path fill="#0c1434" d="m391 319 122 15-18 95-121-15Z"/><g class="screen-bars" fill="#45d8f0"><path d="m394 386 10 1-5 23-10-1Z"/><path d="m414 375 10 1-7 26-10-1Z"/><path d="m436 363 10 1-8 41-10-1Z"/><path d="m458 350 10 1-10 53-10-1Z"/><path d="m479 341 10 1-12 67-10-1Z"/></g><path class="screen-action" fill="#82f2cf" d="m893 484 133 17-2 13-134-18Z"/><path class="screen-cursor" fill="#f4f0e8" stroke="#071020" stroke-width="3" d="m995 496 5 29 7-9 13-2Z"/><path class="screen-confirm" d="m957 495 7 8 14-12"/></svg>`,
    social: `<svg class="service-screen" viewBox="0 0 1280 640" aria-hidden="true"><path class="screen-transfer" pathLength="100" d="M477 271C513 221 544 208 562 211M666 213C714 211 748 244 777 286"/><g class="screen-publish" fill="#c195ff"><path d="m898 311 62 1v7l-62-1Z"/><path d="m892 379 65 2v7l-65-2Z"/><path d="m884 447 66 2v7l-66-2Z"/></g><g class="screen-checks"><path d="m998 326 5 5 9-10"/><path d="m998 397 5 5 9-10"/><path d="m991 465 5 5 9-10"/></g></svg>`,
    ai: `<svg class="service-screen" viewBox="0 0 1280 854" aria-hidden="true"><path fill="#09122d" d="m591 210 260 23v91l-260-23Zm-31 100 291 26v78l-291-26Z"/><g class="screen-request"><path fill="#263752" d="m610 225 214 19q18 2 18 18v35q0 17-18 15l-214-19q-15-1-15-17v-36q0-16 15-15Z"/><path class="screen-copy" d="m621 249 175 16m-175 5 104 9"/></g><g class="screen-reply"><path fill="#5340d9" d="m585 318 236 21q20 2 20 19v31q0 18-20 16l-236-21q-20-2-20-19v-31q0-18 20-16Z"/><path class="screen-copy" d="m587 343 182 16m-182 4 117 11"/></g><path class="screen-transfer" pathLength="100" d="M311 337h20q21 0 21 21v112q0 22 22 22h65"/><path class="screen-confirm" d="m766 458 8 9 17-17"/></svg>`,
  };
  const sceneLayers = {
    web: "M938 246C913 246 896 261 891 286L825 612Q817 651 848 660L1000 682Q1033 687 1043 651L1101 289Q1105 259 1074 253Z",
    social: "M550 313L689 329Q704 331 701 346L676 514Q674 529 659 526L520 507Q504 505 507 490L534 328Q536 310 550 313Z",
    ai: "M937 295Q905 290 896 325L808 682Q799 715 831 725L982 751Q1015 756 1024 721L1092 344Q1097 313 1068 308Z",
  };
  document.querySelectorAll("[data-service] .service-visual").forEach((figure) => {
    const service = figure.closest("[data-service]").dataset.service;
    const screen = serviceScreens[service];
    if (!screen) return;
    figure.insertAdjacentHTML("beforeend", screen);
    const svg = figure.querySelector(".service-screen");
    const image = figure.querySelector("img");
    const outline = sceneLayers[service];
    const id = `scene-${service}`;
    const height = image.getAttribute("height");
    // Reuse the already selected responsive artwork: no second asset or mobile illustration.
    svg.insertAdjacentHTML("afterbegin", `<defs><clipPath id="${id}-clip"><path d="${outline}"/></clipPath><mask id="${id}-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="1280" height="${height}"><rect width="1280" height="${height}" fill="white"/><path d="${outline}" fill="black"/></mask></defs><g class="scene-art"><image width="1280" height="${height}" mask="url(#${id}-mask)"/><g class="scene-layer"><image width="1280" height="${height}" clip-path="url(#${id}-clip)"/></g></g>`);
    const sources = [...svg.querySelectorAll("image")];
    const loaded = new Set();
    sources.forEach((source) => {
      source.addEventListener("load", () => {
        loaded.add(source);
        if (loaded.size === sources.length) figure.classList.add("has-layered-scene");
      });
      source.addEventListener("error", () => {
        loaded.delete(source);
        figure.classList.remove("has-layered-scene");
      });
    });
    const syncSource = () => {
      loaded.clear();
      figure.classList.remove("has-layered-scene");
      sources.forEach((source) => source.setAttribute("href", image.currentSrc || image.src));
    };
    image.addEventListener("load", syncSource);
    if (image.complete && image.naturalWidth) syncSource();
    if (service === "web") {
      svg.querySelectorAll(".screen-action,.screen-cursor,.screen-confirm").forEach((element) => svg.querySelector(".scene-layer").append(element));
      svg.insertAdjacentHTML("beforeend", '<path class="screen-trend" pathLength="100" d="M531 422C550 424 557 394 576 403S602 395 624 378"/>');
    }
    const route = svg.querySelector(".screen-transfer");
    if (route) {
      const signal = route.cloneNode();
      signal.setAttribute("class", "screen-signal");
      route.after(signal);
    }
  });

  if (!reduceMotion && "IntersectionObserver" in window) {
    body.classList.add("motion-ready");
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-revealed");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -10%", threshold: 0.08 },
    );
    document.querySelectorAll("[data-reveal]").forEach((element) => revealObserver.observe(element));

    const sceneObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          entry.target.classList.toggle("is-in-view", entry.isIntersecting);
          if (!entry.isIntersecting) return;
          if (entry.target.matches(".service-capacity")) entry.target.classList.add("has-counted");
          const service = entry.target.dataset.service;
          if (service && !trackedSections.has(service)) {
            trackedSections.add(service);
            track(`service_${service}_view`);
          }
        });
      },
      { threshold: 0.28 },
    );
    document.querySelectorAll(".service[data-service], .service-visual").forEach((element) => sceneObserver.observe(element));
    document.querySelectorAll(".service-offer").forEach((element) => sceneObserver.observe(element));
    document.querySelectorAll(".service-capacity").forEach((element) => sceneObserver.observe(element));
  } else {
    document.querySelectorAll("[data-reveal]").forEach((element) => element.classList.add("is-revealed"));
  }

  const journey = document.querySelector("[data-journey]");
  if (journey) {
    const choices = journey.querySelectorAll("[data-journey-select]");
    const scenes = journey.querySelectorAll("[data-journey-scene]");
    const description = journey.querySelector("[data-journey-description]");
    const link = journey.querySelector("[data-journey-link]");
    const previewLink = journey.querySelector("[data-journey-preview-link]");
    const frame = journey.querySelector(".journey__frame");
    const track = journey.querySelector(".journey__track");
    const controls = journey.querySelector(".journey__controls");
    const title = journey.querySelector("h2");
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const order = ["web", "social", "ai"];
    let guided = false;
    let visible = false;
    let scheduled = false;
    let stickyTop = 0;
    let start = 0;
    let distance = 1;
    let activePhase = -1;
    let viewportWidth = 0;
    let availableHeight = 0;
    const services = {
      web: { description: "Siti chiari, pensati per farti scegliere.", target: "#servizi", label: "Scopri come possiamo aiutarti con il tuo sito" },
      social: { description: "Contenuti coerenti, senza rincorrere il calendario.", target: "#contenuti", label: "Scopri come possiamo aiutarti con i tuoi contenuti" },
      ai: { description: "Risposte utili. Più tempo per i tuoi clienti.", target: "#chatbot", label: "Scopri come possiamo aiutarti con un chatbot AI" },
    };
    function selectJourney(service) {
      const selected = services[service];
      if (!selected || journey.dataset.active === service) return;
      journey.dataset.active = service;
      choices.forEach((choice) => choice.setAttribute("aria-pressed", String(choice.dataset.journeySelect === service)));
      scenes.forEach((scene) => { scene.hidden = scene.dataset.journeyScene !== service; });
      description.textContent = selected.description;
      link.setAttribute("href", selected.target);
      link.setAttribute("aria-label", selected.label);
      previewLink.setAttribute("href", selected.target);
      previewLink.setAttribute("aria-label", selected.label);
      journey.dispatchEvent(new CustomEvent("servicechange"));
    }
    choices.forEach((choice) => choice.addEventListener("click", () => {
      const service = choice.dataset.journeySelect;
      if (!guided) { selectJourney(service); return; }
      const top = start + distance * (order.indexOf(service) + .12) / order.length;
      window.scrollTo({ top, behavior: "smooth" });
    }));
    journey.querySelector("[data-journey-controls]").hidden = false;
    link.setAttribute("aria-label", services.web.label);
    function updateJourneyMotion() {
      scheduled = false;
      if (!guided || !visible) return;
      const progress = Math.max(0, Math.min(1, (window.scrollY - start) / distance));
      const phase = Math.min(order.length - 1, Math.floor(progress * order.length));
      if (phase === activePhase) return;
      activePhase = phase;
      selectJourney(order[phase]);
      choices.forEach((choice, index) => choice.style.setProperty("--choice-progress", index <= phase ? "1" : "0"));
    }
    function scheduleJourneyMotion() {
      if (guided && visible && !scheduled) {
        scheduled = true;
        requestAnimationFrame(updateJourneyMotion);
      }
    }
    function measureJourney() {
      start = window.scrollY + track.getBoundingClientRect().top - stickyTop;
      distance = Math.max(1, track.offsetHeight - frame.offsetHeight);
    }
    function syncJourneyMotion() {
      // Desktop window height is user-controlled; mobile chrome must not restart a sticky story.
      if (window.innerWidth !== viewportWidth || window.innerWidth > 1024) availableHeight = window.innerHeight;
      if (window.innerWidth !== viewportWidth) {
        viewportWidth = window.innerWidth;
        if (viewportWidth > 1024) setMenu(false);
        // Keep the heading outside both guided stages; the tablet fallback retains its manual layout.
        if (viewportWidth <= 768 || viewportWidth > 1024) {
          track.before(title);
        } else {
          controls.prepend(title);
        }
      }
      const compact = viewportWidth <= 768 && availableHeight < 640;
      journey.classList.toggle("journey--compact", compact);
      stickyTop = (header?.querySelector(".site-header__inner")?.offsetHeight || 76) + 12;
      const cueSpace = compact ? 52 : 64;
      guided = !preference.matches && (viewportWidth <= 768 || viewportWidth > 1024) && frame.offsetHeight + stickyTop + cueSpace < availableHeight && "IntersectionObserver" in window;
      journey.style.setProperty("--journey-sticky-top", `${stickyTop}px`);
      track.style.setProperty("--journey-frame-height", `${frame.offsetHeight}px`);
      journey.classList.toggle("journey--guided", guided);
      journey.classList.toggle("is-in-view", visible && !preference.matches);
      description.setAttribute("aria-live", guided ? "off" : "polite");
      activePhase = -1;
      measureJourney();
      scheduleJourneyMotion();
    }
    if ("IntersectionObserver" in window) {
      const journeyObserver = new IntersectionObserver((entries) => {
        visible = entries.some((entry) => entry.isIntersecting);
        journey.classList.toggle("is-in-view", visible && !preference.matches);
        if (visible && guided) measureJourney();
        scheduleJourneyMotion();
      }, { rootMargin: "100px" });
      journeyObserver.observe(track);
    }
    window.addEventListener("scroll", scheduleJourneyMotion, { passive: true });
    // Mobile browser chrome changes height while scrolling; it must not collapse or restart the sticky track.
    window.addEventListener("resize", () => {
      if (window.innerWidth !== viewportWidth || window.innerWidth > 1024) syncJourneyMotion();
    }, { passive: true });
    preference.addEventListener("change", syncJourneyMotion);
    if ("ResizeObserver" in window) new ResizeObserver(syncJourneyMotion).observe(frame);
    document.fonts?.ready.then(syncJourneyMotion);
    syncJourneyMotion();
  }

  const method = document.querySelector("[data-method-track]");
  if (method) {
    const section = method.closest(".process");
    const frame = method.querySelector(".method-frame");
    const steps = [...method.querySelectorAll(".process-step")];
    const markers = [...method.querySelectorAll(".method-rail span")];
    const rail = method.querySelector(".method-rail");
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false;
    let scheduled = false;
    let activePhase = -1;
    let start = 0;
    let distance = 1;
    function measureMethod() {
      const stickyTop = parseFloat(getComputedStyle(frame).top) || 0;
      start = window.scrollY + method.getBoundingClientRect().top - stickyTop;
      distance = Math.max(1, method.offsetHeight - frame.offsetHeight);
    }
    function updateMethod() {
      scheduled = false;
      if (!visible || preference.matches) return;
      const progress = Math.max(0, Math.min(1, (window.scrollY - start) / distance));
      const phase = Math.min(3, Math.floor(progress * 4));
      rail.style.setProperty("--method-progress", progress.toFixed(3));
      if (phase !== activePhase) {
        activePhase = phase;
        section.dataset.phase = String(phase);
        steps.forEach((step, index) => step.classList.toggle("is-current", index === phase));
        markers.forEach((marker, index) => marker.classList.toggle("is-current", index === phase));
      }
    }
    function scheduleMethod() {
      if (visible && !scheduled && !preference.matches) {
        scheduled = true;
        requestAnimationFrame(updateMethod);
      }
    }
    function syncMethodMotion() {
      const enabled = !preference.matches && "IntersectionObserver" in window;
      section.classList.toggle("method-ready", enabled);
      method.querySelector(".method-art").hidden = !enabled;
      method.querySelector(".method-rail").hidden = !enabled;
      if (enabled) { measureMethod(); visible = true; scheduleMethod(); }
    }
    if ("IntersectionObserver" in window) {
      new IntersectionObserver((entries) => {
        visible = entries.some((entry) => entry.isIntersecting);
        if (visible) measureMethod();
        scheduleMethod();
      }, { rootMargin: "100px" }).observe(method);
    }
    window.addEventListener("scroll", scheduleMethod, { passive: true });
    const resizeMethod = () => { measureMethod(); scheduleMethod(); };
    window.addEventListener("resize", resizeMethod, { passive: true });
    if ("ResizeObserver" in window) {
      const observer = new ResizeObserver(resizeMethod);
      observer.observe(method);
      observer.observe(frame);
    }
    preference.addEventListener("change", syncMethodMotion);
    syncMethodMotion();
  }
  function initAvailabilityNotice() {
    const notice = document.querySelector("[data-availability-notice]");
    const launcher = document.querySelector("[data-notice-launcher]");
    if (!notice || !launcher) return;
    const storageKey = "services-availability-dismissed-until";
    const cta = notice.querySelector("[data-notice-cta]");
    const panel = document.querySelector("[data-contact-panel]");
    const services = [...document.querySelectorAll(".service[data-service]")];
    const contexts = new Set();
    const blockers = new Set();
    const shownServices = new Set();
    const enteredAt = performance.now();
    let candidate = services[0];
    let ready = false;
    let lastShownAt = -Infinity;
    let dismissedUntil = 0;
    let pending = 0;
    let expiry = 0;
    try { dismissedUntil = Number(sessionStorage.getItem(storageKey)) || 0; } catch { /* Manual access also works when browser storage is blocked. */ }

    const clearPending = () => { window.clearTimeout(pending); pending = 0; };
    const blocked = () => document.hidden || blockers.size > 0 || menuToggle?.getAttribute("aria-expanded") === "true" || document.activeElement?.matches("input,textarea,select,[contenteditable=true]");
    const currentService = () => {
      // At a section boundary, prefer the next visible service even after a resize re-enters the previous one.
      const visibleService = services.findLast((service) => contexts.has(service));
      if (visibleService) return visibleService;
      if (contexts.has(journey)) return services.find((service) => service.dataset.service === journey.dataset.active) || candidate;
      return candidate;
    };
    const syncLauncher = () => {
      const service = currentService();
      if (service && launcher.dataset.service !== service.dataset.service) {
        launcher.dataset.service = service.dataset.service;
        launcher.querySelector("[data-launcher-service]").textContent = service.querySelector(".service-offer__label").textContent;
      }
      launcher.hidden = !ready || blocked() || !notice.hidden;
    };
    const rememberDismissal = () => {
      dismissedUntil = Date.now() + 15 * 60_000;
      try { sessionStorage.setItem(storageKey, String(dismissedUntil)); } catch { /* Keep the temporary preference in memory. */ }
    };
    const dismiss = (manual = false) => {
      clearPending();
      window.clearTimeout(expiry);
      const hadFocus = notice.contains(document.activeElement);
      notice.hidden = true;
      launcher.setAttribute("aria-expanded", "false");
      if (manual) rememberDismissal();
      syncLauncher();
      if (hadFocus && !launcher.hidden) launcher.focus({ preventScroll: true });
    };
    const resumeExpiry = () => {
      window.clearTimeout(expiry);
      if (!notice.hidden && !notice.matches(":hover,:focus-within")) expiry = window.setTimeout(() => dismiss(), 16_000);
    };
    const show = (manual = false) => {
      clearPending();
      const service = currentService();
      if (blocked() || !service || (!manual && (shownServices.has(service.dataset.service) || shownServices.size >= 2 || Date.now() < dismissedUntil))) return;
      // The pricing block owns the numbers and copy, including the non-numeric chatbot availability.
      const capacity = service.querySelector(".service-capacity");
      const title = capacity?.querySelector("small b")?.textContent.trim();
      const detail = capacity?.querySelector(".service-capacity__limit")?.textContent.trim();
      if (!title || !detail) return;
      notice.dataset.service = service.dataset.service;
      cta.dataset.contactService = service.dataset.service;
      notice.querySelector("[data-notice-service]").textContent = service.querySelector(".service-offer__label").textContent;
      notice.querySelector("[data-notice-title]").textContent = title;
      notice.querySelector("[data-notice-detail]").textContent = detail;
      const slots = notice.querySelector("[data-notice-slots]");
      slots.replaceChildren(...[...capacity.querySelectorAll(".service-capacity__slots i")].map((slot) => slot.cloneNode()));
      slots.hidden = !slots.childElementCount;
      notice.hidden = false;
      launcher.setAttribute("aria-expanded", "true");
      shownServices.add(service.dataset.service);
      lastShownAt = performance.now();
      syncLauncher();
      resumeExpiry();
      if (manual) notice.querySelector("[data-notice-close]").focus({ preventScroll: true });
    };
    const schedule = () => {
      clearPending();
      if (blocked()) { dismiss(); return; }
      syncLauncher();
      const service = currentService();
      if (!ready || !contexts.size || !notice.hidden || !service || shownServices.has(service.dataset.service) || shownServices.size >= 2 || Date.now() < dismissedUntil) return;
      pending = window.setTimeout(() => show(), Math.max(1_500, 8_000 - (performance.now() - enteredAt), 45_000 - (performance.now() - lastShownAt)));
    };

    if ("IntersectionObserver" in window) {
      const serviceObserver = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            contexts.add(entry.target);
            if (entry.target !== journey) candidate = entry.target;
          } else contexts.delete(entry.target);
        }
        schedule();
      }, { rootMargin: "-15% 0px -15% 0px" });
      [...services, journey].filter(Boolean).forEach((service) => serviceObserver.observe(service));
      const blockerObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => entry.isIntersecting ? blockers.add(entry.target) : blockers.delete(entry.target));
        schedule();
      });
      document.querySelectorAll(".contact,.method-frame,.site-footer").forEach((element) => blockerObserver.observe(element));
    }
    window.setTimeout(() => { ready = true; schedule(); }, 4_000);
    launcher.addEventListener("click", () => show(true));
    notice.querySelector("[data-notice-close]").addEventListener("click", () => dismiss(true));
    notice.addEventListener("pointerenter", () => window.clearTimeout(expiry));
    notice.addEventListener("focusin", () => window.clearTimeout(expiry));
    notice.addEventListener("pointerleave", resumeExpiry);
    notice.addEventListener("focusout", () => queueMicrotask(resumeExpiry));
    document.addEventListener("visibilitychange", schedule);
    document.addEventListener("focusin", schedule);
    document.addEventListener("focusout", () => queueMicrotask(schedule));
    menuToggle?.addEventListener("click", schedule);
    journey?.addEventListener("servicechange", schedule);
    panel?.addEventListener("toggle", schedule);
    document.addEventListener("keydown", (event) => { if (event.key === "Escape" && !notice.hidden) dismiss(true); });
    document.querySelectorAll('a[href="#contatti"]').forEach((link) => link.addEventListener("click", () => {
      rememberDismissal();
      dismiss();
    }));
  }
  initAvailabilityNotice();

  if (!contactForm || !formStatus) return;
  contactForm.querySelector('button[type="submit"]').disabled = false;

  const contactPanel = document.querySelector("[data-contact-panel]");
  const contactContext = document.querySelector("[data-contact-context]");
  const formSteps = [...contactForm.querySelectorAll("[data-form-step]")];
  const stepButtons = [...contactForm.querySelectorAll("[data-step-target]")];
  const nextStep = contactForm.querySelector("[data-step-next]");
  const previousStep = contactForm.querySelector("[data-step-back]");
  let currentStep = 0;
  let submitPending = false;
  let validationMessage = false;

  function clearValidationFeedback() {
    if (validationMessage && [...formSteps[currentStep].querySelectorAll("input,textarea")].every((field) => field.validity.valid)) setStatus("");
  }

  function showFieldError(field) {
    const error = document.getElementById(`${field.name}-error`);
    if (!error) return;
    const valid = field.validity.valid;
    error.hidden = valid;
    const fields = field.name === "need" ? contactForm.querySelectorAll('[name="need"]') : [field];
    fields.forEach((input) => {
      if (valid) input.removeAttribute("aria-invalid");
      else input.setAttribute("aria-invalid", "true");
    });
  }

  function invalidField(step) {
    const fields = [...step.querySelectorAll("input, textarea")];
    fields.forEach(showFieldError);
    return fields.find((field) => !field.validity.valid);
  }

  function updateMessageHint() {
    const length = contactForm.elements.namedItem("message").value.length;
    contactForm.querySelector("[data-message-count]").textContent = `${length} / 2000`;
    contactForm.querySelector("[data-message-help]").textContent = length >= 20 ? "Hai aggiunto tutto? Passiamo ai tuoi contatti." : "Una o due frasi bastano per iniziare (minimo 20 caratteri).";
  }

  function syncContactContext() {
    const selected = contactForm.querySelector('[name="need"]:checked');
    contactContext.textContent = selected ? selected.nextElementSibling.textContent : "Scegli il servizio. Al resto pensiamo insieme.";
    contactPanel.dataset.kind = selected?.value || "";
  }

  function showStep(index, focus = false) {
    currentStep = index;
    contactPanel.dataset.step = String(index);
    formSteps.forEach((step, i) => { step.hidden = i !== index; });
    stepButtons.forEach((button, i) => {
      if (i === index) button.setAttribute("aria-current", "step");
      else button.removeAttribute("aria-current");
      button.classList.toggle("is-complete", i < index);
    });
    previousStep.hidden = index === 0;
    nextStep.hidden = index === formSteps.length - 1;
    nextStep.querySelector("[data-next-label]").textContent = index === 0 ? "Raccontaci l’idea" : "Vai ai contatti";
    setStatus("");
    if (focus) formSteps[index].querySelector("input, textarea")?.focus({ preventScroll: true });
  }

  function goToStep(index) {
    for (let i = 0; i < index; i++) {
      const invalid = invalidField(formSteps[i]);
      if (invalid) {
        showStep(i);
        invalid.focus();
        setStatus("Manca solo qualche dettaglio: completa i campi indicati per continuare.", "error");
        validationMessage = true;
        return;
      }
    }
    showStep(index, true);
  }

  contactForm.querySelector("[data-contact-steps]").hidden = false;
  contactForm.querySelector("[data-contact-actions]").hidden = false;
  nextStep.addEventListener("click", () => goToStep(currentStep + 1));
  previousStep.addEventListener("click", () => showStep(currentStep - 1, true));
  stepButtons.forEach((button) => button.addEventListener("click", () => goToStep(Number(button.dataset.stepTarget))));
  contactPanel.addEventListener("toggle", () => {
    if (contactPanel.open && contactForm.classList.contains("is-success")) {
      contactForm.classList.remove("is-success");
      syncContactContext();
      setStatus("");
    }
  });
  contactForm.addEventListener("change", (event) => {
    if (event.target.name === "need") { syncContactContext(); showFieldError(event.target); }
    if (event.target.name === "privacyAccepted") showFieldError(event.target);
    clearValidationFeedback();
  });
  contactForm.addEventListener("input", (event) => {
    if (event.target.name === "message") updateMessageHint();
    if (event.target.getAttribute("aria-invalid") === "true") showFieldError(event.target);
    clearValidationFeedback();
  });
  contactForm.addEventListener("focusout", (event) => {
    if (event.target.matches('input:not([type="radio"]):not([type="checkbox"]),textarea') && event.target.value) showFieldError(event.target);
  });
  contactForm.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && event.target.matches("input") && currentStep < 2) {
      event.preventDefault();
      goToStep(currentStep + 1);
    }
  });

  function openContact(service) {
    contactPanel.open = true;
    contactForm.classList.remove("is-success");
    const need = { web: "web", social: "social", ai: "automation" }[service];
    if (need) {
      contactForm.querySelector(`[name="need"][value="${need}"]`).checked = true;
      showFieldError(contactForm.querySelector(`[name="need"][value="${need}"]`));
      showStep(1);
    }
    syncContactContext();
  }
  document.querySelectorAll('a[href="#contatti"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      openContact(link.dataset.contactService || link.closest("[data-service]")?.dataset.service);
      requestAnimationFrame(() => contactPanel.querySelector("summary").focus({ preventScroll: true }));
    });
  });
  window.addEventListener("hashchange", () => {
    if (window.location.hash === "#contatti") openContact();
  });
  showStep(0);
  if (window.location.hash === "#contatti") openContact();

  const startedAt = contactForm.elements.namedItem("startedAt");
  const turnstileShell = document.querySelector("[data-turnstile]");
  let turnstileWidgetId = null;
  let turnstileToken = "";
  let turnstilePromise = null;
  let tokenIssuedAt = 0;
  let verificationWaiter = null;

  function clearVerification() {
    turnstileToken = "";
    tokenIssuedAt = 0;
  }

  function finishVerification(error, token) {
    const waiter = verificationWaiter;
    if (!waiter) return;
    verificationWaiter = null;
    clearTimeout(waiter.timer);
    if (error) waiter.reject(error);
    else waiter.resolve(token);
  }

  if (startedAt) startedAt.value = String(Date.now());

  function setStatus(message, state = "") {
    validationMessage = false;
    formStatus.textContent = message;
    formStatus.className = `form-status${state ? ` is-${state}` : ""}`;
  }

  async function loadTurnstile() {
    if (turnstileWidgetId !== null || turnstilePromise) return turnstilePromise;
    turnstilePromise = (async () => {
      const configResponse = await fetch("/api/config", { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(8_000) });
      if (!configResponse.ok) throw new Error("config-unavailable");
      const config = await configResponse.json();
      const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
      const siteKey = isLocal ? "1x00000000000000000000AA" : config.siteKey;
      if (!isLocal && !config.formAvailable) throw new Error("form-unavailable");
      if (!siteKey) throw new Error("turnstile-unavailable");

      if (!window.turnstile) {
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
          script.async = true;
          script.defer = true;
          const timer = setTimeout(() => { script.remove(); reject(new Error("turnstile-load-timeout")); }, 15_000);
          script.onload = () => { clearTimeout(timer); resolve(); };
          script.onerror = () => { clearTimeout(timer); script.remove(); reject(new Error("turnstile-load-failed")); };
          document.head.append(script);
        });
      }

      if (!window.turnstile || !turnstileShell) throw new Error("turnstile-unavailable");
      turnstileWidgetId = window.turnstile.render(turnstileShell, {
        sitekey: siteKey,
        action: "services_contact",
        execution: "execute",
        appearance: "interaction-only",
        "refresh-expired": "manual",
        theme: "dark",
        size: "flexible",
        callback: (token) => {
          turnstileToken = token;
          tokenIssuedAt = Date.now();
          finishVerification(null, token);
        },
        "expired-callback": () => {
          clearVerification();
          finishVerification(new Error("verification-expired"));
        },
        "error-callback": () => {
          clearVerification();
          finishVerification(new Error("verification-unavailable"));
          return true;
        },
        "timeout-callback": () => finishVerification(new Error("verification-timeout")),
        "unsupported-callback": () => finishVerification(new Error("verification-unsupported")),
        "before-interactive-callback": () => {
          if (!verificationWaiter) return;
          clearTimeout(verificationWaiter.timer);
          verificationWaiter.timer = setTimeout(() => finishVerification(new Error("verification-timeout")), 120_000);
          setStatus("Completa il controllo qui sopra: subito dopo invieremo il tuo messaggio.");
          turnstileShell.scrollIntoView({ block: "center", behavior: reduceMotion ? "auto" : "smooth" });
        },
      });
    })();

    try {
      await turnstilePromise;
    } catch (error) {
      turnstilePromise = null;
      throw error;
    }
    return turnstilePromise;
  }

  async function acquireVerification(force = false) {
    await loadTurnstile();
    if (!force && turnstileToken && Date.now() - tokenIssuedAt < 240_000 && !window.turnstile.isExpired(turnstileWidgetId)) return turnstileToken;
    clearVerification();
    return new Promise((resolve, reject) => {
      verificationWaiter = { resolve, reject, timer: setTimeout(() => finishVerification(new Error("verification-timeout")), 30_000) };
      try {
        window.turnstile.reset(turnstileWidgetId);
        window.turnstile.execute(turnstileWidgetId);
      } catch {
        finishVerification(new Error("verification-unavailable"));
      }
    });
  }

  const formObserver = "IntersectionObserver" in window
    ? new IntersectionObserver((entries, observer) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        void loadTurnstile().catch(() => undefined);
        observer.disconnect();
      }, { rootMargin: "300px" })
    : null;
  formObserver?.observe(contactForm);
  contactForm.addEventListener("focusin", () => void loadTurnstile().catch(() => undefined), { once: true });

  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (submitPending) return;
    setStatus("");
    contactForm.classList.remove("is-success");

    if (!contactForm.checkValidity()) {
      const invalid = contactForm.querySelector("input:invalid,textarea:invalid");
      const step = invalid?.closest("[data-form-step]");
      if (step) { showStep(Number(step.dataset.formStep)); invalidField(step); }
      invalid?.focus({ preventScroll: true });
      setStatus("Controlla i campi indicati: poi puoi inviare il messaggio.", "error");
      validationMessage = true;
      return;
    }

    submitPending = true;
    contactForm.setAttribute("aria-busy", "true");
    contactPanel.dataset.state = "sending";
    contactContext.textContent = "Prepariamo il tuo messaggio…";

    const submitButton = contactForm.querySelector('button[type="submit"]');
    const submitLabel = submitButton.querySelector("span");
    const originalLabel = submitLabel.textContent;
    submitButton.disabled = true;
    submitLabel.textContent = "Verifica in corso…";
    setStatus("Il messaggio è pronto. Se compare un controllo di sicurezza, completalo qui sopra.");

    const data = new FormData(contactForm);
    const payload = {
      name: String(data.get("name") || ""),
      email: String(data.get("email") || ""),
      company: String(data.get("company") || ""),
      need: String(data.get("need") || ""),
      message: String(data.get("message") || ""),
      privacyAccepted: data.get("privacyAccepted") === "on",
      companyWebsite: String(data.get("companyWebsite") || ""),
      startedAt: Number(data.get("startedAt") || 0),
      turnstileToken: "",
    };
    const lockedFields = [...contactForm.querySelectorAll('input:not(:disabled),textarea:not(:disabled),button:not(:disabled)')];
    lockedFields.forEach((field) => { field.disabled = true; });

    let failureMessage = "Non siamo riusciti a inviare il messaggio. Quello che hai scritto è ancora qui: riprova tra poco.";
    try {
      failureMessage = "Il controllo di sicurezza non è disponibile in questo momento. Non hai perso nulla: riprova tra poco.";
      payload.turnstileToken = await acquireVerification();
      track("contact_submit");
      for (let attempt = 0; attempt < 2; attempt++) {
        submitLabel.textContent = "Invio in corso…";
        setStatus("Stiamo inviando la tua idea al nostro team.");
        failureMessage = "Non abbiamo ancora la conferma dell’invio. Quello che hai scritto resta qui: riprova tra poco.";
        const response = await fetch("/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(30_000),
        });
        const result = await response.json().catch(() => ({}));
        if (response.ok) break;
        if (response.status === 400 && result.code === "verification_required" && attempt === 0) {
          submitLabel.textContent = "Un ultimo controllo…";
          setStatus("Aggiorniamo il controllo di sicurezza. Non devi ricompilare nulla.");
          failureMessage = "Il controllo non è andato a buon fine. La tua idea è ancora qui: riprova tra poco.";
          payload.turnstileToken = await acquireVerification(true);
          continue;
        }
        failureMessage = result.message || failureMessage;
        throw new Error("request-failed");
      }

      contactForm.reset();
      updateMessageHint();
      contactForm.classList.add("is-success");
      showStep(0);
      setStatus("Il tuo messaggio è arrivato. Ti risponderemo all’email che ci hai lasciato.", "success");
      contactContext.textContent = "Il tuo messaggio è arrivato. Ti risponderemo all’email che ci hai lasciato.";
      contactPanel.open = false;
      contactPanel.querySelector("summary").focus({ preventScroll: true });
      if (startedAt) startedAt.value = String(Date.now());
      clearVerification();
      track("contact_success");
    } catch {
      setStatus(failureMessage, "error");
      clearVerification();
      track("contact_error");
    } finally {
      submitPending = false;
      contactForm.removeAttribute("aria-busy");
      lockedFields.forEach((field) => { field.disabled = false; });
      delete contactPanel.dataset.state;
      if (!contactForm.classList.contains("is-success")) {
        syncContactContext();
        if (!contactPanel.open) contactContext.textContent = "Il messaggio non è stato inviato. Riapri il modulo: quello che hai scritto è ancora lì.";
      }
      submitButton.disabled = false;
      submitLabel.textContent = originalLabel;
    }
  });
})();
