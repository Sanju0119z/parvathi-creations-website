(() => {
  "use strict";
  const SUPABASE_URL = "https://ydhqjkyzbbooolaugydk.supabase.co";
  const SUPABASE_KEY = "sb_publishable_uAy9Zv6zXK_cVFFGJfOxKQ_I1aRhJMs";
  const categoryMap = [
    {key:"frocks", words:["frock", "frocks"]},
    {key:"lehenga", words:["lehenga", "lehengas"]},
    {key:"designer", words:["designer wear", "designerwear", "designer outfit", "designer outfits"]},
    {key:"blouse", words:["blouse", "blouses"]},
    {key:"maggam", words:["maggam", "thread work", "hand embroidery"]},
    {key:"computer", words:["computer work", "computer embroidery", "computerized embroidery", "computerised embroidery", "computerized work", "computerised work", "machine embroidery"]},
    {key:"bridal", words:["bridal", "wedding", "occasionwear", "occasion wear"]},
    {key:"kids", words:["kids wear", "kid wear", "children wear", "kids", "children"]},
    {key:"saree", words:["saree", "tassel", "sarees"]},
    {key:"custom", words:["custom", "tailoring", "salwar"]}
  ];
  let activeCategory = "all";
  let activeButton = null;

  function normalizeCategory(value) {
    const text = String(value || "").trim().toLowerCase();
    const match = categoryMap.find(item => item.words.some(word => text.includes(word)));
    return match ? match.key : "custom";
  }

  function applyFilter(category, selected) {
    activeCategory = category || "all";
    activeButton = selected || activeButton;
    const cards = [...document.querySelectorAll(".collection-grid .collection-card[data-category]")];
    cards.forEach(card => {
      const visible = activeCategory === "all" || card.dataset.category === activeCategory;
      card.hidden = !visible;
      card.setAttribute("aria-hidden", String(!visible));
    });
    document.querySelectorAll(".gallery-filters button[data-filter]").forEach(button => {
      const active = button === activeButton;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function initFilters() {
    const group = document.querySelector(".gallery-filters");
    if (!group) return;
    const buttons = [...group.querySelectorAll("button[data-filter]")];
    buttons.forEach(button => button.addEventListener("click", event => {
      event.preventDefault();
      applyFilter(button.dataset.filter, button);
    }));
    const initial = buttons.find(button => button.dataset.filter === "all") || buttons[0];
    if (initial) applyFilter(initial.dataset.filter, initial);
  }

  const LIKES_KEY = "parvathi-creations-liked-designs";
  const WHATSAPP_NUMBER = "919550766784";
  function readLikedDesigns() {
    try { return JSON.parse(localStorage.getItem(LIKES_KEY) || "[]"); }
    catch (_) { return []; }
  }
  function decorateDesignCard(card, identity, title, imageUrl) {
    if (card.dataset.actionsAdded === "true") return;
    card.dataset.actionsAdded = "true";
    const key = String(identity || imageUrl || title);
    const actions = document.createElement("div");
    actions.className = "design-actions";
    const like = document.createElement("button");
    like.type = "button";
    like.className = "design-action design-like";
    function renderLike() {
      const liked = readLikedDesigns().includes(key);
      like.classList.toggle("is-liked", liked);
      like.setAttribute("aria-pressed", String(liked));
      like.textContent = liked ? "♥ Liked" : "♡ I Like This Design";
    }
    renderLike();
    like.addEventListener("click", event => {
      event.preventDefault(); event.stopPropagation();
      const liked = readLikedDesigns();
      const index = liked.indexOf(key);
      if (index >= 0) liked.splice(index, 1); else liked.push(key);
      try { localStorage.setItem(LIKES_KEY, JSON.stringify(liked)); } catch (_) {}
      renderLike();
    });
    const enquire = document.createElement("button");
    enquire.type = "button";
    enquire.className = "design-action design-enquire";
    enquire.textContent = "Enquire on WhatsApp";
    enquire.addEventListener("click", event => {
      event.preventDefault(); event.stopPropagation();
      const message = "Hello Parvathi Creations! I like this design: " + title + ". Image: " + imageUrl + ". Please share details.";
      window.open("https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(message), "_blank", "noopener,noreferrer");
    });
    actions.append(like, enquire);
    card.append(actions);
  }
  function createUploadedCard(design) {
    if (!design.image_url) return null;
    const category = normalizeCategory(design.category);
    const card = document.createElement("div");
    card.className = "collection-card uploaded-design";
    card.dataset.category = category;
    const img = document.createElement("img");
    img.src = design.image_url;
    img.alt = design.name || (design.category || "Parvathi Creations") + " design";
    img.loading = "lazy"; img.decoding = "async";
    img.onerror = () => { card.remove(); applyFilter(activeCategory, activeButton); };
    const number = document.createElement("span");
    number.className = "card-number"; number.textContent = "NEW";
    const label = document.createElement("div"); label.className = "card-label";
    const heading = document.createElement("h3"); heading.textContent = design.name || design.category || "New Design";
    const arrow = document.createElement("span"); arrow.textContent = "↗";
    label.append(heading, arrow); card.append(img, number, label);
    decorateDesignCard(card, design.id || design.image_url, heading.textContent, design.image_url);
    return card;
  }
  async function loadUploadedDesigns() {
    const grid = document.querySelector(".collection-grid");
    if (!grid || !window.supabase) return;
    try {
      const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
      const { data, error } = await client.from("designs").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      // Preserve the database's newest-first order and keep static cards first.
      (data || []).filter(design => design.hidden !== true).forEach(design => {
        const card = createUploadedCard(design);
        if (card) grid.append(card);
      });
      applyFilter(activeCategory, activeButton);
    } catch (error) {
      console.error("Parvathi Creations: could not load uploaded designs.", error);
    }
  }

  function initSmoothScrolling() {
    document.addEventListener("click", event => {
      const link = event.target.closest("a[href^='#']");
      if (!link) return;
      const href = link.getAttribute("href");
      if (!href || href === "#") {
        event.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      const target = document.getElementById(href.slice(1));
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      if (window.history && window.history.replaceState) window.history.replaceState(null, "", href);
    });
  }

  function initNavigationState() {
    const sections = [...document.querySelectorAll("main section[id]")];
    const links = [...document.querySelectorAll(".main-nav a[href^='#']")];
    if (!sections.length || !links.length) return;
    function update() {
      let current = sections[0].id;
      const threshold = window.scrollY + Math.min(180, window.innerHeight * 0.25);
      sections.forEach(section => { if (section.offsetTop <= threshold) current = section.id; });
      links.forEach(link => {
        const active = link.getAttribute("href") === "#" + current;
        link.classList.toggle("active", active);
        if (active) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
    }
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    update();
  }

  function initReveal() {
    const items = document.querySelectorAll(".reveal");
    if (!items.length) return;
    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver((entries, instance) => entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add("active"); instance.unobserve(entry.target); }
      }), { threshold: 0.08 });
      items.forEach(item => observer.observe(item));
    } else items.forEach(item => item.classList.add("active"));
  }

  function init() {
    initFilters();
    initSmoothScrolling();
    initNavigationState();
    initReveal();
    const year = document.getElementById("year");
    if (year) year.textContent = String(new Date().getFullYear());
    document.querySelectorAll(".collection-grid .collection-card").forEach(card => {\n      const heading = card.querySelector(".card-label h3");\n      const img = card.querySelector("img");\n      if (heading && img) decorateDesignCard(card, img.currentSrc || img.src, heading.textContent.trim(), img.currentSrc || img.src);\n    });\n    loadUploadedDesigns();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();