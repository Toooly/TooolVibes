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

  const sceneStories = {
    web: [["Design", "Gerarchia e contenuti guidano la lettura.", "35%", "40%"], ["Responsive", "La stessa esperienza, dal computer allo smartphone.", "76%", "56%"], ["Contatto", "Un invito chiaro a fare il passo successivo.", "38%", "63%"]],
    social: [["Identità", "Colori e linguaggio visivo restano riconoscibili.", "26%", "43%"], ["Contenuti", "L’identità prende forma nei contenuti.", "52%", "55%"], ["Pubblicazione", "Il calendario organizza la continuità dei contenuti.", "76%", "48%"]],
    ai: [["Richiesta", "La conversazione parte da una domanda concreta.", "41%", "34%"], ["Risposta", "Informazioni utili, nel contesto della richiesta.", "46%", "51%"], ["Contatto", "La conversazione può diventare un nuovo contatto.", "75%", "55%"]],
  };
  document.querySelectorAll("[data-service] .service-visual").forEach((figure) => {
    const story = sceneStories[figure.closest("[data-service]").dataset.service];
    if (!story) return;
    const art = document.createElement("div");
    art.className = "service-visual__art";
    art.append(...figure.children);
    const focus = document.createElement("span");
    focus.className = "service-visual__focus";
    focus.setAttribute("aria-hidden", "true");
    art.append(focus);
    const caption = document.createElement("figcaption");
    caption.className = "service-demo";
    const controls = document.createElement("div");
    controls.className = "service-demo__steps";
    controls.setAttribute("role", "group");
    controls.setAttribute("aria-label", "Esplora le fasi del servizio");
    const description = document.createElement("p");
    description.setAttribute("aria-live", "polite");
    story.forEach(([label, text, x, y], index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = label;
      button.setAttribute("aria-pressed", String(index === 0));
      button.addEventListener("click", () => {
        controls.querySelectorAll("button").forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
        description.textContent = text;
        focus.style.setProperty("--focus-x", x);
        focus.style.setProperty("--focus-y", y);
        if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          figure.querySelector(".service-visual__pulse").getAnimations().forEach((animation) => { animation.currentTime = 0; animation.play(); });
        }
      });
      controls.append(button);
    });
    description.textContent = story[0][1];
    focus.style.setProperty("--focus-x", story[0][2]);
    focus.style.setProperty("--focus-y", story[0][3]);
    caption.append(controls, description);
    figure.append(art, caption);
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
          const service = entry.target.dataset.service;
          if (service && !trackedSections.has(service)) {
            trackedSections.add(service);
            track(`service_${service}_view`);
          }
        });
      },
      { threshold: 0.28 },
    );
    document.querySelectorAll("[data-service], .service-visual").forEach((element) => sceneObserver.observe(element));
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
    const services = {
      web: { description: "Siti, landing page ed e-commerce.", target: "#servizi", label: "Esplora il servizio: siti e web" },
      social: { description: "Dall’identità del brand ai contenuti, fino alla pubblicazione.", target: "#contenuti", label: "Esplora il servizio: automazione contenuti" },
      ai: { description: "Richieste, risposte e nuovi contatti. Un passo dopo l’altro.", target: "#chatbot", label: "Esplora il servizio: chatbot AI" },
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
    }
    choices.forEach((choice) => choice.addEventListener("click", () => selectJourney(choice.dataset.journeySelect)));
    journey.querySelector("[data-journey-controls]").hidden = false;
    link.setAttribute("aria-label", services.web.label);
    if (!reduceMotion && "IntersectionObserver" in window) {
      const journeyObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => journey.classList.toggle("is-in-view", entry.isIntersecting));
      }, { threshold: 0.15 });
      journeyObserver.observe(journey.querySelector(".journey__visual"));
    }
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
  if (!contactForm || !formStatus) return;

  const contactPanel = document.querySelector("[data-contact-panel]");
  const contactContext = document.querySelector("[data-contact-context]");
  const formSteps = [...contactForm.querySelectorAll("[data-form-step]")];
  const stepButtons = [...contactForm.querySelectorAll("[data-step-target]")];
  const nextStep = contactForm.querySelector("[data-step-next]");
  const previousStep = contactForm.querySelector("[data-step-back]");
  let currentStep = 0;

  function syncContactContext() {
    const selected = contactForm.querySelector('[name="need"]:checked');
    contactContext.textContent = selected ? selected.nextElementSibling.textContent : "Scegli da dove vuoi partire.";
    contactPanel.dataset.kind = selected?.value || "";
  }

  function showStep(index, focus = false) {
    currentStep = index;
    formSteps.forEach((step, i) => { step.hidden = i !== index; });
    stepButtons.forEach((button, i) => {
      if (i === index) button.setAttribute("aria-current", "step");
      else button.removeAttribute("aria-current");
      button.classList.toggle("is-complete", i < index);
    });
    previousStep.hidden = index === 0;
    nextStep.hidden = index === formSteps.length - 1;
    setStatus("");
    if (focus) formSteps[index].querySelector("input, textarea")?.focus({ preventScroll: true });
  }

  function goToStep(index) {
    for (let i = 0; i < index; i++) {
      const invalid = [...formSteps[i].querySelectorAll("input, textarea")].find((field) => !field.validity.valid);
      if (invalid) {
        showStep(i);
        invalid.reportValidity();
        setStatus("Completa i campi indicati per continuare.", "error");
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
    if (event.target.name === "need") syncContactContext();
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
      showStep(1);
    }
    syncContactContext();
  }
  document.querySelectorAll('a[href="#contatti"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      openContact(link.closest("[data-service]")?.dataset.service);
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
      const invalid = contactForm.querySelector(":invalid");
      const step = invalid?.closest("[data-form-step]");
      if (step) showStep(Number(step.dataset.formStep));
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
      showStep(0);
      setStatus("Messaggio inviato. Ti risponderemo appena possibile.", "success");
      contactContext.textContent = "Messaggio inviato. Ti risponderemo appena possibile.";
      contactPanel.open = false;
      contactPanel.querySelector("summary").focus({ preventScroll: true });
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
