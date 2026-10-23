(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const body = document.body;
  const menuToggle = document.querySelector("[data-menu-toggle]");
  const mobileNav = document.querySelector("[data-mobile-nav]");
  const contactForm = document.querySelector("[data-contact-form]");
  const formStatus = document.querySelector("[data-form-status]");
  const trackedSections = new Set();

  function buildTrailBundle(svg, points, directions, width, height) {
    const margin = 4;
    const handles = points.map((point, index) => {
      const previous = points[Math.max(0, index - 1)];
      const next = points[Math.min(points.length - 1, index + 1)];
      const horizontal = directions[index] === "horizontal";
      const axis = horizontal ? 0 : 1;
      const sign = horizontal && index === points.length - 1 && point[0] < previous[0] ? -1 : 1;
      const gaps = [];
      if (index) gaps.push(horizontal ? Math.hypot(point[0] - previous[0], point[1] - previous[1]) : Math.abs(point[axis] - previous[axis]));
      if (index < points.length - 1) gaps.push(horizontal ? Math.hypot(next[0] - point[0], next[1] - point[1]) : Math.abs(next[axis] - point[axis]));
      const desired = Math.max(4, Math.min(...gaps.filter(gap => gap > 0)) * (horizontal ? .36 : .46));
      const limit = horizontal ? width : height;
      const room = [];
      if (index) room.push(sign > 0 ? point[axis] - margin : limit - margin - point[axis]);
      if (index < points.length - 1) room.push(sign > 0 ? limit - margin - point[axis] : point[axis] - margin);
      const length = Math.max(1, Math.min(desired, (horizontal ? width : height) * .2, ...room));
      return horizontal ? [sign * length, 0] : [0, length];
    });
    const rounded = value => Number(value.toFixed(2));
    function geometry(coefficient) {
      const shifted = points.map((point, index) => {
        const progress = index / (points.length - 1);
        const spread = coefficient * Math.sin(Math.PI * progress) * (12 + 10 * progress);
        const handle = handles[index];
        const magnitude = Math.hypot(...handle);
        return [point[0] - handle[1] / magnitude * spread, point[1] + handle[0] / magnitude * spread];
      });
      const curves = shifted.slice(1).map((point, index) => [
        shifted[index][0] + handles[index][0], shifted[index][1] + handles[index][1],
        point[0] - handles[index + 1][0], point[1] - handles[index + 1][1],
        ...point,
      ]);
      const d = ["M", ...shifted[0], ...curves.flatMap(curve => ["C", ...curve])]
        .map(value => typeof value === "number" ? rounded(value) : value).join(" ");
      return { d, curves };
    }
    const center = geometry(0);
    let pen = points[0];
    let total = 0;
    const stops = center.curves.map(curve => {
      let previous = pen;
      for (let step = 1; step <= 24; step++) {
        const t = step / 24;
        const u = 1 - t;
        const point = [0, 1].map(axis => u ** 3 * pen[axis] + 3 * u ** 2 * t * curve[axis] + 3 * u * t ** 2 * curve[axis + 2] + t ** 3 * curve[axis + 4]);
        total += Math.hypot(point[0] - previous[0], point[1] - previous[1]);
        previous = point;
      }
      pen = curve.slice(4);
      return total;
    });
    svg.querySelectorAll("[data-trail-strand]").forEach(strand => {
      strand.setAttribute("d", geometry(Number(strand.dataset.trailStrand) || 0).d);
    });
    return { ...center, stops, total };
  }

  function initIntroTrail() {
    if (!window.CSS?.supports?.("animation-timeline: scroll()") || !window.CSS.supports("offset-path", 'path("M0 0 L1 1")')) return;
    const hero = document.querySelector(".hero");
    const trail = hero?.querySelector("[data-intro-trail]");
    const svg = trail?.querySelector("svg");
    const route = trail?.querySelector("[data-intro-route]");
    const spot = trail?.querySelector("[data-intro-spot]");
    const mark = document.querySelector(".brand-signal img");
    const copy = hero?.querySelector(".hero__copy");
    const title = copy?.querySelector("h1");
    const lead = copy?.querySelector(":scope > p");
    const actions = copy?.querySelector(".hero__actions");
    const primary = actions?.querySelector(".button--primary");
    const secondary = actions?.querySelector(".button--secondary");
    const destination = document.getElementById("journey-title");
    if (!hero || !trail || !svg || !route || !spot || !mark || !copy || !title || !lead || !primary || !secondary || !destination) return;

    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const root = document.documentElement;
    let scheduled = 0;
    let disposed = false;
    function measure() {
      scheduled = 0;
      if (disposed || preference.matches || !hero.clientWidth || !hero.clientHeight) return;
      const bounds = hero.getBoundingClientRect();
      const source = mark.getBoundingClientRect();
      const width = hero.clientWidth;
      const gutter = parseFloat(getComputedStyle(hero).paddingLeft) || 20;
      const edge = Math.max(40, Math.min(gutter * .7, width * .12));
      const left = edge;
      const right = width - edge;
      const sx = Math.max(16, Math.min(width - 16, source.left - bounds.left + source.width / 2));
      const sy = Math.max(16, source.top - bounds.top + source.height / 2);
      const y1 = Math.max(sy + 64, copy.offsetTop + title.offsetTop + title.offsetHeight * .65);
      const y2 = Math.max(y1 + 72, copy.offsetTop + lead.offsetTop + lead.offsetHeight * .44);
      const firstButton = primary.getBoundingClientRect();
      const secondButton = secondary.getBoundingClientRect();
      const heading = destination.getBoundingClientRect();
      const stacked = secondButton.top - firstButton.top > 20;
      const px = stacked ? right : firstButton.right - bounds.left - 26;
      const py = firstButton.top - bounds.top + firstButton.height / 2;
      const qx = stacked ? left : secondButton.left - bounds.left + 26;
      const qy = secondButton.top - bounds.top + secondButton.height / 2;
      const dx = heading.left - bounds.left + heading.width / 2;
      const end = heading.bottom - bounds.top + 11;
      const height = Math.ceil(Math.max(hero.clientHeight, end + 32));
      const { d, stops, total } = buildTrailBundle(svg,
        [[sx, sy], [right, y1], [left, y2], [px, py], [qx, qy], [dx, end]],
        ["horizontal", "vertical", "vertical", stacked ? "vertical" : "horizontal", stacked ? "vertical" : "horizontal", "horizontal"],
        width, height);
      const desiredTravel = Math.max(560, Math.min(860, end - sy - 40));
      const heroTop = window.scrollY + bounds.top;
      const visibilityCap = Math.min(
        (heroTop + py - firstButton.height / 2 - 24.5) / (stops[2] / total * .92),
        (heroTop + qy - secondButton.height / 2 - 24.5) / (stops[3] / total * .92));
      const travel = Math.max(1, Math.floor(Math.min(desiredTravel, visibilityCap)));
      const arrival = index => stops[index] / total * travel * .92;
      const timing = (name, value) => root.style.setProperty(name, `${Math.max(0, Math.round(value))}px`);
      timing("--intro-travel", travel);
      timing("--intro-primary-from", arrival(2) - 32);
      timing("--intro-primary-to", arrival(2) + 42);
      timing("--intro-secondary-from", arrival(3) - 32);
      timing("--intro-secondary-to", arrival(4) + 20);
      timing("--intro-dock-from", arrival(4) - 32);
      timing("--intro-dock-to", Math.min(travel - 1, arrival(4) + 36));
      svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
      route.setAttribute("d", d);
      spot.style.offsetPath = `path("${d}")`;
      trail.style.height = `${height}px`;
      trail.classList.add("is-ready");
      root.classList.add("intro-guided");
    }
    function schedule() {
      if (!disposed && !preference.matches && !scheduled) scheduled = requestAnimationFrame(measure);
    }
    const observer = "ResizeObserver" in window ? new ResizeObserver(schedule) : null;
    function syncPreference() {
      if (scheduled) cancelAnimationFrame(scheduled);
      scheduled = 0;
      observer?.disconnect();
      window.removeEventListener("resize", schedule);
      if (preference.matches) {
        trail.classList.remove("is-ready");
        root.classList.remove("intro-guided");
      } else {
        if (observer) { observer.observe(hero); observer.observe(destination); }
        else window.addEventListener("resize", schedule, { passive: true });
        schedule();
      }
    }
    function dispose(event) {
      if (scheduled) cancelAnimationFrame(scheduled);
      scheduled = 0;
      if (event.persisted) return;
      disposed = true;
      observer?.disconnect();
      window.removeEventListener("resize", schedule);
      preference.removeEventListener("change", syncPreference);
      window.removeEventListener("pagehide", dispose);
    }
    preference.addEventListener("change", syncPreference);
    window.addEventListener("pagehide", dispose);
    document.fonts?.ready.then(schedule);
    syncPreference();
  }
  initIntroTrail();

  function initContactTrail() {
    if (!window.CSS?.supports?.("offset-path", 'path("M0 0 L1 1")') || !("IntersectionObserver" in window)) return;
    const section = document.querySelector(".contact");
    const trail = section?.querySelector("[data-contact-trail]");
    const svg = trail?.querySelector("svg");
    const route = trail?.querySelector("[data-contact-route]");
    const spot = trail?.querySelector("[data-intro-spot]");
    const panel = section?.querySelector("[data-contact-panel]");
    const summary = panel?.querySelector("summary");
    const title = section?.querySelector("h2");
    if (!section || !trail || !svg || !route || !spot || !panel || !summary || !title) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let played = false;
    let disposed = false;
    let scheduled = 0;
    const editing = () => section.contains(document.activeElement) && document.activeElement.matches("input,textarea,select");
    function stop() {
      if (scheduled) cancelAnimationFrame(scheduled);
      scheduled = 0;
      trail.classList.remove("is-ready", "is-playing");
    }
    function play() {
      scheduled = 0;
      if (disposed || preference.matches || editing()) return;
      const bounds = section.getBoundingClientRect();
      const heading = title.getBoundingClientRect();
      const card = summary.getBoundingClientRect();
      const target = (panel.dataset.expanded === "true" && panel.querySelector('[aria-current="step"] > span')) || summary.querySelector("svg");
      if (!target || !section.clientWidth) return;
      const destination = target.getBoundingClientRect();
      const headingVisible = heading.top >= 16 && heading.bottom < window.innerHeight * .8;
      const sx = headingVisible ? heading.left - bounds.left + Math.min(heading.width * .25, 70) : card.left - bounds.left + 20;
      const sy = headingVisible ? heading.top - bounds.top + Math.min(heading.height * .35, 48) : card.top - bounds.top + 8;
      const tx = destination.left - bounds.left + destination.width / 2;
      const ty = destination.top - bounds.top + destination.height / 2;
      const left = Math.max(40, card.left - bounds.left + 16);
      const right = Math.min(section.clientWidth - 40, card.right - bounds.left - 16);
      const span = ty - sy;
      const height = Math.ceil(Math.max(sy, ty) + 80);
      const verticalApproach = Math.abs(span) > Math.abs(tx - sx) * .5;
      const midpoint = verticalApproach
        ? Math.min(section.clientWidth - 40, Math.max(sx, tx) + Math.min(72, Math.max(24, Math.abs(span) * .4)))
        : (sx + tx) / 2;
      const points = headingVisible && span > 140
        ? [[sx, sy], [right, sy + span * .4], [left, sy + span * .8], [tx, ty]]
        : [[sx, sy], [midpoint, sy + span * .5], [tx, ty]];
      const directions = points.map((_, index) => index === 0 || index === points.length - 1 || (points.length === 3 && !verticalApproach) ? "horizontal" : "vertical");
      const { d } = buildTrailBundle(svg, points, directions, section.clientWidth, height);
      svg.setAttribute("viewBox", `0 0 ${section.clientWidth} ${height}`);
      route.setAttribute("d", d);
      spot.style.offsetPath = `path("${d}")`;
      trail.style.height = `${height}px`;
      trail.classList.add("is-ready", "is-playing");
    }
    const observer = new IntersectionObserver(entries => {
      if (played || preference.matches || !entries.some(entry => entry.isIntersecting && entry.intersectionRatio >= .6)) return;
      played = true;
      observer.disconnect();
      if (!editing()) scheduled = requestAnimationFrame(play);
    }, { threshold: .6, rootMargin: "0px 0px -8% 0px" });
    function syncPreference() {
      observer.disconnect();
      if (preference.matches) stop();
      else if (!played && !disposed) observer.observe(summary);
    }
    function onFocus() { if (editing()) stop(); }
    function onEnd(event) { if (event.target.classList.contains("intro-trail__head")) stop(); }
    function dispose(event) {
      if (event.persisted) return;
      disposed = true;
      stop();
      observer.disconnect();
      preference.removeEventListener("change", syncPreference);
      section.removeEventListener("focusin", onFocus);
      trail.removeEventListener("animationend", onEnd);
      window.removeEventListener("pagehide", dispose);
    }
    section.addEventListener("focusin", onFocus);
    trail.addEventListener("animationend", onEnd);
    preference.addEventListener("change", syncPreference);
    window.addEventListener("pagehide", dispose);
    syncPreference();
  }
  initContactTrail();


  function track(eventName) {
    const allowed = new Set([
      "cta_header",
      "cta_hero",
      "cta_mobile_menu",
      "service_software_view",
      "service_app_view",
      "service_ecommerce_view",
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

  const serviceScreens = {
    "ecommerce": "<svg class=\"service-screen\" viewBox=\"0 0 1280 853\" aria-hidden=\"true\"><path class=\"screen-action\" fill=\"#70e4af\" fill-opacity=\".35\" d=\"m875 660 161 27-7 27-160-28Z\"/><path class=\"screen-cursor\" fill=\"#f4f0e8\" stroke=\"#071020\" stroke-width=\"3\" d=\"m1007 688 6 25 6-9 11-3Z\"/><path class=\"screen-confirm\" d=\"m967 689 6 7 12-10\"/></svg>",
    "app": "<svg class=\"service-screen\" viewBox=\"0 0 1280 853\" aria-hidden=\"true\"><path class=\"screen-transfer\" pathLength=\"100\" d=\"M390 494C480 494 516 402 617 402\"/><g class=\"screen-checks\"><path d=\"m913 549 6 6 10-11\"/><path d=\"m795 660 12 12 27-26\"/></g></svg>",
    "software": "<svg class=\"service-screen\" viewBox=\"0 0 1280 853\" aria-hidden=\"true\"><path class=\"screen-transfer\" pathLength=\"100\" d=\"M365 290h116q26 0 26 26v18h86\"/><g class=\"screen-checks\"><path d=\"m793 516 6 6 12-12\"/><path d=\"m769 587 6 6 12-12\"/></g></svg>"
};
  const sceneLayers = {
    ecommerce: "M940 318Q927 314 918 344L842 715Q836 738 859 743L1030 769Q1050 772 1056 746L1134 369Q1141 346 1117 342Z",
    app: "M839 195Q814 190 805 221L638 701Q629 728 656 736L898 793Q923 799 933 769L1071 271Q1079 245 1056 238Z",
    software: "M968 316Q942 322 937 347L877 713Q873 738 899 743L1134 767Q1160 771 1163 743L1200 315Q1204 288 1178 292Z",
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
    if (service === "ecommerce") {
      svg.querySelectorAll(".screen-action,.screen-cursor,.screen-confirm").forEach((element) => svg.querySelector(".scene-layer").append(element));
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
    document.querySelectorAll(".service-benefits").forEach((element) => sceneObserver.observe(element));
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
    const order = ["ecommerce", "app", "software"];
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
      ecommerce: { description: "Dal prodotto al pagamento. Un percorso chiaro.", target: "#servizi", label: "Scopri il progetto e-commerce" },
      app: { description: "La tua idea diventa un’app da usare davvero.", target: "#app", label: "Scopri la creazione app" },
      software: { description: "Un software che segue il tuo modo di lavorare.", target: "#software", label: "Scopri il software personalizzato" },
    };
    function selectJourney(service) {
      const selected = services[service];
      if (!selected || journey.dataset.active === service) return;
      journey.dataset.active = service;
      choices.forEach((choice) => choice.setAttribute("aria-pressed", String(choice.dataset.journeySelect === service)));
      scenes.forEach((scene) => { scene.hidden = scene.dataset.journeyScene !== service; });
      description.textContent = selected.description;
      link.setAttribute("href", selected.target);
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
      stickyTop = 12;
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
    const storageKey = "projects-availability-dismissed-until";
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
      if (service) launcher.dataset.available = service.querySelector(".service-capacity")?.dataset.available || "request";
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
      // The offer owns both the availability state and its wording.
      const capacity = service.querySelector(".service-capacity");
      const title = capacity?.querySelector("small b")?.textContent.trim();
      const detail = capacity?.querySelector(".service-capacity__limit")?.textContent.trim();
      if (!title || !detail) return;
      notice.dataset.service = service.dataset.service;
      notice.dataset.available = capacity.dataset.available || "request";
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

  // The native details remains the no-JavaScript fallback. Only its reveal is measured.
  const contactMotion = (() => {
    const summary = contactPanel.querySelector("summary");
    const reveal = document.getElementById("contact-reveal");
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const easing = "cubic-bezier(0.22, 1, 0.36, 1)";
    const contentAnimations = new Set();
    let expanded = contactPanel.open;
    let heightAnimation = null;
    let targetHeight = -1;
    let leaving = null;
    const canAnimate = () => !preference.matches && typeof reveal.animate === "function";

    function settleContent() {
      contentAnimations.forEach((animation) => animation.cancel());
      contentAnimations.clear();
      if (leaving) {
        leaving.hidden = leaving !== formSteps[currentStep];
        leaving.removeAttribute("inert");
        leaving.removeAttribute("aria-hidden");
        for (const property of ["position", "top", "left", "width"]) leaving.style.removeProperty(property);
        leaving = null;
      }
    }

    function animateContent(element, frames, options = {}) {
      if (!canAnimate()) return null;
      const animation = element.animate(frames, { duration: 300, easing, ...options });
      contentAnimations.add(animation);
      animation.addEventListener("finish", () => { contentAnimations.delete(animation); animation.cancel(); }, { once: true });
      animation.addEventListener("cancel", () => contentAnimations.delete(animation), { once: true });
      return animation;
    }

    function fit(duration = 400) {
      const end = expanded ? contactForm.getBoundingClientRect().height : 0;
      if (end === targetHeight && heightAnimation) return;
      const start = reveal.getBoundingClientRect().height;
      heightAnimation?.cancel();
      heightAnimation = null;
      targetHeight = end;
      reveal.style.height = expanded && typeof ResizeObserver !== "function" ? "auto" : `${end}px`;
      const finish = () => { if (!expanded) contactPanel.open = false; };
      if (!canAnimate() || Math.abs(start - end) < 1) { finish(); return; }
      const animation = reveal.animate([{ height: `${start}px` }, { height: `${end}px` }], { duration, easing });
      heightAnimation = animation;
      animation.onfinish = () => {
        if (heightAnimation !== animation) return;
        heightAnimation = null;
        animation.cancel();
        finish();
      };
    }

    function setOpen(open) {
      if (expanded === open) return;
      settleContent();
      expanded = open;
      contactPanel.dataset.expanded = String(open);
      summary.setAttribute("aria-expanded", String(open));
      if (!open && reveal.contains(document.activeElement)) summary.focus({ preventScroll: true });
      if (open) contactPanel.open = true;
      reveal.toggleAttribute("inert", !open);
      reveal.setAttribute("aria-hidden", String(!open));
      fit(open ? 400 : 300);
      if (!open) {
        animateContent(contactForm, [{ opacity: 1 }, { opacity: 0, transform: "translateY(-4px)" }], { duration: 140, fill: "forwards" });
        return;
      }
      const stage = formSteps[currentStep];
      const items = [
        contactForm.querySelector("[data-contact-steps]"),
        ...stage.querySelectorAll(".contact-stage__welcome,.contact-stage__heading,.need-fieldset legend,.need-options label,.field:not(.field-grid .field),.field-grid,.privacy-check,.contact-form__submit"),
        contactForm.querySelector("[data-contact-actions]"),
      ].filter((element) => !element.hidden);
      items.forEach((element, index) => animateContent(element,
        [{ opacity: 0, transform: "translateY(12px)" }, { opacity: 1, transform: "translateY(0)" }],
        { delay: Math.min(index * 45, 225), fill: "backwards" }));
      animateContent(contactPanel, [
        { borderColor: "var(--line-strong)", boxShadow: "var(--shadow)" },
        { borderColor: "var(--cyan)", boxShadow: "0 0 24px rgba(39,216,238,.13), var(--shadow)", offset: .24 },
        { borderColor: "var(--line-strong)", boxShadow: "var(--shadow)" },
      ], { duration: 650 });
    }

    function changeStep(index, update, focus) {
      settleContent();
      const outgoing = formSteps[currentStep];
      const incoming = formSteps[index];
      const direction = index >= currentStep ? 1 : -1;
      const transition = index !== currentStep && expanded && canAnimate();
      const geometry = transition ? { top: outgoing.offsetTop, left: outgoing.offsetLeft, width: outgoing.offsetWidth } : null;
      update();
      if (transition) {
        leaving = outgoing;
        outgoing.hidden = false;
        outgoing.setAttribute("inert", "");
        outgoing.setAttribute("aria-hidden", "true");
        Object.assign(outgoing.style, { position: "absolute", top: `${geometry.top}px`, left: `${geometry.left}px`, width: `${geometry.width}px` });
        const exit = animateContent(outgoing,
          [{ opacity: 1, transform: "translateX(0)" }, { opacity: 0, transform: `translateX(${-direction * 16}px)` }],
          { duration: 140, fill: "forwards" });
        exit.addEventListener("finish", () => {
          if (leaving === outgoing) {
            outgoing.hidden = true;
            outgoing.removeAttribute("inert");
            outgoing.removeAttribute("aria-hidden");
            for (const property of ["position", "top", "left", "width"]) outgoing.style.removeProperty(property);
            leaving = null;
          }
        }, { once: true });
        animateContent(incoming,
          [{ opacity: 0, transform: `translateX(${direction * 16}px)` }, { opacity: 1, transform: "translateX(0)" }]);
      }
      fit(300);
      if (focus) {
        // Focus the question, not an input: Next should not summon a mobile keyboard.
        const question = incoming.querySelector("h3,legend");
        question.tabIndex = -1;
        question.focus({ preventScroll: true });
        const bounds = question.getBoundingClientRect();
        const top = 16;
        const bottom = window.visualViewport?.height || window.innerHeight;
        if (bounds.height && (bounds.top < top || bounds.bottom > bottom)) {
          window.scrollBy({ top: bounds.top - top, behavior: preference.matches ? "instant" : "smooth" });
        }
      }
    }

    summary.setAttribute("aria-controls", reveal.id);
    summary.setAttribute("aria-expanded", String(expanded));
    contactPanel.dataset.expanded = String(expanded);
    reveal.toggleAttribute("inert", !expanded);
    reveal.setAttribute("aria-hidden", String(!expanded));
    reveal.style.height = expanded ? `${contactForm.getBoundingClientRect().height}px` : "0px";
    summary.addEventListener("click", (event) => { event.preventDefault(); setOpen(!expanded); });
    contactPanel.addEventListener("toggle", () => {
      // A queued native open event must not reverse a closing animation.
      if (contactPanel.open !== expanded && !(heightAnimation && !expanded)) setOpen(contactPanel.open);
    });
    const observer = typeof ResizeObserver === "function" ? new ResizeObserver(() => { if (expanded) fit(); }) : null;
    observer?.observe(contactForm);
    const motionChanged = () => { settleContent(); targetHeight = -1; fit(0); };
    preference.addEventListener?.("change", motionChanged);
    window.addEventListener("pagehide", () => {
      observer?.disconnect();
      preference.removeEventListener?.("change", motionChanged);
      settleContent();
      heightAnimation?.cancel();
      heightAnimation = null;
      reveal.style.height = expanded ? `${contactForm.getBoundingClientRect().height}px` : "0px";
      if (!expanded) contactPanel.open = false;
    });
    window.addEventListener("pageshow", (event) => {
      if (!event.persisted) return;
      observer?.observe(contactForm);
      preference.addEventListener?.("change", motionChanged);
      fit(0);
    });
    return { setOpen, changeStep };
  })();

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
    if (index < 0 || index >= formSteps.length) return;
    contactMotion.changeStep(index, () => {
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
    }, focus);
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
    contactForm.classList.remove("is-success");
    const need = { ecommerce: "ecommerce", app: "app", software: "software" }[service];
    if (need) {
      contactForm.querySelector(`[name="need"][value="${need}"]`).checked = true;
      showFieldError(contactForm.querySelector(`[name="need"][value="${need}"]`));
      showStep(1);
    }
    syncContactContext();
    contactMotion.setOpen(true);
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
        action: "projects_contact",
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
      contactMotion.setOpen(false);
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
