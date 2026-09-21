/* =============================================================================
   assistant.js — customer-facing AI assistant ("Ada").

   Runs in TWO modes:
     1) LOCAL (default) — no backend, no account, no running cost. Retrieval
        over the site's own catalogue in data.js. Always available, never
        invents a price, works offline and on any static host.
     2) HOSTED — set NP.company.aiEndpoint to a URL that proxies a language
        model (see README). The local knowledge base is sent as context so the
        model answers from your real catalogue rather than from guesswork.
        Put nothing confidential in this file — it is served publicly. The
        proxy holds the provider token server-side.
   ============================================================================= */
(function () {
  "use strict";
  var NP = window.NP || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var esc = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };
  var cad = function (n) { return "$" + Number(n).toLocaleString("en-CA", { maximumFractionDigits: 0 }); };

  var SVG = {
    bot:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="7.5" width="17" height="12" rx="3"/><path d="M12 7.5V4M8.5 13h.01M15.5 13h.01M9.5 16.5h5"/><circle cx="12" cy="3" r="1.3"/></svg>',
    close:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m4 12 16-8-5.5 16L11 13z"/></svg>',
    spark:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.5 13.7 9l5.5 1.7-5.5 1.7L12 18l-1.7-5.6L4.8 10.7 10.3 9z"/><path d="M18.5 3.5v3M20 5h-3"/></svg>'
  };

  /* ------------------------------------------------------------------
     Knowledge base — built from data.js so it can never drift away from
     the published prices.
     ------------------------------------------------------------------ */
  function buildKB() {
    var kb = [];
    var c = NP.company || {};

    (NP.services || []).forEach(function (s) {
      var price = (s.unit && s.unit.indexOf("%") > -1)
        ? cad(s.from) + " plus 20% of verified 12-month savings"
        : (s.from === s.to ? "from " + cad(s.from) : cad(s.from) + " to " + cad(s.to));
      kb.push({
        key: s.id,
        terms: (s.name + " " + s.blurb + " " + s.stack.join(" ") + " " + s.includes.join(" ") + " " + s.cat).toLowerCase(),
        title: s.name,
        answer:
          "<p><strong>" + esc(s.name) + "</strong><br>" + esc(s.blurb) + "</p>" +
          "<p><strong>Typical price:</strong> " + esc(price) + " CAD, excluding tax.<br>" +
          "<strong>Typical duration:</strong> " + esc(s.duration) + "</p>" +
          "<p>That normally includes:</p><ul>" +
            s.includes.slice(0, 4).map(function (i) { return "<li>" + esc(i) + "</li>"; }).join("") +
          "</ul>" +
          '<p><a href="services.html#' + esc(s.id) + '">Full detail on the services page</a> &middot; ' +
          '<a href="contact.html?service=' + encodeURIComponent(s.name) + '">Ask for a firm quote</a></p>'
      });
    });

    (NP.faq || []).forEach(function (f, i) {
      kb.push({
        key: "faq" + i,
        terms: (f.q + " " + f.a).toLowerCase(),
        title: f.q,
        answer: "<p>" + esc(f.a) + "</p>"
      });
    });

    (NP.cases || []).forEach(function (cs) {
      kb.push({
        key: "case-" + cs.client,
        terms: (cs.client + " " + cs.sector + " " + cs.headline + " " + cs.problem + " " + cs.stack.join(" ")).toLowerCase(),
        title: cs.client,
        answer:
          "<p><strong>" + esc(cs.client) + "</strong> &mdash; " + esc(cs.sector) + ", " + esc(cs.period) + "</p>" +
          "<p>" + esc(cs.headline) + "</p><ul>" +
          cs.results.map(function (r) { return "<li><strong>" + esc(r[0]) + "</strong> &mdash; " + esc(r[1]) + "</li>"; }).join("") +
          '</ul><p><a href="case-studies.html">Read the full case study</a></p>'
      });
    });

    kb.push({
      key: "retainers",
      terms: "retainer support ongoing monthly managed maintenance on-call sla 24/7 aftercare",
      title: "Ongoing support",
      answer: "<p>Three ongoing support tiers, all in CAD per month:</p><ul>" +
        (NP.retainers || []).map(function (r) {
          return "<li><strong>" + esc(r.name) + "</strong> &mdash; " + cad(r.price) + esc(r.unit) + ". " + esc(r.blurb) + "</li>";
        }).join("") +
        '</ul><p><a href="pricing.html#retainers">Compare the tiers</a></p>'
    });

    kb.push({
      key: "rates",
      terms: "hourly rate rates day rate time and materials staff augmentation contractor cost per hour how much per hour",
      title: "Hourly rates",
      answer: "<p>For open-ended or advisory work we bill time-and-materials against this rate card (CAD per hour, excl. tax):</p><ul>" +
        (NP.rates || []).slice(0, 5).map(function (r) { return "<li><strong>" + esc(r.role) + "</strong> &mdash; " + esc(r.rate) + "</li>"; }).join("") +
        '</ul><p>Wherever scope can be pinned down we prefer a fixed price, so the delivery risk sits with us. <a href="pricing.html#rates">Full rate card</a></p>'
    });

    kb.push({
      key: "contact",
      terms: "contact reach call email phone talk speak book meeting consultation discovery call get in touch quote",
      title: "Getting in touch",
      answer: "<p>Easiest is the free 30-minute scoping call &mdash; no charge, no obligation, and you leave with an indicative range either way.</p><ul>" +
        '<li>Email: <a href="mailto:' + esc(c.email) + '">' + esc(c.email) + "</a></li>" +
        '<li>Phone: <a href="tel:' + esc(c.phoneHref) + '">' + esc(c.phone) + "</a></li>" +
        '<li>LinkedIn: <a href="' + esc(c.linkedin) + '" target="_blank" rel="noopener">connect here</a></li>' +
        "</ul><p>" + esc(c.hours) + '. <a href="contact.html">Contact page</a></p>'
    });

    kb.push({
      key: "audit",
      terms: "audit assessment review health check cheap small start trial first step try you out low risk pilot",
      title: "Infrastructure audit",
      answer: "<p>The smallest way to start is a <strong>fixed-price infrastructure audit &mdash; $4,500 CAD, five business days</strong>.</p>" +
        "<p>You get a written report covering security exposure, cost waste with dollar figures attached, reliability risk, and a prioritised remediation plan. No obligation to continue, and the report is yours regardless.</p>" +
        '<p><a href="contact.html?service=Infrastructure%20Audit">Book an audit</a></p>'
    });

    kb.push({
      key: "process",
      terms: "process how do you work engagement steps onboarding what happens methodology timeline start",
      title: "How engagements run",
      answer: "<p>Five steps, always the same:</p><ul>" +
        "<li><strong>1 &middot; Scoping call</strong> &mdash; 30 minutes, free.</li>" +
        "<li><strong>2 &middot; Discovery</strong> &mdash; we read the actual repository and infrastructure before proposing anything.</li>" +
        "<li><strong>3 &middot; Fixed proposal</strong> &mdash; scope, price, timeline, named engineers, acceptance criteria.</li>" +
        "<li><strong>4 &middot; Delivery</strong> &mdash; in your repositories, in weekly increments you can see.</li>" +
        "<li><strong>5 &middot; Handover</strong> &mdash; documentation and recorded sessions. A retainer afterwards is optional, never required.</li>" +
        '</ul><p><a href="index.html#process">More on the process</a></p>'
    });

    kb.push({
      key: "lockin",
      terms: "lock in ownership who owns code ip intellectual property leave exit vendor lock-in handover proprietary",
      title: "Ownership and lock-in",
      answer: "<p>Everything we build lives in <strong>your</strong> repositories and <strong>your</strong> cloud accounts, with documentation and recorded handover sessions. No proprietary wrapper, and nothing that only we can operate.</p>" +
        "<p>The test we hold ourselves to: your team should be able to run it without us the day we leave.</p>"
    });

    kb.push({
      key: "location",
      terms: "where based location canada toronto ontario remote onsite timezone office incorporated canadian",
      title: "Where we are",
      answer: "<p>Toronto, Ontario. Most delivery is remote across North American time zones, with on-site available in the Greater Toronto Area for workshops, cutovers and discovery.</p>" +
        "<p>Canadian-incorporated, comfortable with standard Canadian procurement terms, and eligible for Reliability Status clearance work.</p>"
    });

    kb.push({
      key: "assurance",
      terms: "compliance soc2 soc 2 iso 27001 pci pipeda regulated bank government audit evidence insurance liability msa nda coverage",
      title: "Compliance and contracting",
      answer: "<p>Prior delivery includes banking (Citibank), insurance (RSA) and critical aviation infrastructure (GTAA), all under regulated change control.</p>" +
        "<p>We map controls to CIS Benchmarks, SOC 2, ISO 27001 or PCI-DSS as your obligations require, sign client MSAs, NDAs and DPAs, and carry commercial general liability, professional liability and cyber coverage &mdash; certificates provided on request.</p>"
    });

    return kb;
  }

  /* --------------- small retrieval scorer --------------- */
  var STOP = "a an the is are do does can you your we our i me my of for to in on with and or how what when which that this it".split(" ");
  function score(q, entry) {
    var words = q.toLowerCase().replace(/[^a-z0-9+\s-]/g, " ").split(/\s+/)
                 .filter(function (w) { return w.length > 2 && STOP.indexOf(w) === -1; });
    if (!words.length) return 0;
    var s = 0;
    words.forEach(function (w) {
      if (entry.terms.indexOf(w) > -1) s += 1;
      if (entry.title.toLowerCase().indexOf(w) > -1) s += 1.6;
    });
    return s / words.length;
  }

  function localAnswer(q, kb) {
    var ranked = kb.map(function (e) { return { e: e, s: score(q, e) }; })
                   .sort(function (a, b) { return b.s - a.s; });
    var best = ranked[0];
    if (!best || best.s < 0.34) {
      return {
        html: "<p>I am not certain I have that one. I answer from our published service catalogue, pricing and case studies, so I would rather say so than guess.</p>" +
              "<p>Try asking about Kubernetes, cloud migration, Terraform, CI/CD, observability, databases, security or pricing &mdash; or go straight to a human:</p>" +
              '<p><a href="contact.html">Book a free 30-minute scoping call</a> &middot; <a href="mailto:' +
              esc((NP.company || {}).email) + '">email us</a></p>'
      };
    }
    var out = best.e.answer;
    var second = ranked[1];
    if (second && second.s > 0.42 && second.e.key !== best.e.key) {
      out += '<p style="font-size:.8rem;opacity:.75">Also relevant: <strong>' + esc(second.e.title) + "</strong> &mdash; just ask.</p>";
    }
    return { html: out };
  }

  /* --------------- UI --------------- */
  var SUGGESTIONS = [
    "What does a Kubernetes build cost?",
    "Can you migrate us off on-prem?",
    "How do you price?",
    "What is the smallest way to start?",
    "Who have you worked with?",
    "Do we get locked in?",
    "Can you migrate our database?",
    "Do you do observability?"
  ];

  var kb, log, input, panel, launcher, sendBtn, turns = 0, offeredLead = false;

  function mount() {
    if ($("#aiLaunch")) return;

    launcher = document.createElement("button");
    launcher.id = "aiLaunch";
    launcher.className = "ai-launch";
    launcher.type = "button";
    launcher.setAttribute("aria-haspopup", "dialog");
    launcher.setAttribute("aria-expanded", "false");
    launcher.setAttribute("aria-controls", "aiPanel");
    launcher.innerHTML = SVG.spark + "<span>Ask Ada</span><i class=\"ai-launch__ping\"></i>";

    panel = document.createElement("div");
    panel.id = "aiPanel";
    panel.className = "ai-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "false");
    panel.setAttribute("aria-label", "Ada, automated assistant");
    panel.hidden = true;
    panel.innerHTML =
      '<div class="ai-head">' +
        '<div class="ai-head__avatar">' + SVG.bot + "</div>" +
        '<div><strong>Ada</strong><span><i class="dot" style="background:#3ddba4"></i> Automated assistant &middot; answers instantly</span></div>' +
        '<button type="button" id="aiClose" aria-label="Close assistant">' + SVG.close + "</button>" +
      "</div>" +
      '<div class="ai-log" id="aiLog" role="log" aria-live="polite" aria-atomic="false"></div>' +
      '<div class="ai-chips" id="aiChips"></div>' +
      '<form class="ai-form" id="aiForm">' +
        '<label class="visually-hidden" for="aiInput">Your question</label>' +
        '<textarea id="aiInput" rows="1" placeholder="Ask about services, pricing, timelines..." autocomplete="off"></textarea>' +
        '<button type="submit" id="aiSend" aria-label="Send message">' + SVG.send + "</button>" +
      "</form>" +
      '<p class="ai-foot">Ada is automated and can be wrong. Prices shown are indicative and are not an offer. For anything binding, <a href="contact.html">talk to a human</a>.</p>';

    document.body.appendChild(launcher);
    document.body.appendChild(panel);

    log = $("#aiLog"); input = $("#aiInput"); sendBtn = $("#aiSend");

    renderChips();

    launcher.addEventListener("click", open);
    $("#aiClose").addEventListener("click", close);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && panel.classList.contains("is-open")) close();
    });
    $("#aiForm").addEventListener("submit", function (e) { e.preventDefault(); submit(); });
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
    });
    input.addEventListener("input", function () {
      input.style.height = "auto";
      input.style.height = Math.min(input.scrollHeight, 110) + "px";
    });

    restore();
  }

  function renderChips(list) {
    var el = $("#aiChips");
    if (!el) return;
    var items = list || SUGGESTIONS.slice(0, 3);
    el.innerHTML = items.map(function (s) {
      return '<button type="button">' + esc(s) + "</button>";
    }).join("");
    Array.prototype.forEach.call(el.querySelectorAll("button"), function (b) {
      b.addEventListener("click", function () { input.value = b.textContent; submit(); });
    });
  }

  function open() {
    panel.hidden = false;
    requestAnimationFrame(function () { panel.classList.add("is-open"); });
    launcher.hidden = true;
    launcher.setAttribute("aria-expanded", "true");
    setTimeout(function () { input.focus(); }, 260);
    if (!log.children.length) {
      push("bot",
        "<p>Hi &mdash; I am Ada, the automated assistant for <strong>" + esc((NP.company || {}).shortName) + "</strong>.</p>" +
        "<p>I can tell you what we build, what it typically costs in CAD, how long it takes, and who we have done it for. Ask me anything, or pick one below.</p>", true);
      renderChips();
    }
  }

  function close() {
    panel.classList.remove("is-open");
    launcher.hidden = false;
    launcher.setAttribute("aria-expanded", "false");
    var ping = launcher.querySelector(".ai-launch__ping");
    if (ping) ping.remove();
    setTimeout(function () { panel.hidden = true; }, 260);
    launcher.focus();
  }

  function push(who, html, skipSave) {
    var d = document.createElement("div");
    d.className = "ai-msg ai-msg--" + who;
    d.innerHTML = '<div class="ai-msg__bubble">' + html + "</div>";
    log.appendChild(d);
    log.scrollTop = log.scrollHeight;
    if (!skipSave) save();
    return d;
  }

  function typing() {
    var d = document.createElement("div");
    d.className = "ai-msg ai-msg--bot";
    d.innerHTML = '<div class="ai-msg__bubble ai-typing"><i></i><i></i><i></i></div>';
    log.appendChild(d);
    log.scrollTop = log.scrollHeight;
    return d;
  }

  function submit() {
    var q = input.value.trim();
    if (!q) return;
    push("user", esc(q));
    input.value = "";
    input.style.height = "auto";
    sendBtn.disabled = true;
    turns++;

    var t = typing();
    var endpoint = (NP.company || {}).aiEndpoint || "";

    function finish(html) {
      t.remove();
      push("bot", html);
      sendBtn.disabled = false;
      // After a few exchanges, hand off to a human. That is the point of the widget.
      if (turns >= 3 && !offeredLead) {
        offeredLead = true;
        setTimeout(function () {
          push("bot",
            "<p>If it would be quicker, a human can take it from here. The 30-minute scoping call is free and you leave with an indicative range either way.</p>" +
            '<p><a href="contact.html">Book the call</a> &middot; <a href="tel:' + esc((NP.company || {}).phoneHref) + '">' +
            esc((NP.company || {}).phone) + "</a></p>");
        }, 700);
      }
      renderChips(SUGGESTIONS.slice().sort(function () { return Math.random() - 0.5; }).slice(0, 3));
    }

    if (endpoint) {
      var context = kb.slice(0, 40).map(function (e) { return e.title + ": " + e.terms.slice(0, 260); }).join("\n");
      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, context: context })
      })
        .then(function (r) { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
        .then(function (j) { finish(j.answer || localAnswer(q, kb).html); })
        .catch(function () { finish(localAnswer(q, kb).html); });
    } else {
      setTimeout(function () { finish(localAnswer(q, kb).html); }, 420 + Math.random() * 380);
    }
  }

  /* --------------- transcript persistence (this browser tab only) --------------- */
  function save() {
    try { sessionStorage.setItem("np-ada", log.innerHTML); } catch (e) {}
  }
  function restore() {
    try {
      var s = sessionStorage.getItem("np-ada");
      if (s) { log.innerHTML = s; log.scrollTop = log.scrollHeight; }
    } catch (e) {}
  }

  function boot() {
    kb = buildKB();
    mount();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
