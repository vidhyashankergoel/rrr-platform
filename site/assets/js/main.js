/* =============================================================================
   main.js — behaviour + renderers. Depends on data.js being loaded first.
   ============================================================================= */
(function () {
  "use strict";
  var NP = window.NP || {};
  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c];
    });
  };
  var cad = function (n) {
    return "$" + Number(n).toLocaleString("en-CA", { maximumFractionDigits: 0 });
  };

  /* ---------------- Theme ---------------- */
  var THEME_KEY = "np-theme";
  function readTheme() {
    try { return localStorage.getItem(THEME_KEY); } catch (e) { return null; }
  }
  function applyTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    var btn = $("#themeToggle");
    if (btn) {
      btn.setAttribute("aria-label", t === "dark" ? "Switch to light theme" : "Switch to dark theme");
      btn.innerHTML = t === "dark" ? ICON.sun : ICON.moon;
    }
  }
  function initTheme() {
    var saved = readTheme();
    var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    applyTheme(saved || (prefersDark ? "dark" : "light"));
    var btn = $("#themeToggle");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      applyTheme(next);
      try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
    });
  }

  /* ---------------- Icons ---------------- */
  var ICON = {
    sun:  '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    moon: '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
    menu: '<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>',
    close:'<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>'
  };
  var SVC_ICON = {
    cloud:   '<path d="M18 10h-1.3A5 5 0 1 0 7 12.1"/><path d="M18 10a4 4 0 0 1 0 8H7a4 4 0 0 1-.6-7.9"/>',
    move:    '<path d="M5 9V5h4M19 15v4h-4"/><path d="M5 5l6 6M19 19l-6-6"/><rect x="3" y="13" width="8" height="8" rx="1.5"/>',
    k8s:     '<path d="M12 2.6 20 7v10l-8 4.4L4 17V7z"/><circle cx="12" cy="12" r="2.6"/><path d="M12 9.4V5.2M14.6 13.5l3.2 2M9.4 13.5l-3.2 2"/>',
    mesh:    '<circle cx="12" cy="4.5" r="2"/><circle cx="4.8" cy="17" r="2"/><circle cx="19.2" cy="17" r="2"/><circle cx="12" cy="12" r="2.2"/><path d="M12 6.5v3.3M10.3 13.6 6.5 15.9M13.7 13.6l3.8 2.3"/>',
    code:    '<path d="m8 8-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14"/>',
    wrench:  '<path d="M14.5 6.2a4.5 4.5 0 0 0 5.9 5.9l-8.2 8.2a2.5 2.5 0 0 1-3.6-3.6z"/><path d="M14.5 6.2 17.8 3"/>',
    pipeline:'<circle cx="5" cy="6" r="2.2"/><circle cx="5" cy="18" r="2.2"/><circle cx="19" cy="12" r="2.2"/><path d="M7.2 6h5.3a4 4 0 0 1 4 4v.2M7.2 18h5.3a4 4 0 0 0 4-4v-.2"/>',
    git:     '<circle cx="6" cy="6" r="2.4"/><circle cx="6" cy="18" r="2.4"/><circle cx="18" cy="9" r="2.4"/><path d="M6 8.4v7.2M8.3 7.4A6 6 0 0 0 15.6 9.2M18 11.4c0 4-4 4.3-6 4.6"/>',
    chart:   '<path d="M3 3v16.5A1.5 1.5 0 0 0 4.5 21H21"/><path d="m7 15 3.5-4.5 3 3L19 7"/>',
    pulse:   '<path d="M3 12h3.5l2-6 4 12 2.5-6H21"/>',
    db:      '<ellipse cx="12" cy="5.5" rx="8" ry="3"/><path d="M4 5.5v13c0 1.7 3.6 3 8 3s8-1.3 8-3v-13"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
    layers:  '<path d="m12 2.8 9 4.6-9 4.6-9-4.6z"/><path d="m3 12.4 9 4.6 9-4.6M3 17l9 4.6L21 17"/>',
    brain:   '<path d="M9.5 3.5A3 3 0 0 0 6.6 7 3 3 0 0 0 5 9.8a3 3 0 0 0 1.4 2.6A3 3 0 0 0 6 15a3 3 0 0 0 3 3h.5V3.5z"/><path d="M14.5 3.5A3 3 0 0 1 17.4 7 3 3 0 0 1 19 9.8a3 3 0 0 1-1.4 2.6A3 3 0 0 1 18 15a3 3 0 0 1-3 3h-.5V3.5z"/><path d="M12 3v18"/>',
    shield:  '<path d="M12 2.6 20 6v6.2c0 4.6-3.3 7.9-8 9.2-4.7-1.3-8-4.6-8-9.2V6z"/><path d="m8.8 12 2.2 2.2 4.2-4.4"/>',
    coins:   '<ellipse cx="9" cy="6.5" rx="6" ry="2.8"/><path d="M3 6.5v4c0 1.5 2.7 2.8 6 2.8s6-1.3 6-2.8v-4"/><path d="M15 11.2c3.3 0 6 1.3 6 2.8v4c0 1.5-2.7 2.8-6 2.8s-6-1.3-6-2.8v-3"/>',
    alert:   '<path d="M12 3.3 22 20H2z"/><path d="M12 9.5v4.2M12 17h.01"/>'
  };
  function svcIcon(k) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
           (SVC_ICON[k] || SVC_ICON.cloud) + '</svg>';
  }

  /* ---------------- Header / nav ---------------- */
  function initNav() {
    var header = $(".site-header");
    if (header) {
      var onScroll = function () { header.classList.toggle("is-stuck", window.scrollY > 8); };
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
    }
    var toggle = $("#navToggle"), links = $("#navLinks");
    if (toggle && links) {
      toggle.innerHTML = ICON.menu;
      toggle.addEventListener("click", function () {
        var open = links.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", String(open));
        toggle.innerHTML = open ? ICON.close : ICON.menu;
      });
      links.addEventListener("click", function (e) {
        if (e.target.tagName === "A" && links.classList.contains("is-open")) {
          links.classList.remove("is-open");
          toggle.setAttribute("aria-expanded", "false");
          toggle.innerHTML = ICON.menu;
        }
      });
    }
    // mark current page
    var here = location.pathname.split("/").pop() || "index.html";
    $$(".nav__links a").forEach(function (a) {
      var href = a.getAttribute("href");
      if (href === here || (here === "index.html" && href === "index.html")) {
        a.setAttribute("aria-current", "page");
      }
    });
  }

  /* ---------------- Reveal on scroll ---------------- */
  function initReveal() {
    var els = $$(".reveal");
    if (!els.length) return;
    if (!("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("is-in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    els.forEach(function (el, i) {
      el.style.transitionDelay = (Math.min(i % 4, 3) * 70) + "ms";
      io.observe(el);
    });
  }

  /* ---------------- Animated counters ---------------- */
  function initCounters() {
    var els = $$("[data-count]");
    if (!els.length || !("IntersectionObserver" in window)) return;
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target, target = parseFloat(el.dataset.count);
        var suffix = el.dataset.suffix || "", prefix = el.dataset.prefix || "";
        var dec = (el.dataset.decimals | 0);
        io.unobserve(el);
        if (reduce) { el.textContent = prefix + target.toFixed(dec) + suffix; return; }
        var start = performance.now(), dur = 1400;
        (function step(now) {
          var p = Math.min((now - start) / dur, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = prefix + (target * eased).toFixed(dec) + suffix;
          if (p < 1) requestAnimationFrame(step);
        })(start);
      });
    }, { threshold: 0.5 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------------- Hero terminal typing ---------------- */
  function initTerminal() {
    var body = $("#termBody");
    if (!body) return;
    var lines = [
      ['c-mut', '# provision the platform, not the ticket'],
      ['c-cmd', '$ terraform apply -var-file=env/prod.tfvars'],
      ['c-ok',  'Apply complete. 148 added, 0 changed, 0 destroyed.'],
      ['c-cmd', '$ kubectl get nodes -o wide'],
      ['c-key', 'NAME                 STATUS   ROLES    VERSION'],
      ['c-mut', 'ip-10-0-2-41         Ready    worker   v1.31.4'],
      ['c-mut', 'ip-10-0-3-17         Ready    worker   v1.31.4'],
      ['c-mut', 'ip-10-0-4-88         Ready    worker   v1.31.4'],
      ['c-cmd', '$ argocd app list'],
      ['c-ok',  'payments      Synced   Healthy   canary 25%'],
      ['c-ok',  'checkout      Synced   Healthy   stable'],
      ['c-ok',  'observability Synced   Healthy   stable'],
      ['c-cmd', '$ promtool check slo --burn-rate'],
      ['c-ok',  'SLO 99.9% · error budget 96.2% remaining · no alerts firing'],
      ['c-mut', '# zero downtime. every change reviewed in git.']
    ];
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      body.innerHTML = lines.map(function (l) {
        return '<div class="' + l[0] + '">' + esc(l[1]) + "</div>";
      }).join("");
      return;
    }
    var i = 0;
    (function next() {
      if (i >= lines.length) return;
      var d = document.createElement("div");
      d.className = lines[i][0];
      d.textContent = lines[i][1];
      body.appendChild(d);
      body.scrollTop = body.scrollHeight;
      i++;
      setTimeout(next, 90 + Math.random() * 170);
    })();
  }

  /* ---------------- Service rendering ---------------- */
  function priceLabel(s) {
    if (s.unit && s.unit.indexOf("%") > -1) return cad(s.from) + " + share of savings";
    if (s.from === s.to) return "from " + cad(s.from);
    return cad(s.from) + " – " + cad(s.to);
  }

  function serviceCard(s) {
    return '' +
      '<article class="card card--hover reveal" data-cat="' + esc(s.cat) + '" data-term="' + esc(s.term) + '">' +
        '<div class="card__icon">' + svcIcon(s.icon) + '</div>' +
        (s.featured ? '<span class="tag tag--accent" style="position:absolute;top:1rem;right:1rem">Popular</span>' : '') +
        '<h3>' + esc(s.name) + '</h3>' +
        '<p>' + esc(s.blurb) + '</p>' +
        '<ul class="check-list">' + s.includes.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + '</ul>' +
        '<div class="tags" style="margin-bottom:1rem">' +
          s.stack.slice(0, 6).map(function (t) { return '<span class="tag">' + esc(t) + "</span>"; }).join("") +
        '</div>' +
        '<div style="display:flex;justify-content:space-between;gap:1rem;flex-wrap:wrap;padding-top:1rem;border-top:1px solid var(--line-soft)">' +
          '<div><div class="num">' + priceLabel(s) + '</div>' +
          '<div style="font-size:.78rem;color:var(--text-3)">CAD, excl. tax</div></div>' +
          '<div style="text-align:right"><div class="num">' + esc(s.duration) + '</div>' +
          '<div style="font-size:.78rem;color:var(--text-3)">typical duration</div></div>' +
        '</div>' +
      '</article>';
  }

  function renderServices() {
    var grid = $("#servicesGrid");
    if (!grid || !NP.services) return;
    var limit = parseInt(grid.dataset.limit || "0", 10);
    var list = limit ? NP.services.filter(function (s) { return s.featured; }).slice(0, limit) : NP.services;
    grid.innerHTML = list.map(serviceCard).join("");

    var chips = $$(".chip[data-filter]");
    chips.forEach(function (c) {
      c.addEventListener("click", function () {
        chips.forEach(function (o) { o.setAttribute("aria-pressed", "false"); });
        c.setAttribute("aria-pressed", "true");
        var f = c.dataset.filter;
        var shown = 0;
        $$("#servicesGrid > .card").forEach(function (card) {
          var ok = f === "all" || card.dataset.cat === f || card.dataset.term === f;
          card.hidden = !ok;
          if (ok) shown++;
        });
        var live = $("#filterStatus");
        if (live) live.textContent = shown + (shown === 1 ? " service" : " services") + " shown.";
      });
    });
  }

  /* ---------------- Rate table ---------------- */
  function renderRates() {
    var tb = $("#rateTable tbody");
    if (!tb || !NP.rates) return;
    tb.innerHTML = NP.rates.map(function (r) {
      return "<tr><td><strong>" + esc(r.role) + "</strong></td>" +
             '<td class="num">' + esc(r.rate) + " / hr</td>" +
             "<td>" + esc(r.note) + "</td></tr>";
    }).join("");
  }

  /* ---------------- Retainers ---------------- */
  function renderRetainers() {
    var el = $("#retainerGrid");
    if (!el || !NP.retainers) return;
    el.innerHTML = NP.retainers.map(function (r) {
      return '<article class="card price-card reveal' + (r.featured ? " price-card--featured" : "") + '">' +
        "<h3>" + esc(r.name) + "</h3>" +
        '<p style="font-size:.9rem">' + esc(r.blurb) + "</p>" +
        '<div class="price">' + cad(r.price) + " <small>CAD " + esc(r.unit) + "</small></div>" +
        '<ul class="check-list">' + r.items.map(function (i) { return "<li>" + esc(i) + "</li>"; }).join("") + "</ul>" +
        '<p style="font-size:.78rem;color:var(--text-3)">' + esc(r.term) + "</p>" +
        '<a class="btn btn--' + (r.featured ? "primary" : "ghost") + '" href="contact.html?plan=' +
          encodeURIComponent(r.name) + '">Discuss ' + esc(r.name) + "</a>" +
      "</article>";
    }).join("");
  }

  /* ---------------- Estimator ---------------- */
  function initEstimator() {
    var opts = $("#estOpts");
    if (!opts || !NP.estimatorItems) return;
    opts.innerHTML = NP.estimatorItems.map(function (it) {
      return '<label class="opt">' +
        '<input type="checkbox" value="' + esc(it.id) + '" data-low="' + it.low + '" data-high="' + it.high + '" data-weeks="' + it.weeks + '">' +
        '<span><span class="opt__name">' + esc(it.label) + "</span>" +
        '<span class="opt__meta">' + cad(it.low) + " – " + cad(it.high) + " · ~" + it.weeks + " weeks</span></span></label>";
    }).join("");

    var urgency = $("#estUrgency"), support = $("#estSupport");

    function recalc() {
      var picked = $$("#estOpts input:checked");
      var low = 0, high = 0, weeks = 0;
      picked.forEach(function (i) {
        low  += +i.dataset.low;
        high += +i.dataset.high;
        weeks = Math.max(weeks, +i.dataset.weeks) + (+i.dataset.weeks) * 0.45;
      });
      weeks = Math.ceil(weeks);
      var mult = urgency ? parseFloat(urgency.value) : 1;
      low = Math.round(low * mult); high = Math.round(high * mult);
      if (mult > 1) weeks = Math.max(2, Math.round(weeks * 0.75));

      var retainer = support ? parseInt(support.value, 10) : 0;

      var out = $("#estOut");
      if (!picked.length) {
        out.innerHTML = '<p style="margin:0;color:var(--text-3)">Select one or more outcomes to see an indicative range.</p>';
        return;
      }
      var lines = picked.map(function (i) {
        var item = NP.estimatorItems.filter(function (x) { return x.id === i.value; })[0];
        return '<div class="est__line"><span>' + esc(item.label) + "</span><span>" +
               cad(Math.round(item.low * mult)) + "–" + cad(Math.round(item.high * mult)) + "</span></div>";
      }).join("");

      out.innerHTML =
        '<div class="est__total">' + cad(low) + " – " + cad(high) + "</div>" +
        '<p style="font-size:.8rem;color:var(--text-3);margin:.3rem 0 1rem">CAD, excluding applicable GST/HST</p>' +
        lines +
        (mult > 1 ? '<div class="est__line"><span>Accelerated delivery uplift</span><span>included above</span></div>' : "") +
        '<div class="est__line" style="border-bottom:0;padding-top:.8rem"><span><strong>Indicative timeline</strong></span><span>' +
          weeks + " weeks</span></div>" +
        (retainer ? '<div class="est__line" style="border-bottom:0"><span><strong>Ongoing support</strong></span><span>' +
          cad(retainer) + " / month</span></div>" : "") +
        '<a class="btn btn--primary btn--sm" style="width:100%;margin-top:1.2rem" href="contact.html?est=' +
          encodeURIComponent(picked.map(function (p) { return p.value; }).join(",")) +
          '">Get a firm quote</a>' +
        '<p style="font-size:.74rem;color:var(--text-3);margin:.9rem 0 0">Indicative only. A firm fixed price follows a free 30-minute scoping call — it is not a quote or an offer.</p>';
    }

    opts.addEventListener("change", recalc);
    if (urgency) urgency.addEventListener("change", recalc);
    if (support) support.addEventListener("change", recalc);
    recalc();
  }

  /* ---------------- Case studies ---------------- */
  function renderCases() {
    var el = $("#caseList");
    if (!el || !NP.cases) return;
    var limit = parseInt(el.dataset.limit || "0", 10);
    var list = limit ? NP.cases.slice(0, limit) : NP.cases;
    el.innerHTML = list.map(function (c, idx) {
      return '<article class="card reveal" style="padding:clamp(1.5rem,3vw,2.5rem)">' +
        '<div class="tags" style="margin-bottom:1rem">' +
          '<span class="tag tag--accent">' + esc(c.sector) + "</span>" +
          '<span class="tag">' + esc(c.period) + "</span>" +
        "</div>" +
        "<h3>" + esc(c.client) + "</h3>" +
        '<p style="font-size:.8rem;color:var(--text-3);margin-top:-.5rem">' + esc(c.via) + "</p>" +
        '<p style="font-size:var(--step-1);color:var(--text);font-weight:600;line-height:1.4">' + esc(c.headline) + "</p>" +
        '<div class="split" style="gap:2rem;align-items:start;margin-top:1.5rem">' +
          "<div><h4 style=\"font-size:.82rem;letter-spacing:.1em;text-transform:uppercase;color:var(--text-3)\">The situation</h4>" +
          "<p>" + esc(c.problem) + "</p>" +
          "<h4 style=\"font-size:.82rem;letter-spacing:.1em;text-transform:uppercase;color:var(--text-3)\">What we did</h4>" +
          "<ul>" + c.work.map(function (w) { return "<li>" + esc(w) + "</li>"; }).join("") + "</ul></div>" +
          '<div><div class="stats" style="grid-template-columns:1fr 1fr;gap:1.25rem">' +
            c.results.map(function (r) {
              return '<div><div class="stat__num" style="font-size:1.65rem">' + esc(r[0]) + "</div>" +
                     '<div class="stat__label">' + esc(r[1]) + "</div></div>";
            }).join("") +
          "</div>" +
          '<div class="tags" style="margin-top:1.5rem">' +
            c.stack.map(function (t) { return '<span class="tag">' + esc(t) + "</span>"; }).join("") +
          "</div></div>" +
        "</div>" +
      "</article>";
    }).join("");
  }

  /* ---------------- People ---------------- */
  function renderPeople() {
    var el = $("#peopleGrid");
    if (!el || !NP.people) return;
    var pub = NP.people.filter(function (p) { return p.published; });
    el.innerHTML = pub.map(function (p) {
      var initials = p.name.split(/\s+/).map(function (w) { return w[0]; }).slice(0, 2).join("");
      return '<article class="card reveal">' +
        '<div style="width:64px;height:64px;border-radius:50%;display:grid;place-items:center;background:var(--brand-700);color:#fff;font-weight:800;font-size:1.3rem;margin-bottom:1rem">' +
          esc(initials) + "</div>" +
        "<h3 style=\"margin-bottom:.15rem\">" + esc(p.name) + "</h3>" +
        '<p style="color:var(--accent-500);font-weight:650;margin-bottom:.15rem">' + esc(p.role) + "</p>" +
        '<p style="font-size:.82rem;color:var(--text-3)">' + esc(p.location) + "</p>" +
        "<p>" + esc(p.bio) + "</p>" +
        (p.certs && p.certs.length
          ? '<div class="tags">' + p.certs.map(function (c) { return '<span class="tag tag--accent">' + esc(c) + "</span>"; }).join("") + "</div>"
          : "") +
      "</article>";
    }).join("");
    var note = $("#peopleCount");
    if (note) {
      var hidden = NP.people.length - pub.length;
      note.textContent = hidden
        ? hidden + " further team member profile(s) are held in data.js pending written consent to publish."
        : "";
    }
  }

  /* ---------------- FAQ ---------------- */
  function renderFaq() {
    var el = $("#faqList");
    if (!el || !NP.faq) return;
    el.innerHTML = NP.faq.map(function (f) {
      return '<details class="acc"><summary>' + esc(f.q) + "</summary>" +
             '<div class="acc__body"><p>' + esc(f.a) + "</p></div></details>";
    }).join("");
  }

  /* ---------------- Company constants into DOM ---------------- */
  function hydrateCompany() {
    var c = NP.company || {};
    $$("[data-np]").forEach(function (el) {
      var k = el.dataset.np;
      if (c[k] == null) return;
      if (el.tagName === "A") {
        if (k === "email") { el.href = "mailto:" + c.email; el.textContent = el.textContent.trim() || c.email; }
        else if (k === "phone") { el.href = "tel:" + c.phoneHref; el.textContent = el.textContent.trim() || c.phone; }
        else { el.href = c[k]; }
      } else {
        el.textContent = c[k];
      }
    });
    var y = $("#year"); if (y) y.textContent = new Date().getFullYear();
  }

  /* ---------------- Contact form ---------------- */
  function initForm() {
    var form = $("#contactForm");
    if (!form) return;

    // prefill from query string (estimator / plan links)
    var qs = new URLSearchParams(location.search);
    var msg = $("#cf-message");
    var pre = [];
    if (qs.get("plan")) pre.push("Interested in the " + qs.get("plan") + " retainer.");
    if (qs.get("est")) {
      var ids = qs.get("est").split(",");
      var names = (NP.estimatorItems || []).filter(function (i) { return ids.indexOf(i.id) > -1; })
                    .map(function (i) { return "• " + i.label; });
      if (names.length) pre.push("Scope selected in the estimator:\n" + names.join("\n"));
    }
    if (qs.get("service")) pre.push("Enquiry about: " + qs.get("service"));
    if (pre.length && msg && !msg.value) msg.value = pre.join("\n\n") + "\n\n";

    var status = $("#formStatus");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      // honeypot
      if (form.querySelector('[name="_gotcha"]').value) return;

      var fd = new FormData(form);
      var endpoint = (NP.company && NP.company.formEndpoint) || "";

      function show(kind, text) {
        status.className = "form-status form-status--" + kind;
        status.textContent = text;
        status.hidden = false;
        status.scrollIntoView({ block: "center", behavior: "smooth" });
      }

      if (!endpoint) {
        // No backend configured — fall back to the user's mail client.
        var body = [];
        fd.forEach(function (v, k) { if (k[0] !== "_" && v) body.push(k + ": " + v); });
        var href = "mailto:" + NP.company.email +
          "?subject=" + encodeURIComponent("Website enquiry — " + (fd.get("company") || fd.get("name") || "")) +
          "&body=" + encodeURIComponent(body.join("\n"));
        window.location.href = href;
        show("ok", "Opening your email client. If nothing happens, email " + NP.company.email + " directly.");
        return;
      }

      var btn = form.querySelector('[type="submit"]');
      btn.disabled = true; btn.textContent = "Sending…";
      fetch(endpoint, { method: "POST", body: fd, headers: { Accept: "application/json" } })
        .then(function (r) {
          if (!r.ok) throw new Error("bad status " + r.status);
          form.reset();
          show("ok", "Thank you — your message has been received. We reply within one business day.");
        })
        .catch(function () {
          show("err", "Something went wrong sending the form. Please email " + NP.company.email + " or call " + NP.company.phone + ".");
        })
        .finally(function () { btn.disabled = false; btn.textContent = "Send enquiry"; });
    });
  }

  /* ---------------- Boot ---------------- */
  function boot() {
    initTheme();
    initNav();
    hydrateCompany();
    renderServices();
    renderRates();
    renderRetainers();
    renderCases();
    renderPeople();
    renderFaq();
    initEstimator();
    initForm();
    initTerminal();
    initCounters();
    initReveal();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
