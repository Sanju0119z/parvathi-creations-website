(() => {
  "use strict";

  /* ---------- Configuration ---------- */
  const SUPABASE_URL = "https://ydhqjkyzbbooolaugydk.supabase.co";
  const SUPABASE_KEY = "sb_publishable_uAy9Zv6zXK_cVFFGJfOxKQ_I1aRhJMs"; // public (publishable) key by design; access is controlled by RLS
  const WHATSAPP_NUMBER = "919550766784";
  const LIKES_KEY = "parvathi-creations-liked-designs";

  /* Customer-facing text lives in one place so it can be translated later. */
  const TEXT = {
    all: "All Designs",
    loading: "Loading designs\u2026",
    errorTitle: "We couldn\u2019t load the designs right now.",
    errorHelp: "Please check your connection and try again.",
    retry: "Try again",
    emptyTitle: "Our design gallery is being updated.",
    emptyHelp: "New designs will appear here soon. In the meantime, message us on WhatsApp to see our latest work.",
    noMatchTitle: "No designs match your choices.",
    noMatchHelp: "Try another category or search, or clear the filters.",
    clearFilters: "Clear filters",
    featured: "\u2605 Featured",
    featuredOnly: "\u2605 Featured only",
    searchLabel: "Search designs",
    searchPlaceholder: "Search designs\u2026",
    sortLabel: "Sort designs",
    sortNewest: "Newest first",
    sortOldest: "Oldest first",
    sortName: "Name A\u2013Z",
    photoUnavailable: "Photo unavailable",
    like: "\u2661 I Like This Design",
    liked: "\u2665 Liked",
    enquire: "Enquire on WhatsApp",
    contactUnavailable: "The WhatsApp contact number is not available right now.",
    showing: (n, total) => "Showing " + n + " of " + total + " design" + (total === 1 ? "" : "s")
  };

  const cats = window.PCCategories;
  const state = { designs: [], category: "all", query: "", sort: "newest", featuredOnly: false, status: "loading" };
  let loading = false;
  const el = {};

  /* ---------- Data preparation ---------- */
  function cleanText(value) { return typeof value === "string" ? value.trim() : ""; }

  function toDesign(row) {
    const imageUrl = cleanText(row && row.image_url);
    const name = cleanText(row && row.name);
    const categoryRaw = cleanText(row && row.category);
    const key = cats.keyFor(categoryRaw);
    return {
      id: row && row.id != null ? String(row.id) : imageUrl,
      name: name,
      categoryRaw: categoryRaw,
      categoryKey: key,
      categoryLabel: key === cats.UNCATEGORIZED ? (categoryRaw || "Other") : cats.labelFor(key),
      description: cleanText(row && row.description),
      code: cleanText(row && row.design_code),
      imageUrl: /^https?:\/\//i.test(imageUrl) ? imageUrl : "",
      featured: !!row && row.featured === true,
      hidden: !!row && row.hidden === true,
      created: row && row.created_at ? (Date.parse(row.created_at) || 0) : 0,
      numericId: row && Number.isFinite(Number(row.id)) ? Number(row.id) : 0
    };
  }

  /* ---------- Filtering, searching and sorting (all combine) ---------- */
  function visibleDesigns() {
    const q = cats.normalizeText(state.query);
    const list = state.designs.filter(d => {
      if (state.category !== "all" && d.categoryKey !== state.category) return false;
      if (state.featuredOnly && !d.featured) return false;
      if (q) {
        const hay = cats.normalizeText([d.name, d.description, d.categoryLabel, d.code].join(" "));
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    const byNewest = (a, b) => (b.created - a.created) || (b.numericId - a.numericId);
    if (state.sort === "oldest") list.sort((a, b) => -byNewest(a, b));
    else if (state.sort === "name") list.sort((a, b) => (a.name || "\uffff").localeCompare(b.name || "\uffff", undefined, { sensitivity: "base" }) || byNewest(a, b));
    else list.sort(byNewest);
    return list;
  }

  /* ---------- Favourites (stored only on this device) ---------- */
  function readLikedDesigns() {
    try {
      const value = JSON.parse(localStorage.getItem(LIKES_KEY) || "[]");
      return Array.isArray(value) ? value : [];
    } catch (_) { return []; }
  }
  function writeLikedDesigns(list) {
    try { localStorage.setItem(LIKES_KEY, JSON.stringify(list)); } catch (_) {}
  }

  function openWhatsApp(design) {
    if (!/^\d{8,15}$/.test(WHATSAPP_NUMBER)) { window.alert(TEXT.contactUnavailable); return; }
    const parts = ["Hello Parvathi Creations! I\u2019m interested in this design: " + (design.name || design.categoryLabel) + " (" + design.categoryLabel + ")."];
    if (design.code) parts.push("Design code: " + design.code + ".");
    parts.push("Image: " + design.imageUrl);
    parts.push("Please share details.");
    window.open("https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(parts.join(" ")), "_blank", "noopener,noreferrer");
  }

  /* ---------- Rendering ---------- */
  function buildCard(design) {
    const card = document.createElement("article");
    card.className = "collection-card uploaded-design";
    card.dataset.category = design.categoryKey;
    card.dataset.designId = design.id;

    const media = document.createElement("div");
    media.className = "card-media";
    const img = document.createElement("img");
    img.src = design.imageUrl;
    img.alt = design.name || design.categoryLabel + " design";
    img.loading = "lazy";
    img.decoding = "async";
    img.addEventListener("error", () => {
      const fallback = document.createElement("div");
      fallback.className = "card-fallback";
      fallback.textContent = TEXT.photoUnavailable;
      img.replaceWith(fallback);
    }, { once: true });
    media.append(img);
    card.append(media);

    if (design.featured) {
      const badge = document.createElement("span");
      badge.className = "card-number";
      badge.textContent = TEXT.featured;
      card.append(badge);
    }

    const label = document.createElement("div");
    label.className = "card-label";
    const textWrap = document.createElement("div");
    const heading = document.createElement("h3");
    heading.textContent = design.name || design.categoryLabel;
    const sub = document.createElement("p");
    sub.className = "card-category";
    sub.textContent = design.categoryLabel;
    textWrap.append(heading, sub);
    label.append(textWrap);
    card.append(label);

    const actions = document.createElement("div");
    actions.className = "design-actions";
    const like = document.createElement("button");
    like.type = "button";
    like.className = "design-action design-like";
    const renderLike = () => {
      const liked = readLikedDesigns().includes(design.id);
      like.classList.toggle("is-liked", liked);
      like.setAttribute("aria-pressed", String(liked));
      like.textContent = liked ? TEXT.liked : TEXT.like;
    };
    renderLike();
    like.addEventListener("click", () => {
      const liked = readLikedDesigns();
      const index = liked.indexOf(design.id);
      if (index >= 0) liked.splice(index, 1); else liked.push(design.id);
      writeLikedDesigns(liked);
      renderLike();
    });
    const enquire = document.createElement("button");
    enquire.type = "button";
    enquire.className = "design-action design-enquire";
    enquire.textContent = TEXT.enquire;
    enquire.addEventListener("click", () => openWhatsApp(design));
    actions.append(like, enquire);
    card.append(actions);
    return card;
  }

  function setStatus(kind, title, help, buttonLabel, onClick) {
    el.status.replaceChildren();
    el.status.hidden = !kind;
    el.status.className = "gallery-status" + (kind ? " is-" + kind : "");
    if (!kind) return;
    const strong = document.createElement("strong");
    strong.textContent = title;
    el.status.append(strong);
    if (help) { const p = document.createElement("p"); p.textContent = help; el.status.append(p); }
    if (buttonLabel) {
      const b = document.createElement("button");
      b.type = "button"; b.className = "design-action status-action"; b.textContent = buttonLabel;
      b.addEventListener("click", onClick);
      el.status.append(b);
    }
  }

  function syncControls() {
    el.filters.querySelectorAll("button[data-filter]").forEach(b => {
      const active = b.dataset.filter === state.category;
      b.classList.toggle("active", active);
      b.setAttribute("aria-pressed", String(active));
    });
    el.featured.setAttribute("aria-pressed", String(state.featuredOnly));
    el.featured.classList.toggle("active", state.featuredOnly);
  }

  function clearFilters() {
    state.category = "all"; state.query = ""; state.sort = "newest"; state.featuredOnly = false;
    el.search.value = ""; el.sort.value = "newest";
    render();
  }

  function render() {
    syncControls();
    el.grid.replaceChildren();
    el.grid.setAttribute("aria-busy", String(state.status === "loading"));
    if (state.status === "loading") { setStatus("loading", TEXT.loading); el.count.textContent = ""; return; }
    if (state.status === "error") { setStatus("error", TEXT.errorTitle, TEXT.errorHelp, TEXT.retry, loadDesigns); el.count.textContent = ""; return; }
    if (!state.designs.length) { setStatus("empty", TEXT.emptyTitle, TEXT.emptyHelp); el.count.textContent = ""; return; }
    const list = visibleDesigns();
    el.count.textContent = TEXT.showing(list.length, state.designs.length);
    if (!list.length) { setStatus("empty", TEXT.noMatchTitle, TEXT.noMatchHelp, TEXT.clearFilters, clearFilters); return; }
    setStatus(null);
    const frag = document.createDocumentFragment();
    list.forEach(d => frag.append(buildCard(d)));
    el.grid.append(frag);
  }

  /* ---------- Loading from Supabase ---------- */
  async function loadDesigns() {
    if (loading) return;
    loading = true;
    state.status = "loading";
    render();
    try {
      if (!window.supabase || typeof window.supabase.createClient !== "function") throw new Error("Supabase library not available");
      const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
      const { data, error } = await client.from("designs").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      const all = (Array.isArray(data) ? data : []).map(toDesign);
      const noImage = all.filter(d => !d.hidden && !d.imageUrl).map(d => d.id);
      const odd = all.filter(d => !d.hidden && d.imageUrl && d.categoryKey === cats.UNCATEGORIZED).map(d => d.id + " (" + JSON.stringify(d.categoryRaw) + ")");
      if (noImage.length) console.warn("Parvathi Creations: designs skipped (no valid image URL), ids:", noImage.join(", "));
      if (odd.length) console.warn("Parvathi Creations: designs with an unrecognised category are shown only under All Designs, ids:", odd.join(", "));
      state.designs = all.filter(d => !d.hidden && d.imageUrl);
      state.status = "ready";
    } catch (error) {
      console.error("Parvathi Creations: could not load designs.", error);
      state.status = "error";
    } finally {
      loading = false;
    }
    render();
  }

  /* ---------- Controls ---------- */
  function initGalleryControls() {
    el.grid = document.querySelector(".collection-grid");
    el.filters = document.querySelector(".gallery-filters");
    el.status = document.getElementById("galleryStatus");
    el.search = document.getElementById("gallerySearch");
    el.sort = document.getElementById("gallerySort");
    el.featured = document.getElementById("galleryFeatured");
    el.count = document.getElementById("galleryCount");
    if (!el.grid || !el.filters || !el.status || !el.search || !el.sort || !el.featured || !el.count) return false;

    const makeButton = (key, label) => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "filter-btn"; b.dataset.filter = key; b.textContent = label;
      b.setAttribute("aria-pressed", "false");
      return b;
    };
    el.filters.replaceChildren(makeButton("all", TEXT.all), ...cats.list.map(c => makeButton(c.key, c.label)));
    el.filters.addEventListener("click", event => {
      const button = event.target.closest("button[data-filter]");
      if (!button || !el.filters.contains(button)) return;
      const key = button.dataset.filter;
      if (key !== "all" && !cats.isKnownKey(key)) return;
      state.category = key;
      render();
    });

    let timer = null;
    el.search.placeholder = TEXT.searchPlaceholder;
    el.search.setAttribute("aria-label", TEXT.searchLabel);
    el.search.addEventListener("input", () => {
      clearTimeout(timer);
      timer = setTimeout(() => { state.query = el.search.value; render(); }, 120);
    });
    el.sort.setAttribute("aria-label", TEXT.sortLabel);
    el.sort.replaceChildren(
      new Option(TEXT.sortNewest, "newest"), new Option(TEXT.sortOldest, "oldest"), new Option(TEXT.sortName, "name"));
    el.sort.addEventListener("change", () => { state.sort = el.sort.value; render(); });
    el.featured.textContent = TEXT.featuredOnly;
    el.featured.addEventListener("click", () => { state.featuredOnly = !state.featuredOnly; render(); });
    return true;
  }

  /* ---------- Page behaviour (unchanged from the previous version) ---------- */
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
    initSmoothScrolling();
    initNavigationState();
    initReveal();
    const year = document.getElementById("year");
    if (year) year.textContent = String(new Date().getFullYear());
    if (initGalleryControls()) loadDesigns();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
