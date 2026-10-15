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

  const syncHeader = () => header?.classList.toggle("is-scrolled", window.scrollY > 18);
  syncHeader();
  window.addEventListener("scroll", syncHeader, { passive: true });

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
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in-view");
          const service = entry.target.dataset.service;
          if (service && !trackedSections.has(service)) {
            trackedSections.add(service);
            track(`service_${service}_view`);
          }
        });
      },
      { threshold: 0.28 },
    );
    document.querySelectorAll("[data-service]").forEach((element) => sceneObserver.observe(element));
  } else {
    document.querySelectorAll("[data-reveal]").forEach((element) => element.classList.add("is-revealed"));
  }

  const pointerScene = document.querySelector("[data-pointer-scene]");
  if (pointerScene && !reduceMotion && window.matchMedia("(pointer: fine)").matches) {
    let frame = 0;
    pointerScene.addEventListener(
      "pointermove",
      (event) => {
        if (frame) return;
        frame = requestAnimationFrame(() => {
          const bounds = pointerScene.getBoundingClientRect();
          pointerScene.style.setProperty("--mx", `${event.clientX - bounds.left}px`);
          pointerScene.style.setProperty("--my", `${event.clientY - bounds.top}px`);
          frame = 0;
        });
      },
      { passive: true },
    );
  }

  const sequenceSections = document.querySelectorAll("[data-sequence]");
  if (!reduceMotion && "IntersectionObserver" in window) {
    const sequenceObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in-view");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12 });
    sequenceSections.forEach((section) => sequenceObserver.observe(section));
  }

  const ecosystem = document.querySelector("[data-ecosystem]");
  if (ecosystem) {
    const modules = ecosystem.querySelectorAll("[data-eco-select]");
    const details = ecosystem.querySelectorAll("[data-eco-detail]");
    function selectService(service) {
      ecosystem.dataset.active = service;
      modules.forEach((module) => {
        module.setAttribute("aria-pressed", String(module.dataset.ecoSelect === service));
      });
      details.forEach((detail) => {
        detail.hidden = detail.dataset.ecoDetail !== service;
      });
    }
    modules.forEach((module) => {
      module.addEventListener("click", () => selectService(module.dataset.ecoSelect));
    });
    ecosystem.classList.add("has-selection");
    selectService("web");
  }

  if (!contactForm || !formStatus) return;

  const startedAt = contactForm.elements.namedItem("startedAt");
  const turnstileShell = document.querySelector("[data-turnstile]");
  let turnstileWidgetId = null;
  let turnstileToken = "";
  let turnstilePromise = null;

  if (startedAt) startedAt.value = String(Date.now());

  function setStatus(message, state = "") {
    formStatus.textContent = message;
    formStatus.className = `form-status${state ? ` is-${state}` : ""}`;
  }

  async function loadTurnstile() {
    if (turnstileWidgetId !== null || turnstilePromise) return turnstilePromise;
    turnstilePromise = (async () => {
      const configResponse = await fetch("/api/config", { headers: { Accept: "application/json" } });
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
          script.onload = resolve;
          script.onerror = () => reject(new Error("turnstile-load-failed"));
          document.head.append(script);
        });
      }

      if (!window.turnstile || !turnstileShell) throw new Error("turnstile-unavailable");
      turnstileWidgetId = window.turnstile.render(turnstileShell, {
        sitekey: siteKey,
        action: "services_contact",
        appearance: "interaction-only",
        theme: "dark",
        size: "flexible",
        callback: (token) => {
          turnstileToken = token;
        },
        "expired-callback": () => {
          turnstileToken = "";
        },
        "error-callback": () => {
          turnstileToken = "";
          setStatus("La verifica anti-spam non è disponibile. Riprova tra poco.", "error");
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
    setStatus("");
    contactForm.classList.remove("is-success");

    if (!contactForm.checkValidity()) {
      contactForm.reportValidity();
      setStatus("Controlla i campi indicati e riprova.", "error");
      return;
    }

    try {
      await loadTurnstile();
    } catch {
      setStatus("La verifica anti-spam non è disponibile. Riprova tra poco.", "error");
      return;
    }

    if (!turnstileToken) {
      setStatus("Completa la verifica anti-spam per inviare il messaggio.", "error");
      return;
    }

    const submitButton = contactForm.querySelector('button[type="submit"]');
    const submitLabel = submitButton.querySelector("span");
    const originalLabel = submitLabel.textContent;
    submitButton.disabled = true;
    submitLabel.textContent = "Invio in corso…";
    setStatus("Stiamo inviando il messaggio.");
    track("contact_submit");

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
      turnstileToken,
    };

    let failureMessage = "Il messaggio non è partito. Riprova tra poco.";
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        failureMessage = result.message || failureMessage;
        throw new Error("request-failed");
      }

      contactForm.reset();
      contactForm.classList.add("is-success");
      setStatus("Messaggio inviato. Ti risponderemo appena possibile.", "success");
      if (startedAt) startedAt.value = String(Date.now());
      turnstileToken = "";
      if (window.turnstile && turnstileWidgetId !== null) window.turnstile.reset(turnstileWidgetId);
      track("contact_success");
    } catch {
      setStatus(failureMessage, "error");
      if (window.turnstile && turnstileWidgetId !== null) window.turnstile.reset(turnstileWidgetId);
      turnstileToken = "";
      track("contact_error");
    } finally {
      submitButton.disabled = false;
      submitLabel.textContent = originalLabel;
    }
  });
})();
