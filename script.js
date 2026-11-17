(() => {
  "use strict";

  /* ---------- Anciennes adresses (#/services…) → nouvelles pages ---------- */
  const LEGACY = {
    accueil: "/", services: "/services/", methode: "/methode/",
    apropos: "/a-propos/", contact: "/contact/", mentions: "/mentions-legales/",
  };
  const legacy = location.hash.match(/^#\/([a-z]+)/);
  if (legacy && LEGACY[legacy[1]]) { location.replace(LEGACY[legacy[1]]); return; }

  /* ---------- Config ---------- */
  const CONFIG = {
    brand: "Maser Digital",
    email: "valentin.morille@maserdigital.tech", // ← à remplacer
    words: ["des sites web", "des agents IA", "des logiciels", "des pipelines data"],
  };

  /* ---------- Utils ---------- */
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(pointer: fine)").matches;

  $("#year").textContent = new Date().getFullYear();
  $$("#email-link, .js-email").forEach((el) => {
    el.href = `mailto:${CONFIG.email}`;
    el.textContent = CONFIG.email;
  });

  /* ---------- Reveal + counters ---------- */
  const animateCount = (el) => {
    const to = Number(el.dataset.to);
    if (reduced) { el.textContent = to; return; }
    const start = performance.now(), dur = 1600;
    const step = (now) => {
      const t = Math.min((now - start) / dur, 1);
      el.textContent = Math.round(to * (1 - Math.pow(1 - t, 4)));
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add("in");
      $$(".count", e.target).forEach(animateCount);
      observer.unobserve(e.target);
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });

  const armReveals = (scope) => {
    $$(".reveal", scope).forEach((el) => {
      el.classList.remove("in");
      $$(".count", el).forEach((c) => (c.textContent = "0"));
      observer.observe(el);
    });
  };

  /* ---------- Page courante + transitions ---------- */
  const page = $(".page");
  const current = page ? page.id : null;
  const curtain = $(".curtain");
  const navLinks = $("#nav-links");
  const burger = $(".burger");
  let leaving = false;

  const closeMenu = () => {
    navLinks.classList.remove("open");
    burger.setAttribute("aria-expanded", "false");
    burger.setAttribute("aria-label", "Ouvrir le menu");
  };

  if (page) armReveals(page);
  $$("[data-link]").forEach((a) =>
    a.dataset.link === current ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current")
  );

  // Ouverture du rideau à l'arrivée sur la page
  const openCurtain = async () => {
    if (!curtain.classList.contains("in")) return;
    curtain.classList.add("out");
    curtain.classList.remove("in");
    await wait(700);
    curtain.classList.remove("out");
  };
  try { sessionStorage.removeItem("curtain"); } catch {}
  openCurtain();

  // Retour arrière depuis le cache du navigateur : on rouvre le rideau
  addEventListener("pageshow", (e) => {
    if (!e.persisted) return;
    leaving = false;
    try { sessionStorage.removeItem("curtain"); } catch {}
    openCurtain();
  });

  // Fermeture du rideau avant de charger une autre page du site
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[href]");
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if ((a.target && a.target !== "_self") || a.hasAttribute("download")) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return; // mailto:, liens externes
    if (url.pathname === location.pathname) {
      if (url.hash) return; // ancre sur la même page (ex : lien d'évitement)
      e.preventDefault();   // déjà sur cette page : on ne recharge pas
      closeMenu();
      return;
    }
    if (reduced) return; // navigation normale, sans animation
    e.preventDefault();
    if (leaving) return;
    leaving = true;
    closeMenu();
    curtain.classList.remove("out");
    curtain.classList.add("in");
    try { sessionStorage.setItem("curtain", "1"); } catch {}
    setTimeout(() => { location.href = url.href; }, 650);
  });

  burger.addEventListener("click", () => {
    const open = burger.getAttribute("aria-expanded") === "true";
    burger.setAttribute("aria-expanded", String(!open));
    burger.setAttribute("aria-label", open ? "Ouvrir le menu" : "Fermer le menu");
    navLinks.classList.toggle("open", !open);
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeMenu(); });

  /* ---------- Header + progress + timeline ---------- */
  const header = $(".header"), progress = $(".progress");
  const onScroll = () => {
    const y = scrollY;
    header.classList.toggle("scrolled", y > 20);
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.width = max > 0 ? `${(y / max) * 100}%` : "0";

    const tl = $("#timeline");
    if (current === "methode" && tl) {
      const r = tl.getBoundingClientRect();
      const ratio = Math.min(Math.max((innerHeight * 0.6 - r.top) / r.height, 0), 1);
      $(".timeline-fill", tl).style.height = `${ratio * (r.height - 16)}px`;
    }
  };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Scramble words ---------- */
  const GLYPHS = "!-_\\/[]{}=+*^?#01ABCDEF";
  function scramble(el, text) {
    const old = el.textContent;
    const len = Math.max(old.length, text.length);
    const queue = Array.from({ length: len }, (_, i) => {
      const start = Math.floor(Math.random() * 18);
      return { from: old[i] || "", to: text[i] || "", start, end: start + Math.floor(Math.random() * 18) + 6, ch: "" };
    });
    let frame = 0;
    return new Promise((resolve) => {
      const update = () => {
        let out = "", done = 0;
        for (const q of queue) {
   if (frame >= q.end) { done++; out += q.to; }
   else if (frame >= q.start) {
     if (!q.ch || Math.random() < 0.3) q.ch = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
     out += `<span class="glyph">${q.ch}</span>`;
          } else out += q.from;
 }
        el.innerHTML = out;
        if (done === queue.length) resolve();
        else { frame++; requestAnimationFrame(update); }
      };
      update();
    });
  }
  (async () => {
    const el = $("#scramble");
    if (!el || reduced) return;
    let i = 0;
    await wait(1800);
    while (true) {
      if (current === "accueil" && !document.hidden) {
        i = (i + 1) % CONFIG.words.length;
        await scramble(el, CONFIG.words[i]);
      }
      await wait(2400);
    }
  })();

  /* ---------- Terminal demo ---------- */
  const SCRIPT = [
    ["c-p", "$ "], ["", "python pipeline.py --source catalogue --agent analyse\n", true],
    ["c-m", "→ Initialisation du navigateur headless…\n"],
    ["c-a", "[collecte] "], ["", "page 1/12 ✓  page 6/12 ✓  page 12/12 ✓\n"],
    ["c-a", "[collecte] "], ["", "1 284 fiches récupérées\n"],
    ["c-a", "[nettoyage] "], ["", "37 doublons supprimés · 12 champs normalisés\n"],
    ["c-a", "[validation] "], ["c-ok", "schéma OK (1 247 / 1 247)\n"],
    ["c-a", "[stockage] "], ["", "→ PostgreSQL · table products\n"],
    ["c-a", "[agent IA] "], ["", "Synthèse : 3 tendances détectées, rapport généré.\n"],
    ["c-ok", "✔ Pipeline terminé en 41,2 s\n"],
  ];
  (async () => {
    const term = $("#terminal");
    if (!term) return;
    const esc = (s) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
    const caret = '<span class="caret"></span>';
    if (reduced) { term.innerHTML = SCRIPT.map(([c, t]) => `<span class="${c}">${esc(t)}</span>`).join(""); return; }
    while (true) {
      if (current !== "accueil" || document.hidden) { await wait(600); continue; }
      let html = "";
      for (const [cls, text, typed] of SCRIPT) {
        if (typed) {
   for (let k = 1; k <= text.length; k++) {
     term.innerHTML = html + `<span class="${cls}">${esc(text.slice(0, k))}</span>` + caret;
     await wait(28 + Math.random() * 40);
          }
 } else {
   await wait(text.endsWith("\n") ? 320 : 60);
 }
        html += `<span class="${cls}">${esc(text)}</span>`;
        term.innerHTML = html + caret;
      }
      await wait(4000);
    }
  })();

  /* ---------- Particle network ---------- */
  const cv = $("#bg"), ctx = cv.getContext("2d");
  let W = 0, H = 0, pts = [];
  const mouse = { x: -9999, y: -9999 };
  const resize = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + "px"; cv.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.round(Math.min(110, (W * H) / 15000));
    pts = Array.from({ length: n }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35, r: Math.random() * 1.5 + 0.5,
    }));
  };
  const draw = () => {
    ctx.clearRect(0, 0, W, H);
    const LINK = 130;
    for (const p of pts) {
      if (!reduced) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
 if (p.y < 0 || p.y > H) p.vy *= -1;
        const dx = p.x - mouse.x, dy = p.y - mouse.y, d = Math.hypot(dx, dy);
        if (d < 120 && d > 0) { p.x += (dx / d) * 1.2; p.y += (dy / d) * 1.2; }
      }
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(200,210,255,.6)"; ctx.fill();
    }
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
 const a = pts[i], b = pts[j], d = Math.hypot(a.x - b.x, a.y - b.y);
 if (d < LINK) {
          ctx.strokeStyle = `rgba(124,92,255,${(1 - d / LINK) * 0.35})`;
   ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
 }
      }
      const m = Math.hypot(pts[i].x - mouse.x, pts[i].y - mouse.y);
      if (m < 200) {
 ctx.strokeStyle = `rgba(0,224,255,${(1 - m / 200) * 0.5})`;
        ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
      }
    }
  };
  const loop = () => { if (!document.hidden) draw(); requestAnimationFrame(loop); };
  resize();
  addEventListener("resize", () => { resize(); if (reduced) draw(); });
  reduced ? draw() : loop();
  addEventListener("pointermove", (e) => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
  document.addEventListener("pointerleave", () => { mouse.x = mouse.y = -9999; });

  /* ---------- Custom cursor ---------- */
  if (finePointer && !reduced) {
    const dot = $(".cursor-dot"), ring = $(".cursor-ring");
    let rx = 0, ry = 0, tx = 0, ty = 0;
    addEventListener("pointermove", (e) => {
      tx = e.clientX; ty = e.clientY;
      dot.style.transform = `translate(${tx}px,${ty}px) translate(-50%,-50%)`;
    }, { passive: true });
    const follow = () => {
      rx += (tx - rx) * 0.18; ry += (ty - ry) * 0.18;
      ring.style.transform = `translate(${rx}px,${ry}px) translate(-50%,-50%)`;
      requestAnimationFrame(follow);
    };
    follow();
    document.addEventListener("pointerover", (e) => {
      ring.classList.toggle("hover", !!e.target.closest("a, button, summary, label, .tilt"));
    });
  } else {
    $$(".cursor-dot, .cursor-ring").forEach((el) => el.remove());
  }

  /* ---------- Tilt + spotlight ---------- */
  $$(".tilt").forEach((el) => {
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      el.style.setProperty("--mx", `${px * 100}%`);
      el.style.setProperty("--my", `${py * 100}%`);
      if (finePointer && !reduced)
        el.style.transform = `perspective(1000px) rotateX(${(0.5 - py) * 8}deg) rotateY(${(px - 0.5) * 10}deg)`;
    });
    el.addEventListener("pointerleave", () => { el.style.transform = ""; });
  });

  /* ---------- Magnetic buttons ---------- */
  if (finePointer && !reduced) {
    $$(".magnetic").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
 const x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2;
 el.style.transform = `translate(${x * 0.25}px, ${y * 0.35}px)`;
      });
      el.addEventListener("pointerleave", () => { el.style.transform = ""; });
    });
  }

  /* ---------- Contact form (uniquement sur /contact/) ---------- */
  const form = $("#contact-form");
  if (form) {
    const setError = (input, errId, msg) => {
      const field = input.closest(".field") || input.closest(".consent");
      $("#" + errId).textContent = msg;
      if (msg) { field?.setAttribute("data-invalid", ""); input.setAttribute("aria-invalid", "true"); }
      else { field?.removeAttribute("data-invalid"); input.removeAttribute("aria-invalid"); }
      return !msg;
    };
    const validate = () => {
      const name = $("#f-name"), email = $("#f-email"), msg = $("#f-msg"), consent = $("#f-consent");
      const checks = [
 setError(name, "e-name", name.value.trim().length < 2 ? "Merci d'indiquer votre nom." : ""),
        setError(email, "e-email", !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim()) ? "Adresse e-mail invalide." : ""),
        setError(msg, "e-msg", msg.value.trim().length < 20 ? "Décrivez votre projet en au moins 20 caractères." : ""),
        setError(consent, "e-consent", !consent.checked ? "Votre accord est nécessaire pour vous répondre." : ""),
      ];
      return checks.every(Boolean);
    };
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!validate()) { $("[aria-invalid='true']", form)?.focus(); return; }
      const data = new FormData(form);
      const types = data.getAll("type").join(", ") || "Non précisé";
      const body = [
        `Nom : ${data.get("name")}`, `E-mail : ${data.get("email")}`,
        `Type de projet : ${types}`, `Budget : ${data.get("budget") || "Non précisé"}`, "", data.get("message"),
      ].join("\n");
      const subject = `Nouveau projet — ${data.get("name")}`;
      window.location.href = `mailto:${CONFIG.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      $(".form-body", form).hidden = true;
      $(".form-success", form).classList.add("show");
    });
    form.addEventListener("input", (e) => {
      if (e.target.getAttribute("aria-invalid") === "true") validate();
    });
  }
})();