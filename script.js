(() => {
  "use strict";

  /* ---------- Configuration ---------- */
  const SUPABASE_URL = "https://ydhqjkyzbbooolaugydk.supabase.co";
  const SUPABASE_KEY = "sb_publishable_uAy9Zv6zXK_cVFFGJfOxKQ_I1aRhJMs"; // public (publishable) key by design; access is controlled by RLS
  const WHATSAPP_NUMBER = "919550766784";
  const LIKES_KEY = "parvathi-creations-liked-designs";

  /* Customer-facing text lives in one place so it can be translated later. */
  let TEXT = {
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
  let heroSlideIndex = 0;
  let heroSlideTimer = null;
  const el = {};

  /* ---------- Data preparation ---------- */
  function cleanText(value) { return typeof value === "string" ? value.trim() : ""; }

  /* The database stores "featured" as text ("true"/"false"), so accept both a real boolean and that text. */
  function isFeatured(value) {
    return value === true || (typeof value === "string" && value.trim().toLowerCase() === "true");
  }

  function toDesign(row) {
    let savedImages = row && row.image_urls;
    if (typeof savedImages === "string") {
      try { savedImages = JSON.parse(savedImages); } catch (_) { savedImages = []; }
    }
    if (!Array.isArray(savedImages)) savedImages = [];
    const galleryImages = [...new Set(savedImages.map(cleanText).filter(url => /^https?:\/\//i.test(url)))];
    const storedCover = cleanText(row && row.image_url);
    const imageUrl = /^https?:\/\//i.test(storedCover) ? storedCover : (galleryImages[0] || "");
    if (imageUrl && !galleryImages.includes(imageUrl)) galleryImages.unshift(imageUrl);
    const name = cleanText(row && row.name);
    const categoryRaw = cleanText(row && row.category);
    const key = cats.keyFor(categoryRaw);
    return {
      id: row && row.id != null ? String(row.id) : imageUrl,
      name: name,
      categoryRaw: categoryRaw,
      categoryKey: key,
      categoryLabel: catLabel(key, categoryRaw),
      description: cleanText(row && row.description),
      name_te: cleanText(row && row.name_te), name_hi: cleanText(row && row.name_hi), description_te: cleanText(row && row.description_te), description_hi: cleanText(row && row.description_hi),
      code: cleanText(row && row.design_code),
      price: cleanText(row && row.price),
      imageUrl: imageUrl,
      galleryImages: galleryImages.length ? galleryImages : (imageUrl ? [imageUrl] : []),
      featured: !!row && isFeatured(row.featured),
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
    const parts = [TEXT.whatsappHello + " " + (localField(design,"name") || design.categoryLabel) + " (" + catLabel(design.categoryKey,design.categoryRaw) + ")."];
    if (design.code) parts.push(TEXT.designCode + " " + design.code + ".");
    if (design.price) parts.push(TEXT.price + " â¹" + design.price);
    if (localField(design,"description")) parts.push(TEXT.descriptionPrefix + " " + localField(design,"description"));
    parts.push(TEXT.image + " " + design.imageUrl);
    parts.push(TEXT.shareDetails);
    window.open("https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(parts.join(" ")), "_blank", "noopener,noreferrer");
  }

  /* ---------- Photo details dialog ---------- */
  function openDesignDetails(design) {
    const existing = document.querySelector(".design-details-overlay");
    if (existing) existing.remove();

    const overlay = document.createElement("div");
    overlay.className = "design-details-overlay";
    overlay.setAttribute("role", "presentation");
    const dialog = document.createElement("section");
    dialog.className = "design-details-dialog";
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("aria-label", (design.name || design.categoryLabel) + " details");

    const close = document.createElement("button");
    close.type = "button";
    close.className = "design-details-close";
    close.textContent = "Ã";
    close.setAttribute("aria-label", TEXT.closeDetails);
    const closeDialog = () => {
      overlay.remove();
      document.removeEventListener("keydown", onKeyDown);
    };
    const onKeyDown = event => { if (event.key === "Escape") closeDialog(); };
    close.addEventListener("click", closeDialog);

    const media = document.createElement("div");
    media.className = "design-details-media";
    const photo = document.createElement("img");
    photo.className = "design-details-photo";
    photo.src = design.imageUrl;
    photo.alt = design.name || design.categoryLabel + " design";
    media.append(photo);
    const galleryImages = Array.isArray(design.galleryImages) ? design.galleryImages : [design.imageUrl];
    if (galleryImages.length > 1) {
      const thumbnails = document.createElement("div");
      thumbnails.className = "design-details-thumbnails";
      galleryImages.slice(0, 6).forEach((url, index) => {
        const thumb = document.createElement("button");
        thumb.type = "button";
        thumb.className = "design-details-thumbnail" + (url === design.imageUrl ? " is-active" : "");
        thumb.setAttribute("aria-label", (index === 0 ? TEXT.coverPhoto : TEXT.photo + " " + (index + 1)));
        thumb.setAttribute("aria-pressed", url === design.imageUrl ? "true" : "false");
        const thumbImage = document.createElement("img");
        thumbImage.src = url;
        thumbImage.alt = "";
        thumb.addEventListener("click", () => {
          photo.src = url;
          thumbnails.querySelectorAll(".design-details-thumbnail").forEach(button => {
            const active = button === thumb;
            button.classList.toggle("is-active", active);
            button.setAttribute("aria-pressed", active ? "true" : "false");
          });
        });
        thumb.append(thumbImage);
        thumbnails.append(thumb);
      });
      media.append(thumbnails);
    }
    const info = document.createElement("div");
    info.className = "design-details-info";
    const category = document.createElement("p");
    category.className = "design-details-category";
    category.textContent = catLabel(design.categoryKey, design.categoryRaw);
    const heading = document.createElement("h2");
    heading.textContent = localField(design,"name") || catLabel(design.categoryKey,design.categoryRaw) + " " + TEXT.design;
    const price = document.createElement("p");
    price.className = "design-details-price";
    price.textContent = design.price ? "â¹" + design.price : TEXT.priceOnEnquiry;
    const descriptionLabel = document.createElement("h3");
    descriptionLabel.textContent = TEXT.description;
    const description = document.createElement("p");
    description.className = "design-details-description";
    description.textContent = localField(design,"description") || TEXT.moreDetails;
    info.append(category, heading, price);
    if (design.code) {
      const code = document.createElement("p");
      code.className = "design-details-code";
      code.textContent = TEXT.designCode + " " + design.code;
      info.append(code);
    }
    info.append(descriptionLabel, description);
    const enquire = document.createElement("button");
    enquire.type = "button";
    enquire.className = "design-action design-enquire design-details-enquire";
    enquire.textContent = TEXT.enquire;
    enquire.addEventListener("click", () => openWhatsApp(design));
    info.append(enquire);
    dialog.append(close, media, info);
    overlay.append(dialog);
    overlay.addEventListener("click", event => { if (event.target === overlay) closeDialog(); });
    document.addEventListener("keydown", onKeyDown);
    document.body.append(overlay);
    close.focus();
  }

  /* ---------- Rendering ---------- */
  function buildCard(design) {
    const card = document.createElement("article");
    card.className = "collection-card uploaded-design";
    card.dataset.category = design.categoryKey;
    card.dataset.designId = design.id;

    const media = document.createElement("div");
    media.className = "card-media";
    const imageButton = document.createElement("button");
    imageButton.type = "button";
    imageButton.className = "design-image-trigger";
    imageButton.setAttribute("aria-label", TEXT.viewDetails + " " + (localField(design,"name") || design.categoryLabel));
    imageButton.addEventListener("click", () => openDesignDetails(design));
    const img = document.createElement("img");
    img.src = design.imageUrl;
    img.alt = design.name || design.categoryLabel + " design";
    img.loading = "lazy";
    img.decoding = "async";
    img.addEventListener("error", () => {
      const fallback = document.createElement("div");
      fallback.className = "card-fallback";
      fallback.textContent = TEXT.photoUnavailable;
      imageButton.replaceWith(fallback);
    }, { once: true });
    imageButton.append(img);
    media.append(imageButton);
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
    heading.textContent = localField(design,"name") || catLabel(design.categoryKey,design.categoryRaw);
    const sub = document.createElement("p");
    sub.className = "card-category";
    sub.textContent = catLabel(design.categoryKey,design.categoryRaw);
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


  /* ---------- Homepage hero slider: only real Supabase design uploads ---------- */
  function initHeroSlider(designs) {
    const root = document.getElementById("heroSlider");
    const image = document.getElementById("heroSlideImage");
    const name = document.getElementById("heroSlideName");
    const category = document.getElementById("heroSlideCategory");
    const dots = document.getElementById("heroSlideDots");
    const count = document.getElementById("heroSlideCount");
    if (!root || !image || !dots) return;
    if (heroSlideTimer) { window.clearInterval(heroSlideTimer); heroSlideTimer = null; }
    const slides = (Array.isArray(designs) ? designs : []).filter(d => d && !d.hidden && /^https?:\/\//i.test(d.imageUrl || ""));
    if (!slides.length) { root.hidden = true; return; }
    root.hidden = false;
    heroSlideIndex = Math.min(heroSlideIndex, slides.length - 1);
    dots.replaceChildren();
    slides.forEach((design, index) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "hero-slide-dot";
      dot.setAttribute("aria-label", "Show design " + (index + 1) + ": " + (design.name || design.categoryLabel || "Boutique design"));
      dot.addEventListener("click", () => { heroSlideIndex = index; showSlide(); restartTimer(); });
      dots.append(dot);
    });
    function showSlide() {
      const design = slides[heroSlideIndex];
      image.src = design.imageUrl;
      image.alt = [design.name, design.categoryLabel, "Parvathi Creations design"].filter(Boolean).join(" â ");
      name.textContent = localField(design,"name") || design.categoryLabel || "A design made with care";
      category.textContent = design.categoryLabel || "Parvathi Creations";
      count.textContent = String(heroSlideIndex + 1).padStart(2, "0") + " / " + String(slides.length).padStart(2, "0");
      Array.from(dots.children).forEach((dot, index) => {
        dot.classList.toggle("active", index === heroSlideIndex);
        if (index === heroSlideIndex) dot.setAttribute("aria-current", "true");
        else dot.removeAttribute("aria-current");
      });
      const multiple = slides.length > 1;
      root.classList.toggle("is-single", !multiple);
    }
    function move(step) { heroSlideIndex = (heroSlideIndex + step + slides.length) % slides.length; showSlide(); }
    const prev = document.getElementById("heroSlidePrev");
    const next = document.getElementById("heroSlideNext");
    if (prev) prev.onclick = () => { move(-1); restartTimer(); };
    if (next) next.onclick = () => { move(1); restartTimer(); };
    function restartTimer() {
      if (heroSlideTimer) window.clearInterval(heroSlideTimer);
      heroSlideTimer = null;
      if (slides.length > 1 && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        heroSlideTimer = window.setInterval(() => move(1), 5500);
      }
    }
    root.addEventListener("mouseenter", () => { if (heroSlideTimer) window.clearInterval(heroSlideTimer); heroSlideTimer = null; });
    root.addEventListener("mouseleave", restartTimer);
    root.addEventListener("focusin", () => { if (heroSlideTimer) window.clearInterval(heroSlideTimer); heroSlideTimer = null; });
    root.addEventListener("focusout", restartTimer);
    showSlide();
    restartTimer();
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
      initHeroSlider(state.designs);
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

  const L = {
    en:{all:"All Designs",loading:"Loading designsâ¦",errorTitle:"We couldnât load the designs right now.",errorHelp:"Please check your connection and try again.",retry:"Try again",emptyTitle:"Our design gallery is being updated.",emptyHelp:"New designs will appear here soon. In the meantime, message us on WhatsApp to see our latest work.",noMatchTitle:"No designs match your choices.",noMatchHelp:"Try another category or search, or clear the filters.",clearFilters:"Clear filters",featured:"â Featured",featuredOnly:"â Featured only",searchLabel:"Search designs",searchPlaceholder:"Search designsâ¦",sortLabel:"Sort designs",sortNewest:"Newest first",sortOldest:"Oldest first",sortName:"Name AâZ",photoUnavailable:"Photo unavailable",like:"â¡ I Like This Design",liked:"â¥ Liked",enquire:"Enquire on WhatsApp",contactUnavailable:"The WhatsApp contact number is not available right now.",description:"Description",priceOnEnquiry:"Price available on enquiry",moreDetails:"Please contact us for more details about this design.",closeDetails:"Close design details",coverPhoto:"Cover photo",photo:"Photo",design:"design",viewDetails:"View details for",whatsappHello:"Hello Parvathi Creations! Iâm interested in this design:",designCode:"Design code:",price:"Price:",descriptionPrefix:"Description:",image:"Image:",shareDetails:"Please share details.",showing:function(n,total){return "Showing "+n+" of "+total+" design"+(total===1?"":"s");}},
    te:{all:"à°à°¨à±à°¨à°¿ à°¡à°¿à°à±à°¨à±à°²à±",loading:"à°¡à°¿à°à±à°¨à±à°²à± à°²à±à°¡à± à°à°µà±à°¤à±à°¨à±à°¨à°¾à°¯à°¿â¦",errorTitle:"à°ªà±à°°à°¸à±à°¤à±à°¤à° à°¡à°¿à°à±à°¨à±à°²à°¨à± à°²à±à°¡à± à°à±à°¯à°²à±à°à°ªà±à°¯à°¾à°®à±.",errorHelp:"à°à°à°à°°à±à°¨à±à°à± à°à°¨à±à°à±à°·à°¨à± à°¤à°¨à°¿à°à± à°à±à°¸à°¿ à°®à°³à±à°²à± à°ªà±à°°à°¯à°¤à±à°¨à°¿à°à°à°à°¡à°¿.",retry:"à°®à°³à±à°²à± à°ªà±à°°à°¯à°¤à±à°¨à°¿à°à°à°à°¡à°¿",emptyTitle:"à°®à°¾ à°¡à°¿à°à±à°¨à± à°à±à°¯à°¾à°²à°°à± à°¨à°µà±à°à°°à°¿à°à°à°¬à°¡à±à°¤à±à°à°¦à°¿.",emptyHelp:"à°à±à°¤à±à°¤ à°¡à°¿à°à±à°¨à±à°²à± à°¤à±à°µà°°à°²à± à°à°à±à°à°¡ à°à°¨à°¿à°ªà°¿à°¸à±à°¤à°¾à°¯à°¿. à°®à°¾ à°¤à°¾à°à°¾ à°ªà°¨à°¿à°¨à°¿ à°à±à°¡à°à°¾à°¨à°¿à°à°¿ WhatsAppà°²à± à°¸à°à°¦à±à°¶à° à°ªà°à°ªà°à°¡à°¿.",noMatchTitle:"à°®à± à°à°à°ªà°¿à°à°²à°à± à°¸à°°à°¿à°ªà±à°¯à± à°¡à°¿à°à±à°¨à±à°²à± à°²à±à°µà±.",noMatchHelp:"à°®à°°à±à° à°µà°°à±à°à°¾à°¨à±à°¨à°¿ à°ªà±à°°à°¯à°¤à±à°¨à°¿à°à°à°à°¡à°¿ à°²à±à°¦à°¾ à°«à°¿à°²à±à°à°°à±à°²à°¨à± à°¤à±à°²à°à°¿à°à°à°à°¡à°¿.",clearFilters:"à°«à°¿à°²à±à°à°°à±à°²à°¨à± à°¤à±à°²à°à°¿à°à°à°à°¡à°¿",featured:"â à°ªà±à°°à°¤à±à°¯à±à° à°¡à°¿à°à±à°¨à±",featuredOnly:"â à°ªà±à°°à°¤à±à°¯à±à° à°¡à°¿à°à±à°¨à±à°²à± à°®à°¾à°¤à±à°°à°®à±",searchLabel:"à°¡à°¿à°à±à°¨à±à°²à°¨à± à°µà±à°¤à°à°à°¡à°¿",searchPlaceholder:"à°¡à°¿à°à±à°¨à±à°²à°¨à± à°µà±à°¤à°à°à°¡à°¿â¦",sortLabel:"à°¡à°¿à°à±à°¨à±à°² à°à±à°°à°®à°",sortNewest:"à°à±à°¤à±à°¤à°µà°¿ à°®à±à°à°¦à±",sortOldest:"à°ªà°¾à°¤à°µà°¿ à°®à±à°à°¦à±",sortName:"à°ªà±à°°à± AâZ",photoUnavailable:"à°«à±à°à± à°à°à°¦à±à°¬à°¾à°à±à°²à± à°²à±à°¦à±",like:"â¡ à° à°¡à°¿à°à±à°¨à± à°¨à°à±à°à°¿à°à°¦à°¿",liked:"â¥ à°¨à°à±à°à°¿à°à°¦à°¿",enquire:"WhatsAppà°²à± à°µà°¿à°µà°°à°¾à°²à± à°à°¡à°à°à°¡à°¿",contactUnavailable:"à°ªà±à°°à°¸à±à°¤à±à°¤à° WhatsApp à°¨à°à°¬à°°à± à°à°à°¦à±à°¬à°¾à°à±à°²à± à°²à±à°¦à±.",description:"à°µà°¿à°µà°°à°£",priceOnEnquiry:"à°§à°° à°à±à°¸à° à°¸à°à°ªà±à°°à°¦à°¿à°à°à°à°¡à°¿",moreDetails:"à° à°¡à°¿à°à±à°¨à± à°à±à°°à°¿à°à°à°¿ à°®à°°à°¿à°¨à±à°¨à°¿ à°µà°¿à°µà°°à°¾à°² à°à±à°¸à° à°®à°®à±à°®à°²à±à°¨à°¿ à°¸à°à°ªà±à°°à°¦à°¿à°à°à°à°¡à°¿.",closeDetails:"à°¡à°¿à°à±à°¨à± à°µà°¿à°µà°°à°¾à°²à°¨à± à°®à±à°¸à°¿à°µà±à°¯à°à°¡à°¿",coverPhoto:"à°ªà±à°°à°§à°¾à°¨ à°«à±à°à±",photo:"à°«à±à°à±",design:"à°¡à°¿à°à±à°¨à±",viewDetails:"à°µà°¿à°µà°°à°¾à°²à± à°à±à°¡à°à°¡à°¿:",whatsappHello:"à°¨à°®à°¸à±à°à°¾à°°à° Parvathi Creations! à° à°¡à°¿à°à±à°¨à± à°à±à°°à°¿à°à°à°¿ à°¤à±à°²à±à°¸à±à°à±à°µà°¾à°²à°¨à±à°à±à°à°à±à°¨à±à°¨à°¾à°¨à±:",designCode:"à°¡à°¿à°à±à°¨à± à°à±à°¡à±:",price:"à°§à°°:",descriptionPrefix:"à°µà°¿à°µà°°à°£:",image:"à°à°¿à°¤à±à°°à°:",shareDetails:"à°¦à°¯à°à±à°¸à°¿ à°µà°¿à°µà°°à°¾à°²à± à°¤à±à°²à°¿à°¯à°à±à°¯à°à°¡à°¿.",showing:function(n,total){return total+" à°¡à°¿à°à±à°¨à±à°²à°²à± "+n+" à°à±à°ªà°¿à°¸à±à°¤à±à°¨à±à°¨à°¾à°";}},
    hi:{all:"à¤¸à¤­à¥ à¤¡à¤¿à¤à¤¼à¤¾à¤à¤¨",loading:"à¤¡à¤¿à¤à¤¼à¤¾à¤à¤¨ à¤²à¥à¤¡ à¤¹à¥ à¤°à¤¹à¥ à¤¹à¥à¤â¦",errorTitle:"à¤à¤­à¥ à¤¡à¤¿à¤à¤¼à¤¾à¤à¤¨ à¤²à¥à¤¡ à¤¨à¤¹à¥à¤ à¤¹à¥ à¤¸à¤à¥à¥¤",errorHelp:"à¤à¥à¤ªà¤¯à¤¾ à¤à¤à¤à¤°à¤¨à¥à¤ à¤à¤¨à¥à¤à¥à¤¶à¤¨ à¤à¤¾à¤à¤à¤à¤° à¤«à¤¿à¤° à¤à¥à¤¶à¤¿à¤¶ à¤à¤°à¥à¤à¥¤",retry:"à¤«à¤¿à¤° à¤à¥à¤¶à¤¿à¤¶ à¤à¤°à¥à¤",emptyTitle:"à¤¹à¤®à¤¾à¤°à¥ à¤¡à¤¿à¤à¤¼à¤¾à¤à¤¨ à¤à¥à¤²à¤°à¥ à¤à¤ªà¤¡à¥à¤ à¤¹à¥ à¤°à¤¹à¥ à¤¹à¥à¥¤",emptyHelp:"à¤¨à¤ à¤¡à¤¿à¤à¤¼à¤¾à¤à¤¨ à¤à¤²à¥à¤¦ à¤¦à¤¿à¤à¥à¤à¤à¥à¥¤ à¤¹à¤®à¤¾à¤°à¤¾ à¤¨à¤¯à¤¾ à¤à¤¾à¤® à¤¦à¥à¤à¤¨à¥ à¤à¥ à¤²à¤¿à¤ WhatsApp à¤ªà¤° à¤¸à¤à¤¦à¥à¤¶ à¤­à¥à¤à¥à¤à¥¤",noMatchTitle:"à¤à¤ªà¤à¥ à¤ªà¤¸à¤à¤¦ à¤¸à¥ à¤®à¥à¤² à¤à¤¾à¤¤à¥ à¤¡à¤¿à¤à¤¼à¤¾à¤à¤¨ à¤¨à¤¹à¥à¤ à¤®à¤¿à¤²à¥à¥¤",noMatchHelp:"à¤¦à¥à¤¸à¤°à¥ à¤¶à¥à¤°à¥à¤£à¥ à¤à¤à¤¼à¤®à¤¾à¤à¤ à¤¯à¤¾ à¤«à¤¼à¤¿à¤²à¥à¤à¤° à¤¹à¤à¤¾à¤à¤à¥¤",clearFilters:"à¤«à¤¼à¤¿à¤²à¥à¤à¤° à¤¹à¤à¤¾à¤à¤",featured:"â à¤à¤¾à¤¸ à¤¡à¤¿à¤à¤¼à¤¾à¤à¤¨",featuredOnly:"à¤à¥à¤µà¤² à¤à¤¾à¤¸ à¤¡à¤¿à¤à¤¼à¤¾à¤à¤¨",searchLabel:"à¤¡à¤¿à¤à¤¼à¤¾à¤à¤¨ à¤à¥à¤à¥à¤",searchPlaceholder:"à¤¡à¤¿à¤à¤¼à¤¾à¤à¤¨ à¤à¥à¤à¥à¤â¦",sortLabel:"à¤¡à¤¿à¤à¤¼à¤¾à¤à¤¨ à¤à¥à¤°à¤®",sortNewest:"à¤¨à¤ à¤ªà¤¹à¤²à¥",sortOldest:"à¤ªà¥à¤°à¤¾à¤¨à¥ à¤ªà¤¹à¤²à¥",sortName:"à¤¨à¤¾à¤® AâZ",photoUnavailable:"à¤«à¤¼à¥à¤à¥ à¤à¤ªà¤²à¤¬à¥à¤§ à¤¨à¤¹à¥à¤",like:"â¡ à¤¯à¤¹ à¤¡à¤¿à¤à¤¼à¤¾à¤à¤¨ à¤ªà¤¸à¤à¤¦ à¤¹à¥",liked:"â¥ à¤ªà¤¸à¤à¤¦ à¤à¤¿à¤¯à¤¾",enquire:"WhatsApp à¤ªà¤° à¤ªà¥à¤à¥à¤",contactUnavailable:"à¤à¤­à¥ WhatsApp à¤¨à¤à¤¬à¤° à¤à¤ªà¤²à¤¬à¥à¤§ à¤¨à¤¹à¥à¤ à¤¹à¥à¥¤",description:"à¤µà¤¿à¤µà¤°à¤£",priceOnEnquiry:"à¤à¥à¤®à¤¤ à¤à¥ à¤²à¤¿à¤ à¤ªà¥à¤à¥à¤",moreDetails:"à¤à¤¸ à¤¡à¤¿à¤à¤¼à¤¾à¤à¤¨ à¤à¥ à¤¬à¤¾à¤°à¥ à¤®à¥à¤ à¤à¤§à¤¿à¤ à¤à¤¾à¤¨à¤à¤¾à¤°à¥ à¤à¥ à¤²à¤¿à¤ à¤¹à¤®à¤¸à¥ à¤¸à¤à¤ªà¤°à¥à¤ à¤à¤°à¥à¤à¥¤",closeDetails:"à¤¡à¤¿à¤à¤¼à¤¾à¤à¤¨ à¤µà¤¿à¤µà¤°à¤£ à¤¬à¤à¤¦ à¤à¤°à¥à¤",coverPhoto:"à¤®à¥à¤à¥à¤¯ à¤«à¤¼à¥à¤à¥",photo:"à¤«à¤¼à¥à¤à¥",design:"à¤¡à¤¿à¤à¤¼à¤¾à¤à¤¨",viewDetails:"à¤µà¤¿à¤µà¤°à¤£ à¤¦à¥à¤à¥à¤:",whatsappHello:"à¤¨à¤®à¤¸à¥à¤¤à¥ Parvathi Creations! à¤®à¥à¤à¥ à¤¯à¤¹ à¤¡à¤¿à¤à¤¼à¤¾à¤à¤¨ à¤ªà¤¸à¤à¤¦ à¤¹à¥:",designCode:"à¤¡à¤¿à¤à¤¼à¤¾à¤à¤¨ à¤à¥à¤¡:",price:"à¤à¥à¤®à¤¤:",descriptionPrefix:"à¤µà¤¿à¤µà¤°à¤£:",image:"à¤à¤¿à¤¤à¥à¤°:",shareDetails:"à¤à¥à¤ªà¤¯à¤¾ à¤à¤¾à¤¨à¤à¤¾à¤°à¥ à¤¸à¤¾à¤à¤¾ à¤à¤°à¥à¤à¥¤",showing:function(n,total){return total+" à¤®à¥à¤ à¤¸à¥ "+n+" à¤¡à¤¿à¤à¤¼à¤¾à¤à¤¨ à¤¦à¤¿à¤ à¤°à¤¹à¥ à¤¹à¥à¤";}}
  };
  const CL = {
    maggam:{en:"Maggam Work",te:"à°®à°à±à°à° à°µà°°à±à°à±",hi:"à¤®à¤à¥à¤à¤® à¤µà¤°à¥à¤"},computer:{en:"Computer Embroidery",te:"à°à°à°ªà±à°¯à±à°à°°à± à°à°à°¬à±à°°à°¾à°¯à°¿à°¡à°°à±",hi:"à¤à¤à¤ªà¥à¤¯à¥à¤à¤° à¤à¤¢à¤¼à¤¾à¤"},blouse:{en:"Blouse Designs",te:"à°¬à±à°²à±à°à± à°¡à°¿à°à±à°¨à±à°²à±",hi:"à¤¬à¥à¤²à¤¾à¤à¤à¤¼ à¤¡à¤¿à¤à¤¼à¤¾à¤à¤¨"},designer:{en:"Designer Wear",te:"à°¡à°¿à°à±à°¨à°°à± à°¦à±à°¸à±à°¤à±à°²à±",hi:"à¤¡à¤¿à¤à¤¼à¤¾à¤à¤¨à¤° à¤ªà¤°à¤¿à¤§à¤¾à¤¨"},frocks:{en:"Frocks",te:"à°«à±à°°à°¾à°à±à°¸à±",hi:"à¤«à¥à¤°à¥à¤"},lehenga:{en:"Designer Lehengas",te:"à°¡à°¿à°à±à°¨à°°à± à°²à±à°¹à±à°à°à°¾à°²à±",hi:"à¤¡à¤¿à¤à¤¼à¤¾à¤à¤¨à¤° à¤²à¤¹à¤à¤à¥"},bridal:{en:"Wedding Wear",te:"à°ªà±à°³à±à°²à°¿ à°¦à±à°¸à±à°¤à±à°²à±",hi:"à¤¶à¤¾à¤¦à¥ à¤à¥ à¤ªà¤°à¤¿à¤§à¤¾à¤¨"},kids:{en:"Kids Wear",te:"à°ªà°¿à°²à±à°²à°² à°¦à±à°¸à±à°¤à±à°²à±",hi:"à¤¬à¤à¥à¤à¥à¤ à¤à¥ à¤à¤ªà¤¡à¤¼à¥"},saree:{en:"Sarees & Tassels",te:"à°à±à°°à°²à± & à°à°¾à°¸à±à°²à±à°¸à±",hi:"à¤¸à¤¾à¤¡à¤¼à¤¿à¤¯à¤¾à¤ à¤à¤° à¤²à¤à¤à¤¨"},custom:{en:"Custom Designs",te:"à°à°¸à±à°à°®à± à°¡à°¿à°à±à°¨à±à°²à±",hi:"à¤à¤¸à¥à¤à¤® à¤¡à¤¿à¤à¤¼à¤¾à¤à¤¨"},uncategorized:{en:"Other",te:"à°à°¤à°°à°¾à°²à±",hi:"à¤à¤¨à¥à¤¯"}
  };
  const DESIGN_COPY = {
    "7": {
      name:{en:"Sweetheart Blouse",te:"à°¸à±à°µà±à°à±âà°¹à°¾à°°à±à°à± à°¬à±à°²à±à°à±",hi:"à¤¸à¥à¤µà¥à¤à¤¹à¤¾à¤°à¥à¤ à¤¬à¥à¤²à¤¾à¤à¤à¤¼"},
      description:{
        en:"#Stiching only\nLavender Pearl Blouse Detailsâ¨\nðSleeve:Sheer puff organza style with scattered floral embroidery and wide embroidered cuffs.\nðBack:Deep U-cut,pearl border,dori tie-up with fabric latkans,lower button placket.",
        te:"#à°à±à°à±à°à± à°®à°¾à°¤à±à°°à°®à±\nà°²à°¾à°µà±à°à°¡à°°à± à°ªà±à°°à±à°²à± à°¬à±à°²à±à°à± à°µà°¿à°µà°°à°¾à°²à±â¨\nðà°à±à°¤à±à°²à±: à°à°à±à°à°¡à°à±à°à°¡ à°ªà±à°² à°à°à°¬à±à°°à°¾à°¯à°¿à°¡à°°à±à°¤à± à°ªà°¾à°°à°¦à°°à±à°¶à° à°ªà°«à± à°à°°à±à°à°à°à°¾ à°à±à°¤à±à°²à±, à°µà±à°¡à°²à±à°ªà±à°¨ à°à°à°¬à±à°°à°¾à°¯à°¿à°¡à°°à± à°à°«à±à°¸à±.\nðà°µà±à°¨à±à° à°­à°¾à°à°: à°²à±à°¤à±à°¨ U-à°à°à±, à°®à±à°¤à±à°¯à°¾à°² à°à°à°à±, à°µà°¸à±à°¤à±à°° à°²à°à±à°à°¨à±âà°²à°¤à± à°¡à±à°°à± à°à°à±à°à±, à°à°¿à°à°¦ à°¬à°à°¨à±à°² à°ªà°à±à°à±.",
        hi:"#à¤à¥à¤µà¤² à¤¸à¤¿à¤²à¤¾à¤\nà¤²à¥à¤µà¥à¤à¤¡à¤° à¤ªà¤°à¥à¤² à¤¬à¥à¤²à¤¾à¤à¤à¤¼ à¤µà¤¿à¤µà¤°à¤£â¨\nðà¤à¤¸à¥à¤¤à¥à¤¨: à¤¹à¤²à¥à¤à¥ à¤ªà¤¾à¤°à¤¦à¤°à¥à¤¶à¥ à¤ªà¤« à¤à¤°à¥à¤à¥à¤à¤à¤¼à¤¾ à¤¸à¥à¤à¤¾à¤à¤² à¤®à¥à¤ à¤¬à¤¿à¤à¤°à¥ à¤«à¥à¤²à¥à¤ à¤à¥ à¤à¤¢à¤¼à¤¾à¤ à¤à¤° à¤à¥à¤¡à¤¼à¥ à¤à¤¢à¤¼à¤¾à¤à¤¦à¤¾à¤° à¤à¤«à¥¤\nðà¤ªà¥à¤à¥: à¤à¤¹à¤°à¤¾ U-à¤à¤, à¤®à¥à¤¤à¤¿à¤¯à¥à¤ à¤à¥ à¤¬à¥à¤°à¥à¤¡à¤°, à¤à¤ªà¤¡à¤¼à¥ à¤à¥ à¤²à¤à¤à¤¨ à¤µà¤¾à¤²à¥ à¤¡à¥à¤°à¥ à¤à¤° à¤¨à¥à¤à¥ à¤¬à¤à¤¨à¥à¤ à¤à¥ à¤ªà¤à¥à¤à¥à¥¤"
      }
    },
    "6": {name:{en:"Daily wear blouse",te:"à°°à±à°à±à°µà°¾à°°à± à°¬à±à°²à±à°à±",hi:"à¤°à¥à¤à¤¼à¤¾à¤¨à¤¾ à¤ªà¤¹à¤¨à¤¨à¥ à¤µà¤¾à¤²à¤¾ à¤¬à¥à¤²à¤¾à¤à¤à¤¼"},description:{en:"Can be done according to the size blouse or measurements given",te:"à°®à± à°¬à±à°²à±à°à± à°¸à±à°à± à°²à±à°¦à°¾ à°®à±à°°à± à°à°à±à°à± à°à±à°²à°¤à°² à°ªà±à°°à°à°¾à°°à° à°à±à°à±à°à°¿ à°à°µà±à°µà°à°²à°®à±.",hi:"à¤à¤ªà¤à¥ à¤¬à¥à¤²à¤¾à¤à¤à¤¼ à¤à¥ à¤¸à¤¾à¤à¤à¤¼ à¤¯à¤¾ à¤¦à¤¿à¤ à¤à¤ à¤®à¤¾à¤ª à¤à¥ à¤à¤¨à¥à¤¸à¤¾à¤° à¤¸à¤¿à¤²à¤¾à¤ à¤à¥ à¤à¤¾ à¤¸à¤à¤¤à¥ à¤¹à¥à¥¤"}},
    "5": {name:{en:"Lehanga",te:"à°²à±à°¹à°à°à°¾",hi:"à¤²à¤¹à¤à¤à¤¾"},description:{en:"Can be stiched according to respective customer",te:"à°ªà±à°°à°¤à°¿ à°à°¸à±à°à°®à°°à± à°à°­à°¿à°°à±à°à°¿ à°®à°°à°¿à°¯à± à°à±à°²à°¤à°² à°ªà±à°°à°à°¾à°°à° à°à±à°à±à°à°¿ à°à°µà±à°µà°à°²à°®à±.",hi:"à¤¹à¤° à¤à¥à¤°à¤¾à¤¹à¤ à¤à¥ à¤ªà¤¸à¤à¤¦ à¤à¤° à¤®à¤¾à¤ª à¤à¥ à¤à¤¨à¥à¤¸à¤¾à¤° à¤¸à¤¿à¤²à¤¾à¤ à¤à¥ à¤à¤¾ à¤¸à¤à¤¤à¥ à¤¹à¥à¥¤"}},
    "4": {name:{en:"Long frock",te:"à°²à°¾à°à°à± à°«à±à°°à°¾à°à±",hi:"à¤²à¤à¤¬à¥ à¤«à¥à¤°à¥à¤"},description:{
      en:"This silhouette is an Anarkali-style Gown Suit, a traditional South Asian attire known for its flared, floor-length umbrella cut paired with a simple neck line and matching dupatta.\nStyle & Model Breakdown\nNeckline & Bodice: Features a clean scoop neck (wide U-shaped neckline) paired with a fitted chest region.\nSleeve Design: Long, full-length fitted sleeves that create a streamlined aesthetic.\nCut & Flare: High-waisted waistline featuring tight gathering that transitions into a wide, floor-length A-line flare (Umbrella cut).\nFabric & Details: Crafted with a subtle, all-over tonal floral embroidery pattern, paired with a lightweight sheer dupatta wrapped neatly around the neck.",
      te:"à°à°¦à°¿ à°à°¨à°¾à°°à±à°à°²à°¿ à°¶à±à°²à°¿à°²à±à°¨à°¿ à°à±à°¨à± à°¸à±à°à±. à°µà°¿à°¸à±à°¤à°°à°¿à°à°à± à°¨à±à°²à°¨à± à°¤à°¾à°à± à°à±à°¡à±à°à± à°à°à°¾à°°à°ªà± à°à°à±, à°¸à°°à°³à°®à±à°¨ à°®à±à°¡ à°¡à°¿à°à±à°¨à±, à°¸à°°à°¿à°ªà±à°²à± à°¦à±à°ªà°à±à°à°¾ à°¦à±à°¨à°¿à°à°¿ à°ªà±à°°à°¤à±à°¯à±à°à°¤.\nà°¶à±à°²à°¿ à°®à°°à°¿à°¯à± à°¡à°¿à°à±à°¨à± à°µà°¿à°µà°°à°¾à°²à±\nà°®à±à°¡ à°®à°°à°¿à°¯à± à°ªà±à°­à°¾à°à°: à°µà±à°¡à°²à±à°ªà±à°¨ U à°à°à°¾à°°à°ªà± à°à±à°à°¡à±à°°à°¨à°¿ à°®à±à°¡, à°¶à°°à±à°°à°¾à°¨à°¿à°à°¿ à°¸à°°à°¿à°ªà±à°¯à± à°à°¾à°¤à± à°­à°¾à°à°.\nà°à±à°¤à±à°² à°¡à°¿à°à±à°¨à±: à°¸à±à°à°¸à±à°¨ à°°à±à°ªà°¾à°¨à±à°¨à°¿ à°à°à±à°à± à°ªà±à°°à±à°¤à°¿ à°ªà±à°¡à°µà±, à°¶à°°à±à°°à°¾à°¨à°¿à°à°¿ à°¸à°°à°¿à°ªà±à°¯à± à°à±à°¤à±à°²à±.\nà°à°à± à°®à°°à°¿à°¯à± à°µà°¿à°¸à±à°¤à°°à°£: à°¨à°¡à±à°®à± à°µà°¦à±à°¦ à°®à°¡à°¤à°²à°¤à± à°®à±à°¦à°²à± à°¨à±à°²à°µà°°à°à± A-à°²à±à°¨à± à°à±à°¡à±à°à± à°à°à°¾à°°à°à°²à± à°µà°¿à°¸à±à°¤à°°à°¿à°¸à±à°¤à±à°à°¦à°¿.\nà°µà°¸à±à°¤à±à°°à° à°®à°°à°¿à°¯à± à°µà°¿à°µà°°à°¾à°²à±: à°®à±à°¤à±à°¤à° à°®à±à°¦ à°¸à±à°¨à±à°¨à°¿à°¤à°®à±à°¨ à°ªà±à°² à°à°à°¬à±à°°à°¾à°¯à°¿à°¡à°°à±, à°®à±à°¡ à°à±à°à±à°à± à°à°à±à°à°à°¾ à°µà±à°¸à±à°à±à°¨à± à°¤à±à°²à°¿à°à°ªà°¾à°à°¿ à°ªà°¾à°°à°¦à°°à±à°¶à° à°¦à±à°ªà°à±à°à°¾.",
      hi:"à¤¯à¤¹ à¤à¤¨à¤¾à¤°à¤à¤²à¥ à¤¶à¥à¤²à¥ à¤à¤¾ à¤à¤¾à¤à¤¨ à¤¸à¥à¤ à¤¹à¥à¥¤ à¤à¤¸à¤à¥ à¤ªà¤¹à¤à¤¾à¤¨ à¤¨à¥à¤à¥ à¤¤à¤ à¤«à¥à¤²à¤¾ à¤à¤¤à¤°à¥ à¤à¥à¤¸à¤¾ à¤à¥à¤°à¤¾, à¤¸à¤¾à¤¦à¤¾ à¤¨à¥à¤à¤²à¤¾à¤à¤¨ à¤à¤° à¤®à¥à¤à¤¿à¤à¤ à¤¦à¥à¤ªà¤à¥à¤à¤¾ à¤¹à¥à¥¤\nà¤¶à¥à¤²à¥ à¤à¤° à¤¡à¤¿à¤à¤¼à¤¾à¤à¤¨ à¤µà¤¿à¤µà¤°à¤£\nà¤¨à¥à¤à¤²à¤¾à¤à¤¨ à¤à¤° à¤à¤ªà¤°à¥ à¤¹à¤¿à¤¸à¥à¤¸à¤¾: à¤à¥à¤¡à¤¼à¥ U-à¤à¤à¤¾à¤° à¤à¥ à¤à¥à¤² à¤¨à¥à¤à¤²à¤¾à¤à¤¨ à¤à¤° à¤«à¤¿à¤à¥à¤¡ à¤à¥à¤¸à¥à¤ à¤­à¤¾à¤à¥¤\nà¤à¤¸à¥à¤¤à¥à¤¨: à¤¸à¤¾à¤«à¤¼ à¤à¤° à¤¸à¥à¤à¤¡à¤¼ à¤²à¥à¤ à¤¦à¥à¤¨à¥ à¤µà¤¾à¤²à¥ à¤ªà¥à¤°à¥ à¤²à¤à¤¬à¤¾à¤ à¤à¥ à¤«à¤¿à¤à¥à¤¡ à¤à¤¸à¥à¤¤à¥à¤¨à¥¤\nà¤à¤ à¤à¤° à¤à¥à¤°: à¤à¤à¤à¥ à¤à¤®à¤° à¤ªà¤° à¤¬à¤¾à¤°à¥à¤ à¤à¥à¤¨à¥à¤¨à¤à¥à¤, à¤à¥ à¤¨à¥à¤à¥ à¤¤à¤ A-à¤²à¤¾à¤à¤¨ à¤à¤¤à¤°à¥ à¤à¥à¤¸à¥ à¤à¥à¤°à¥ à¤®à¥à¤ à¤«à¥à¤²à¤¤à¥ à¤¹à¥à¤à¥¤\nà¤à¤ªà¤¡à¤¼à¤¾ à¤à¤° à¤µà¤¿à¤µà¤°à¤£: à¤ªà¥à¤°à¥ à¤à¤ªà¤¡à¤¼à¥ à¤ªà¤° à¤¹à¤²à¥à¤à¥ à¤à¥à¤¨à¤² à¤«à¥à¤²à¥à¤ à¤à¥ à¤à¤¢à¤¼à¤¾à¤ à¤à¤° à¤à¤²à¥ à¤à¥ à¤à¤¾à¤°à¥à¤ à¤à¤° à¤à¤°à¥à¤¨à¥ à¤¸à¥ à¤°à¤à¤¾ à¤¹à¤²à¥à¤à¤¾ à¤ªà¤¾à¤°à¤¦à¤°à¥à¤¶à¥ à¤¦à¥à¤ªà¤à¥à¤à¤¾à¥¤"
      }},
    "3": {name:{en:"Knee length frock",te:"à°®à±à°à°¾à°²à°¿ à°ªà±à°¡à°µà± à°«à±à°°à°¾à°à±",hi:"à¤à¥à¤à¤¨à¥ à¤¤à¤ à¤²à¤à¤¬à¥ à¤«à¥à¤°à¥à¤"},description:{en:"This elegantly stiched frock is perfectly fit for parties is gives you of an amazing look it has puff seleves with the knee length frock",te:"à°à°à°¦à°à°à°¾ à°à±à°à±à°à°¿à°¨ à° à°®à±à°à°¾à°²à°¿ à°ªà±à°¡à°µà± à°«à±à°°à°¾à°à± à°ªà°¾à°°à±à°à±à°²à°à± à°à°à±à°à°à°¾ à°¸à°°à°¿à°ªà±à°¤à±à°à°¦à°¿. à°ªà°«à± à°à±à°¤à±à°²à± à°¦à±à°¨à°¿à°à°¿ à°ªà±à°°à°¤à±à°¯à±à°à°®à±à°¨, à°à°à°°à±à°·à°£à±à°¯à°®à±à°¨ à°°à±à°ªà°¾à°¨à±à°¨à°¿ à°à°¸à±à°¤à°¾à°¯à°¿.",hi:"à¤¯à¤¹ à¤à¥à¤¬à¤¸à¥à¤°à¤¤à¥ à¤¸à¥ à¤¸à¤¿à¤²à¥ à¤à¥à¤à¤¨à¥ à¤¤à¤ à¤²à¤à¤¬à¥ à¤«à¥à¤°à¥à¤ à¤ªà¤¾à¤°à¥à¤à¤¿à¤¯à¥à¤ à¤à¥ à¤²à¤¿à¤ à¤¬à¥à¤¹à¤¤à¤°à¥à¤¨ à¤¹à¥à¥¤ à¤à¤¸à¤à¥ à¤ªà¤« à¤à¤¸à¥à¤¤à¥à¤¨ à¤à¤¸à¥ à¤à¤à¤°à¥à¤·à¤ à¤²à¥à¤ à¤¦à¥à¤¤à¥ à¤¹à¥à¤à¥¤"}},
    "2": {name:{en:"White long Dress",te:"à°¤à±à°²à±à°²à°¨à°¿ à°ªà±à°¡à°µà°¾à°à°¿ à°¡à±à°°à±à°¸à±",hi:"à¤¸à¤«à¤¼à¥à¤¦ à¤²à¤à¤¬à¥ à¤¡à¥à¤°à¥à¤¸"},description:{en:"",te:"",hi:""}},
    "1": {name:{en:"Maggam",te:"à°®à°à±à°à° à°µà°°à±à°à±",hi:"à¤®à¤à¥à¤à¤® à¤µà¤°à¥à¤"},description:{en:"",te:"",hi:""}}
  };
  let currentLanguage="en";
  TEXT=L.en;
  function catLabel(key,raw){return CL[key] ? CL[key][currentLanguage] : (currentLanguage==="en"?(raw||"Other"):CL.uncategorized[currentLanguage]);}
  function localField(d,field){const v=d[field+"_"+currentLanguage];if(v&&String(v).trim())return String(v).trim();const item=DESIGN_COPY[String(d.id||"")];if(item&&item[field]&&item[field][currentLanguage]!==undefined)return item[field][currentLanguage];return d[field]||"";}
  function applyStatic(language){
    const copy={
      en:["PARVATHI CREATIONS Â· TELANGANA","Tradition, tailored<br>to <em>you.</em>","Thoughtful stitching, intricate embroidery and occasionwear made with care â for the moments you want to remember.","Explore the collection","Made with care. Finished with love.","A LITTLE SOMETHING FOR EVERY OCCASION","01 â THE COLLECTION","Find your <em>favourite.</em>","From everyday elegance to wedding-day details, explore pieces inspired by your style.","Each custom order is discussed with you before stitching.","THE BEAUTY IS IN THE DETAILS","Made by hand.<br>Made for <em>you.</em>","From delicate threadwork to carefully finished blouses, we bring your ideas to life with patience, skill and a personal touch.","Letâs create something together <span>â</span>","WHAT WE DO","02 â OUR SERVICES","Every detail,<br><em>considered.</em>","Tell us what you have in mind. Weâll help you find the right finish, fit and details for your occasion.","Maggam work & hand embroidery","Computer embroidery","Blouse stitching & custom designs","Bridal wear, lehengas & occasionwear","Frocks, kids wear & salwar stitching","Saree tassels & finishing","YOUR IDEA, OUR CRAFT","Have something<br><em>in mind?</em>","Share your inspiration with us. Letâs talk about your design.","Chat with us on WhatsApp <span>â</span>","Where every stitch tells a story."],
      te:["à°ªà°¾à°°à±à°µà°¤à°¿ à°à±à°°à°¿à°¯à±à°·à°¨à±à°¸à± Â· à°¤à±à°²à°à°à°¾à°£","à°¸à°à°ªà±à°°à°¦à°¾à°¯à°¾à°¨à°¿à°à°¿<br><em>à°®à± à°à±à°¸à°</em> à°à°à°¦à°®à±à°¨ à°°à±à°ªà°.","à°ªà±à°°à°¤à±à°¯à±à° à°¸à°à°¦à°°à±à°­à°¾à°² à°à±à°¸à° à°¶à±à°°à°¦à±à°§à°à°¾ à°à±à°à±à°à°¿à°¨ à°¦à±à°¸à±à°¤à±à°²à±, à°à°à°¦à°®à±à°¨ à°à°à°¬à±à°°à°¾à°¯à°¿à°¡à°°à±, à°µà±à°¡à±à°à°² à°¦à±à°¸à±à°¤à±à°²à±.","à°à°²à±à°à±à°·à°¨à± à°à±à°¡à°à°¡à°¿","à°¶à±à°°à°¦à±à°§à°¤à± à°à±à°à±à°à°¿, à°ªà±à°°à±à°®à°¤à± à°ªà±à°°à±à°¤à°¿ à°à±à°¸à°¿à°¨à°µà°¿.","à°ªà±à°°à°¤à°¿ à°¸à°à°¦à°°à±à°­à°¾à°¨à°¿à°à°¿ à°ªà±à°°à°¤à±à°¯à±à°à°à°à°¾","01 â à°®à°¾ à°à°²à±à°à±à°·à°¨à±","à°®à±à°à± à°¨à°à±à°à°¿à°¨à°¦à°¿ <em>à°à°à°à±à°à±à°à°¡à°¿.</em>","à°°à±à°à±à°µà°¾à°°à± à°à°à°¦à°®à±à°¨ à°¦à±à°¸à±à°¤à±à°² à°¨à±à°à°à°¿ à°ªà±à°³à±à°²à°¿ à°ªà±à°°à°¤à±à°¯à±à° à°¡à°¿à°à±à°¨à±à°² à°µà°°à°à± à°®à± à°à°­à°¿à°°à±à°à°¿à°à°¿ à°¤à°à°¿à°¨à°µà°¿ à°à±à°¡à°à°¡à°¿.","à°à±à°à±à°à± à°ªà±à°°à°¾à°°à°à°­à°¿à°à°à± à°®à±à°à°¦à± à°ªà±à°°à°¤à°¿ à°à°¸à±à°à°®à± à°à°°à±à°¡à°°à± à°à±à°°à°¿à°à°à°¿ à°®à±à°¤à± à°à°°à±à°à°¿à°¸à±à°¤à°¾à°®à±.","à°à°à°¦à° à°ªà±à°°à°¤à°¿ à°µà°¿à°µà°°à°à°²à± à°à°à°¦à°¿","à°à±à°¤à°¿à°¤à± à°à±à°¸à°¿à°¨à°µà°¿.<br><em>à°®à± à°à±à°¸à°.</em>","à°¸à±à°¨à±à°¨à°¿à°¤à°®à±à°¨ à°¦à°¾à°°à°ªà± à°ªà°¨à±à°² à°¨à±à°à°à°¿ à°à°à±à°à°à°¾ à°ªà±à°°à±à°¤à°¿ à°à±à°¸à°¿à°¨ à°¬à±à°²à±à°à±âà°² à°µà°°à°à±, à°®à± à°à°²à±à°à°¨à°²à°¨à± à°à°°à±à°ªà± à°®à°°à°¿à°¯à± à°¨à±à°ªà±à°£à±à°¯à°à°¤à± à°°à±à°ªà±à°¦à°¿à°¦à±à°¦à±à°¤à°¾à°®à±.","à°à°²à°¿à°¸à°¿ à°à°à°¦à°®à±à°¨ à°¡à°¿à°à±à°¨à± à°à±à°¦à±à°¦à°¾à° <span>â</span>","à°®à°¾ à°¸à±à°µà°²à±","02 â à°®à°¾ à°¸à±à°µà°²à±","à°ªà±à°°à°¤à°¿ à°µà°¿à°µà°°à°¾à°¨à°¿à°à°¿<br><em>à°ªà±à°°à°¤à±à°¯à±à° à°¶à±à°°à°¦à±à°§.</em>","à°®à± à°à°²à±à°à°¨à°¨à± à°®à°¾à°¤à± à°ªà°à°à±à°à±à°à°¡à°¿. à°®à± à°¸à°à°¦à°°à±à°­à°¾à°¨à°¿à°à°¿ à°¸à°°à°¿à°ªà±à°¯à± à°«à°¿à°¨à°¿à°·à°¿à°à°à±, à°«à°¿à°à±, à°µà°¿à°µà°°à°¾à°²à°¨à± à°à°à°à±à°à±à°µà°¡à°à°²à± à°¸à°¹à°¾à°¯à°ªà°¡à°¤à°¾à°®à±.","à°®à°à±à°à° à°µà°°à±à°à± & à°à±à°¤à°¿ à°à°à°¬à±à°°à°¾à°¯à°¿à°¡à°°à±","à°à°à°ªà±à°¯à±à°à°°à± à°à°à°¬à±à°°à°¾à°¯à°¿à°¡à°°à±","à°¬à±à°²à±à°à± à°à±à°à±à°à± & à°à°¸à±à°à°®à± à°¡à°¿à°à±à°¨à±à°²à±","à°ªà±à°³à±à°²à°¿ à°¦à±à°¸à±à°¤à±à°²à±, à°²à±à°¹à±à°à°à°¾à°²à± & à°µà±à°¡à±à°à°² à°¦à±à°¸à±à°¤à±à°²à±","à°«à±à°°à°¾à°à±à°¸à±, à°ªà°¿à°²à±à°²à°² à°¦à±à°¸à±à°¤à±à°²à± & à°¸à°²à±à°µà°¾à°°à± à°à±à°à±à°à±","à°à±à°°à°² à°à°¾à°¸à±à°²à±à°¸à± & à°«à°¿à°¨à°¿à°·à°¿à°à°à±","à°®à± à°à°²à±à°à°¨ â à°®à°¾ à°¨à±à°ªà±à°£à±à°¯à°","à°®à± à°®à°¨à°¸à±à°²à±<br><em>à°à°¦à±à°¨à°¾ à°à°à°¦à°¾?</em>","à°®à±à°à± à°¨à°à±à°à°¿à°¨ à°¨à°®à±à°¨à°¾à°¨à± à°®à°¾à°¤à± à°ªà°à°à±à°à±à°à°¡à°¿. à°®à± à°¡à°¿à°à±à°¨à± à°à±à°°à°¿à°à°à°¿ à°®à°¾à°à±à°²à°¾à°¡à±à°à±à°à°¦à°¾à°.","WhatsAppà°²à± à°®à°¾à°¤à± à°®à°¾à°à±à°²à°¾à°¡à°à°¡à°¿ <span>â</span>","à°ªà±à°°à°¤à°¿ à°à±à°à±à°à±à°²à± à°à° à°à°¥ à°à°à°à±à°à°¦à°¿."],
      hi:["à¤ªà¤¾à¤°à¥à¤µà¤¤à¥ à¤à¥à¤°à¤¿à¤à¤¶à¤¨à¥à¤¸ Â· à¤¤à¥à¤²à¤à¤à¤¾à¤¨à¤¾","à¤ªà¤°à¤à¤ªà¤°à¤¾ à¤à¤¾ à¤à¤à¤¦à¤¾à¤à¤¼,<br><em>à¤à¤ªà¤à¥ à¤²à¤¿à¤à¥¤</em>","à¤à¤ªà¤à¥ à¤¯à¤¾à¤¦à¤à¤¾à¤° à¤ªà¤²à¥à¤ à¤à¥ à¤²à¤¿à¤ à¤¸à¤¾à¤µà¤§à¤¾à¤¨à¥ à¤¸à¥ à¤à¥ à¤à¤ à¤¸à¤¿à¤²à¤¾à¤, à¤¬à¤¾à¤°à¥à¤ à¤à¤¢à¤¼à¤¾à¤ à¤à¤° à¤à¤¾à¤¸ à¤ªà¤°à¤¿à¤§à¤¾à¤¨à¥¤","à¤à¤²à¥à¤à¥à¤¶à¤¨ à¤¦à¥à¤à¥à¤","à¤§à¥à¤¯à¤¾à¤¨ à¤¸à¥ à¤¬à¤¨à¤¾à¤¯à¤¾, à¤ªà¥à¤¯à¤¾à¤° à¤¸à¥ à¤ªà¥à¤°à¤¾ à¤à¤¿à¤¯à¤¾à¥¤","à¤¹à¤° à¤à¤µà¤¸à¤° à¤à¥ à¤²à¤¿à¤ à¤à¥à¤ à¤à¤¾à¤¸","01 â à¤à¤²à¥à¤à¥à¤¶à¤¨","à¤à¤ªà¤¨à¥ <em>à¤ªà¤¸à¤à¤¦ à¤à¥à¤¨à¥à¤à¥¤</em>","à¤°à¥à¤à¤¼à¤®à¤°à¥à¤°à¤¾ à¤à¥ à¤¸à¥à¤à¤¦à¤°à¤¤à¤¾ à¤¸à¥ à¤²à¥à¤à¤° à¤¶à¤¾à¤¦à¥ à¤à¥ à¤à¤¾à¤¸ à¤¡à¤¿à¤à¤¼à¤¾à¤à¤¨ à¤¤à¤, à¤à¤ªà¤¨à¥ à¤¶à¥à¤²à¥ à¤à¥ à¤à¤¨à¥à¤¸à¤¾à¤° à¤à¥à¤¨à¥à¤à¥¤","à¤¸à¤¿à¤²à¤¾à¤ à¤¶à¥à¤°à¥ à¤à¤°à¤¨à¥ à¤¸à¥ à¤ªà¤¹à¤²à¥ à¤¹à¤° à¤à¤¸à¥à¤à¤® à¤à¤°à¥à¤¡à¤° à¤ªà¤° à¤à¤ªà¤¸à¥ à¤à¤°à¥à¤à¤¾ à¤à¥ à¤à¤¾à¤¤à¥ à¤¹à¥à¥¤","à¤à¥à¤¬à¤¸à¥à¤°à¤¤à¥ à¤¬à¤¾à¤°à¥à¤à¤¿à¤¯à¥à¤ à¤®à¥à¤ à¤¹à¥","à¤¹à¤¾à¤¥à¥à¤ à¤¸à¥ à¤¬à¤¨à¤¾à¤¯à¤¾à¥¤<br><em>à¤à¤ªà¤à¥ à¤²à¤¿à¤à¥¤</em>","à¤¨à¤¾à¤à¤¼à¥à¤ à¤§à¤¾à¤à¥ à¤à¥ à¤à¤¾à¤® à¤¸à¥ à¤²à¥à¤à¤° à¤¬à¤¾à¤°à¥à¤à¥ à¤¸à¥ à¤¤à¥à¤¯à¤¾à¤° à¤¬à¥à¤²à¤¾à¤à¤à¤¼ à¤¤à¤, à¤¹à¤® à¤à¤ªà¤à¥ à¤µà¤¿à¤à¤¾à¤°à¥à¤ à¤à¥ à¤§à¥à¤°à¥à¤¯ à¤à¤° à¤à¥à¤¶à¤² à¤¸à¥ à¤¸à¤¾à¤à¤¾à¤° à¤à¤°à¤¤à¥ à¤¹à¥à¤à¥¤","à¤à¤à¤, à¤®à¤¿à¤²à¤à¤° à¤à¥à¤ à¤à¤¾à¤¸ à¤¬à¤¨à¤¾à¤à¤ <span>â</span>","à¤¹à¤®à¤¾à¤°à¥ à¤¸à¥à¤µà¤¾à¤à¤","02 â à¤¹à¤®à¤¾à¤°à¥ à¤¸à¥à¤µà¤¾à¤à¤","à¤¹à¤° à¤¬à¤¾à¤°à¥à¤à¥ à¤ªà¤°<br><em>à¤§à¥à¤¯à¤¾à¤¨à¥¤</em>","à¤à¤ªà¤¨à¤¾ à¤µà¤¿à¤à¤¾à¤° à¤¬à¤¤à¤¾à¤à¤à¥¤ à¤¹à¤® à¤à¤ªà¤à¥ à¤à¤µà¤¸à¤° à¤à¥ à¤à¤¨à¥à¤¸à¤¾à¤° à¤¸à¤¹à¥ à¤«à¤¼à¤¿à¤¨à¤¿à¤¶, à¤«à¤¿à¤ à¤à¤° à¤µà¤¿à¤µà¤°à¤£ à¤à¥à¤¨à¤¨à¥ à¤®à¥à¤ à¤®à¤¦à¤¦ à¤à¤°à¥à¤à¤à¥à¥¤","à¤®à¤à¥à¤à¤® à¤µà¤°à¥à¤ à¤à¤° à¤¹à¤¾à¤¥ à¤à¥ à¤à¤¢à¤¼à¤¾à¤","à¤à¤à¤ªà¥à¤¯à¥à¤à¤° à¤à¤¢à¤¼à¤¾à¤","à¤¬à¥à¤²à¤¾à¤à¤à¤¼ à¤¸à¤¿à¤²à¤¾à¤ à¤à¤° à¤à¤¸à¥à¤à¤® à¤¡à¤¿à¤à¤¼à¤¾à¤à¤¨","à¤¶à¤¾à¤¦à¥ à¤à¥ à¤ªà¤°à¤¿à¤§à¤¾à¤¨, à¤²à¤¹à¤à¤à¥ à¤à¤° à¤à¤¾à¤¸ à¤à¤ªà¤¡à¤¼à¥","à¤«à¥à¤°à¥à¤, à¤¬à¤à¥à¤à¥à¤ à¤à¥ à¤à¤ªà¤¡à¤¼à¥ à¤à¤° à¤¸à¤²à¤µà¤¾à¤° à¤¸à¤¿à¤²à¤¾à¤","à¤¸à¤¾à¤¡à¤¼à¥ à¤à¥ à¤²à¤à¤à¤¨ à¤à¤° à¤«à¤¼à¤¿à¤¨à¤¿à¤¶à¤¿à¤à¤","à¤à¤ªà¤à¤¾ à¤µà¤¿à¤à¤¾à¤°, à¤¹à¤®à¤¾à¤°à¤¾ à¤¹à¥à¤¨à¤°","à¤à¥à¤ à¤à¤¾à¤¸<br><em>à¤¸à¥à¤à¤¾ à¤¹à¥?</em>","à¤à¤ªà¤¨à¥ à¤ªà¤¸à¤à¤¦ à¤¹à¤®à¥à¤ à¤¦à¤¿à¤à¤¾à¤à¤à¥¤ à¤à¤ªà¤à¥ à¤¡à¤¿à¤à¤¼à¤¾à¤à¤¨ à¤à¥ à¤¬à¤¾à¤°à¥ à¤®à¥à¤ à¤¬à¤¾à¤¤ à¤à¤°à¥à¤à¥¤","WhatsApp à¤ªà¤° à¤¬à¤¾à¤¤ à¤à¤°à¥à¤ <span>â</span>","à¤¹à¤° à¤¸à¤¿à¤²à¤¾à¤ à¤à¤ à¤à¤¹à¤¾à¤¨à¥ à¤à¤¹à¤¤à¥ à¤¹à¥."]
    }[language];
    const sel=[".hero-copy .eyebrow",".hero-copy h1",".hero-description",".hero-copy .button-dark",".hero-note",".collection .section-topline .eyebrow",".collection .section-topline .section-index",".collection .section-heading-row h2",".collection .section-heading-row > p",".photo-disclaimer",".craft-copy .eyebrow",".craft-copy h2",".craft-copy > p:not(.eyebrow)",".craft-copy .text-link",".services .section-topline .eyebrow",".services .section-topline .section-index",".services-heading h2",".services-heading > p",".service-list h3:nth-of-type(1)",".service-list h3:nth-of-type(2)",".service-list h3:nth-of-type(3)",".service-list h3:nth-of-type(4)",".service-list h3:nth-of-type(5)",".service-list h3:nth-of-type(6)",".contact-band .eyebrow",".contact-band h2",".contact-band > p:not(.eyebrow)",".contact-band .button",".footer-brand + p"];
    sel.forEach((s,i)=>{const n=document.querySelector(s);if(n&&copy[i]!==undefined)n.innerHTML=copy[i];});
    document.querySelectorAll(".service-list h3").forEach((n,i)=>{const k="service"+(i+1);const lists={en:["Maggam work & hand embroidery","Computer embroidery","Blouse stitching & custom designs","Bridal wear, lehengas & occasionwear","Frocks, kids wear & salwar stitching","Saree tassels & finishing"],te:["à°®à°à±à°à° à°µà°°à±à°à± & à°à±à°¤à°¿ à°à°à°¬à±à°°à°¾à°¯à°¿à°¡à°°à±","à°à°à°ªà±à°¯à±à°à°°à± à°à°à°¬à±à°°à°¾à°¯à°¿à°¡à°°à±","à°¬à±à°²à±à°à± à°à±à°à±à°à± & à°à°¸à±à°à°®à± à°¡à°¿à°à±à°¨à±à°²à±","à°ªà±à°³à±à°²à°¿ à°¦à±à°¸à±à°¤à±à°²à±, à°²à±à°¹à±à°à°à°¾à°²à± & à°µà±à°¡à±à°à°² à°¦à±à°¸à±à°¤à±à°²à±","à°«à±à°°à°¾à°à±à°¸à±, à°ªà°¿à°²à±à°²à°² à°¦à±à°¸à±à°¤à±à°²à± & à°¸à°²à±à°µà°¾à°°à± à°à±à°à±à°à±","à°à±à°°à°² à°à°¾à°¸à±à°²à±à°¸à± & à°«à°¿à°¨à°¿à°·à°¿à°à°à±"],hi:["à¤®à¤à¥à¤à¤® à¤µà¤°à¥à¤ à¤à¤° à¤¹à¤¾à¤¥ à¤à¥ à¤à¤¢à¤¼à¤¾à¤","à¤à¤à¤ªà¥à¤¯à¥à¤à¤° à¤à¤¢à¤¼à¤¾à¤","à¤¬à¥à¤²à¤¾à¤à¤à¤¼ à¤¸à¤¿à¤²à¤¾à¤ à¤à¤° à¤à¤¸à¥à¤à¤® à¤¡à¤¿à¤à¤¼à¤¾à¤à¤¨","à¤¶à¤¾à¤¦à¥ à¤à¥ à¤ªà¤°à¤¿à¤§à¤¾à¤¨, à¤²à¤¹à¤à¤à¥ à¤à¤° à¤à¤¾à¤¸ à¤à¤ªà¤¡à¤¼à¥","à¤«à¥à¤°à¥à¤, à¤¬à¤à¥à¤à¥à¤ à¤à¥ à¤à¤ªà¤¡à¤¼à¥ à¤à¤° à¤¸à¤²à¤µà¤¾à¤° à¤¸à¤¿à¤²à¤¾à¤","à¤¸à¤¾à¤¡à¤¼à¥ à¤à¥ à¤²à¤à¤à¤¨ à¤à¤° à¤«à¤¼à¤¿à¤¨à¤¿à¤¶à¤¿à¤à¤"]};n.textContent=lists[language][i]||n.textContent;});
    const nav={en:["Home","Collection","Our Craft","Services","Contact"],te:["à°¹à±à°®à±","à°à°²à±à°à±à°·à°¨à±","à°®à°¾ à°à°³","à°¸à±à°µà°²à±","à°¸à°à°ªà±à°°à°¦à°¿à°à°à°à°¡à°¿"],hi:["à¤¹à¥à¤®","à¤à¤²à¥à¤à¥à¤¶à¤¨","à¤¹à¤®à¤¾à¤°à¥ à¤à¤²à¤¾","à¤¸à¥à¤µà¤¾à¤à¤","à¤¸à¤à¤ªà¤°à¥à¤"]}[language];
    document.querySelectorAll(".main-nav a").forEach((n,i)=>{if(nav[i])n.textContent=nav[i];});
    const f=document.querySelectorAll(".footer-links a");const ft={en:["Collection","Services","Contact","Instagram â","Owner login"],te:["à°à°²à±à°à±à°·à°¨à±","à°¸à±à°µà°²à±","à°¸à°à°ªà±à°°à°¦à°¿à°à°ªà±","à°à°¨à±âà°¸à±à°à°¾à°à±à°°à°¾à°®à± â","à°¯à°à°®à°¾à°¨à°¿ à°²à°¾à°à°¿à°¨à±"],hi:["à¤à¤²à¥à¤à¥à¤¶à¤¨","à¤¸à¥à¤µà¤¾à¤à¤","à¤¸à¤à¤ªà¤°à¥à¤","à¤à¤à¤¸à¥à¤à¤¾à¤à¥à¤°à¤¾à¤® â","à¤®à¤¾à¤²à¤¿à¤ à¤²à¥à¤à¤¿à¤¨"]}[language];f.forEach((n,i)=>{if(ft[i])n.textContent=ft[i];});
    const c=document.querySelector(".site-footer small");if(c)c.innerHTML="Â© <span id='year'>"+new Date().getFullYear()+"</span> "+({en:"Parvathi Creations. Made with care.",te:"à°ªà°¾à°°à±à°µà°¤à°¿ à°à±à°°à°¿à°¯à±à°·à°¨à±à°¸à±. à°¶à±à°°à°¦à±à°§à°¤à± à°°à±à°ªà±à°à°¦à°¿à°à°à°¬à°¡à°¿à°à°¦à°¿.",hi:"à¤ªà¤¾à¤°à¥à¤µà¤¤à¥ à¤à¥à¤°à¤¿à¤à¤¶à¤¨à¥à¤¸à¥¤ à¤ªà¥à¤¯à¤¾à¤° à¤¸à¥ à¤¬à¤¨à¤¾à¤¯à¤¾ à¤à¤¯à¤¾à¥¤"}[language]);
    const fallback=document.querySelector("noscript .gallery-status");if(fallback)fallback.textContent=language==="en"?"Please turn on JavaScript to see our design gallery, or message us on WhatsApp.":language==="te"?"à°¡à°¿à°à±à°¨à± à°à±à°¯à°¾à°²à°°à±à°¨à°¿ à°à±à°¡à°à°¾à°¨à°¿à°à°¿ JavaScript à°à°¨à± à°à±à°¯à°à°¡à°¿ à°²à±à°¦à°¾ WhatsAppà°²à± à°¸à°à°¦à±à°¶à° à°ªà°à°ªà°à°¡à°¿.":"à¤¡à¤¿à¤à¤¼à¤¾à¤à¤¨ à¤à¥à¤²à¤°à¥ à¤¦à¥à¤à¤¨à¥ à¤à¥ à¤²à¤¿à¤ JavaScript à¤à¤¾à¤²à¥ à¤à¤°à¥à¤ à¤¯à¤¾ WhatsApp à¤ªà¤° à¤¸à¤à¤¦à¥à¤¶ à¤­à¥à¤à¥à¤.";
    const meta=document.querySelector('meta[name="description"]');if(meta)meta.content=({en:"Parvathi Creations â custom blouses, maggam work, embroidery, bridal wear, frocks and handcrafted tailoring in Telangana.",te:"à°ªà°¾à°°à±à°µà°¤à°¿ à°à±à°°à°¿à°¯à±à°·à°¨à±à°¸à± â à°¬à±à°²à±à°à±âà°²à±, à°®à°à±à°à° à°µà°°à±à°à±, à°à°à°¬à±à°°à°¾à°¯à°¿à°¡à°°à±, à°ªà±à°³à±à°²à°¿ à°¦à±à°¸à±à°¤à±à°²à±, à°«à±à°°à°¾à°à±à°¸à± à°®à°°à°¿à°¯à± à°à±à°à±à°à± à°¸à±à°µà°²à±.",hi:"à¤ªà¤¾à¤°à¥à¤µà¤¤à¥ à¤à¥à¤°à¤¿à¤à¤¶à¤¨à¥à¤¸ â à¤à¤¸à¥à¤à¤® à¤¬à¥à¤²à¤¾à¤à¤à¤¼, à¤®à¤à¥à¤à¤® à¤µà¤°à¥à¤, à¤à¤¢à¤¼à¤¾à¤, à¤¶à¤¾à¤¦à¥ à¤à¥ à¤ªà¤°à¤¿à¤§à¤¾à¤¨, à¤«à¥à¤°à¥à¤ à¤à¤° à¤¸à¤¿à¤²à¤¾à¤ à¤¸à¥à¤µà¤¾à¤à¤à¥¤"}[language]);
    document.title=({en:"Parvathi Creations | Thoughtfully Made, Beautifully Yours",te:"à°ªà°¾à°°à±à°µà°¤à°¿ à°à±à°°à°¿à°¯à±à°·à°¨à±à°¸à± | à°®à± à°à±à°¸à° à°ªà±à°°à±à°®à°¤à± à°°à±à°ªà±à°à°¦à°¿à°à°à°¿à°¨à°µà°¿",hi:"à¤ªà¤¾à¤°à¥à¤µà¤¤à¥ à¤à¥à¤°à¤¿à¤à¤¶à¤¨à¥à¤¸ | à¤à¤ªà¤à¥ à¤²à¤¿à¤ à¤ªà¥à¤¯à¤¾à¤° à¤¸à¥ à¤¤à¥à¤¯à¤¾à¤°"}[language]);
    const kicker=document.querySelector(".hero-slide-kicker");if(kicker)kicker.textContent=language==="en"?"MADE WITH CARE":language==="te"?"à°¶à±à°°à°¦à±à°§à°¤à± à°°à±à°ªà±à°à°¦à°¿à°à°à°¬à°¡à°¿à°à°¦à°¿":"à¤§à¥à¤¯à¤¾à¤¨ à¤¸à¥ à¤¬à¤¨à¤¾à¤¯à¤¾ à¤à¤¯à¤¾";
    const filters=document.getElementById("galleryFilters");if(filters)filters.setAttribute("aria-label",language==="en"?"Filter designs by category":language==="te"?"à°µà°°à±à°à° à°à°§à°¾à°°à°à°à°¾ à°¡à°¿à°à±à°¨à±à°²à°¨à± à°µà°¡à°ªà±à°¸à°à°¡à°¿":"à¤¶à¥à¤°à¥à¤£à¥ à¤à¥ à¤à¤¨à¥à¤¸à¤¾à¤° à¤¡à¤¿à¤à¤¼à¤¾à¤à¤¨ à¤à¤¾à¤à¤à¥à¤");
    const navEl=document.querySelector(".main-nav");if(navEl)navEl.setAttribute("aria-label",language==="en"?"Main navigation":language==="te"?"à°ªà±à°°à°§à°¾à°¨ à°¨à°¾à°µà°¿à°à±à°·à°¨à±":"à¤®à¥à¤à¥à¤¯ à¤¨à¥à¤µà¤¿à¤à¥à¤¶à¤¨");
    const lab=document.querySelector(".language-picker label");if(lab)lab.textContent=language==="en"?"ð Language / à°­à°¾à°· / à¤­à¤¾à¤·à¤¾":language==="te"?"ð à°­à°¾à°· / Language / à¤­à¤¾à¤·à¤¾":"ð à¤­à¤¾à¤·à¤¾ / Language / à°­à°¾à°·";
    const cta=document.querySelector(".header-cta");if(cta)cta.innerHTML=({en:"Enquire",te:"à°µà°¿à°µà°°à°¾à°²à± à°à°¡à°à°à°¡à°¿",hi:"à¤ªà¥à¤à¤¤à¤¾à¤ à¤à¤°à¥à¤"}[language])+" <span>â</span>";
  }
  function updateStaticWhatsAppLinks(language) {
    const messages = {
      en:["Hello Parvathi Creations, Iâd like to enquire about a design.","Hello Parvathi Creations, Iâd like to discuss a custom design.","Hello Parvathi Creations, Iâd like to enquire about a custom order."],
      te:["à°¨à°®à°¸à±à°à°¾à°°à° à°ªà°¾à°°à±à°µà°¤à°¿ à°à±à°°à°¿à°¯à±à°·à°¨à±à°¸à±, à°à° à°¡à°¿à°à±à°¨à± à°à±à°°à°¿à°à°à°¿ à°µà°¿à°µà°°à°¾à°²à± à°à°¾à°µà°¾à°²à°¿.","à°¨à°®à°¸à±à°à°¾à°°à° à°ªà°¾à°°à±à°µà°¤à°¿ à°à±à°°à°¿à°¯à±à°·à°¨à±à°¸à±, à°à°¸à±à°à°®à± à°¡à°¿à°à±à°¨à± à°à±à°°à°¿à°à°à°¿ à°®à°¾à°à±à°²à°¾à°¡à°¾à°²à°¨à±à°à±à°à°à±à°¨à±à°¨à°¾à°¨à±.","à°¨à°®à°¸à±à°à°¾à°°à° à°ªà°¾à°°à±à°µà°¤à°¿ à°à±à°°à°¿à°¯à±à°·à°¨à±à°¸à±, à°à°¸à±à°à°®à± à°à°°à±à°¡à°°à± à°à±à°°à°¿à°à°à°¿ à°µà°¿à°µà°°à°¾à°²à± à°à°¾à°µà°¾à°²à°¿."],
      hi:["à¤¨à¤®à¤¸à¥à¤¤à¥ à¤ªà¤¾à¤°à¥à¤µà¤¤à¥ à¤à¥à¤°à¤¿à¤à¤¶à¤¨à¥à¤¸, à¤®à¥à¤à¥ à¤à¤ à¤¡à¤¿à¤à¤¼à¤¾à¤à¤¨ à¤à¥ à¤¬à¤¾à¤°à¥ à¤®à¥à¤ à¤à¤¾à¤¨à¤à¤¾à¤°à¥ à¤à¤¾à¤¹à¤¿à¤à¥¤","à¤¨à¤®à¤¸à¥à¤¤à¥ à¤ªà¤¾à¤°à¥à¤µà¤¤à¥ à¤à¥à¤°à¤¿à¤à¤¶à¤¨à¥à¤¸, à¤®à¥à¤ à¤à¤¸à¥à¤à¤® à¤¡à¤¿à¤à¤¼à¤¾à¤à¤¨ à¤ªà¤° à¤à¤°à¥à¤à¤¾ à¤à¤°à¤¨à¤¾ à¤à¤¾à¤¹à¤¤à¥ à¤¹à¥à¤à¥¤","à¤¨à¤®à¤¸à¥à¤¤à¥ à¤ªà¤¾à¤°à¥à¤µà¤¤à¥ à¤à¥à¤°à¤¿à¤à¤¶à¤¨à¥à¤¸, à¤®à¥à¤à¥ à¤à¤¸à¥à¤à¤® à¤à¤°à¥à¤¡à¤° à¤à¥ à¤¬à¤¾à¤°à¥ à¤®à¥à¤ à¤à¤¾à¤¨à¤à¤¾à¤°à¥ à¤à¤¾à¤¹à¤¿à¤à¥¤"]
    }[language];
    const links=document.querySelectorAll('a[href*="wa.me/"]');
    links.forEach(a=>{
      let i=0;
      if(a.dataset.pcWaType){i=Number(a.dataset.pcWaType)||0;}
      else {
        const href=a.getAttribute("href")||"";
        if(href.includes("discuss%20a%20custom%20design"))i=1;else if(href.includes("custom%20order"))i=2;
        a.dataset.pcWaType=String(i);
      }
      a.setAttribute("href","https://wa.me/"+WHATSAPP_NUMBER+"?text="+encodeURIComponent(messages[i]));
    });
  }
  window.changeLanguage=function(language){
    if(!L[language])return;
    currentLanguage=language;TEXT=L[language];
    try{localStorage.setItem("parvathiLanguage",language);}catch(e){}
    document.documentElement.lang=language;
    const selector=document.getElementById("languageSelect");if(selector)selector.value=language;
    applyStatic(language);
    updateStaticWhatsAppLinks(language);
    if(el.filters)el.filters.replaceChildren(...[ {key:"all",label:TEXT.all},...cats.list.map(c=>({key:c.key,label:(CL[c.key]&&CL[c.key][language])||c.label}))].map(c=>{const b=document.createElement("button");b.type="button";b.className="filter-btn";b.dataset.filter=c.key;b.textContent=c.label;b.setAttribute("aria-pressed",String(c.key===state.category));if(c.key===state.category)b.classList.add("active");return b;}));
    if(el.search){el.search.placeholder=TEXT.searchPlaceholder;el.search.setAttribute("aria-label",TEXT.searchLabel);}
    if(el.sort){const v=el.sort.value||state.sort;el.sort.replaceChildren(new Option(TEXT.sortNewest,"newest"),new Option(TEXT.sortOldest,"oldest"),new Option(TEXT.sortName,"name"));el.sort.value=v;el.sort.setAttribute("aria-label",TEXT.sortLabel);}
    if(el.featured)el.featured.textContent=TEXT.featuredOnly;
    if(state.status==="ready"&&el.grid)render();else if(el.grid&&state.status==="loading")render();
    if(state.designs.length)initHeroSlider(state.designs);
  };
  if (document.readyState==="loading") document.addEventListener("DOMContentLoaded",init,{once:true}); else init();
  function initSavedLanguage(){let language="en";try{const s=localStorage.getItem("parvathiLanguage");if(s&&L[s])language=s;}catch(e){}window.changeLanguage(language);}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",initSavedLanguage,{once:true});else initSavedLanguage();

})();
