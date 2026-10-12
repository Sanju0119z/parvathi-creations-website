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
    if (design.price) parts.push(TEXT.price + " ₹" + design.price);
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
    close.textContent = "×";
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
    price.textContent = design.price ? "₹" + design.price : TEXT.priceOnEnquiry;
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
      image.alt = [design.name, design.categoryLabel, "Parvathi Creations design"].filter(Boolean).join(" — ");
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
    en:{all:"All Designs",loading:"Loading designs…",errorTitle:"We couldn’t load the designs right now.",errorHelp:"Please check your connection and try again.",retry:"Try again",emptyTitle:"Our design gallery is being updated.",emptyHelp:"New designs will appear here soon. In the meantime, message us on WhatsApp to see our latest work.",noMatchTitle:"No designs match your choices.",noMatchHelp:"Try another category or search, or clear the filters.",clearFilters:"Clear filters",featured:"★ Featured",featuredOnly:"★ Featured only",searchLabel:"Search designs",searchPlaceholder:"Search designs…",sortLabel:"Sort designs",sortNewest:"Newest first",sortOldest:"Oldest first",sortName:"Name A–Z",photoUnavailable:"Photo unavailable",like:"♡ I Like This Design",liked:"♥ Liked",enquire:"Enquire on WhatsApp",contactUnavailable:"The WhatsApp contact number is not available right now.",description:"Description",priceOnEnquiry:"Price available on enquiry",moreDetails:"Please contact us for more details about this design.",closeDetails:"Close design details",coverPhoto:"Cover photo",photo:"Photo",design:"design",viewDetails:"View details for",whatsappHello:"Hello Parvathi Creations! I’m interested in this design:",designCode:"Design code:",price:"Price:",descriptionPrefix:"Description:",image:"Image:",shareDetails:"Please share details.",showing:function(n,total){return "Showing "+n+" of "+total+" design"+(total===1?"":"s");}},
    te:{all:"అన్ని డిజైన్లు",loading:"డిజైన్లు లోడ్ అవుతున్నాయి…",errorTitle:"ప్రస్తుతం డిజైన్లను లోడ్ చేయలేకపోయాము.",errorHelp:"ఇంటర్నెట్ కనెక్షన్ తనిఖీ చేసి మళ్లీ ప్రయత్నించండి.",retry:"మళ్లీ ప్రయత్నించండి",emptyTitle:"మా డిజైన్ గ్యాలరీ నవీకరించబడుతోంది.",emptyHelp:"కొత్త డిజైన్లు త్వరలో ఇక్కడ కనిపిస్తాయి. మా తాజా పనిని చూడటానికి WhatsAppలో సందేశం పంపండి.",noMatchTitle:"మీ ఎంపికలకు సరిపోయే డిజైన్లు లేవు.",noMatchHelp:"మరొక వర్గాన్ని ప్రయత్నించండి లేదా ఫిల్టర్లను తొలగించండి.",clearFilters:"ఫిల్టర్లను తొలగించండి",featured:"★ ప్రత్యేక డిజైన్",featuredOnly:"★ ప్రత్యేక డిజైన్లు మాత్రమే",searchLabel:"డిజైన్లను వెతకండి",searchPlaceholder:"డిజైన్లను వెతకండి…",sortLabel:"డిజైన్ల క్రమం",sortNewest:"కొత్తవి ముందు",sortOldest:"పాతవి ముందు",sortName:"పేరు A–Z",photoUnavailable:"ఫోటో అందుబాటులో లేదు",like:"♡ ఈ డిజైన్ నచ్చింది",liked:"♥ నచ్చింది",enquire:"WhatsAppలో వివరాలు అడగండి",contactUnavailable:"ప్రస్తుతం WhatsApp నంబర్ అందుబాటులో లేదు.",description:"వివరణ",priceOnEnquiry:"ధర కోసం సంప్రదించండి",moreDetails:"ఈ డిజైన్ గురించి మరిన్ని వివరాల కోసం మమ్మల్ని సంప్రదించండి.",closeDetails:"డిజైన్ వివరాలను మూసివేయండి",coverPhoto:"ప్రధాన ఫోటో",photo:"ఫోటో",design:"డిజైన్",viewDetails:"వివరాలు చూడండి:",whatsappHello:"నమస్కారం Parvathi Creations! ఈ డిజైన్ గురించి తెలుసుకోవాలనుకుంటున్నాను:",designCode:"డిజైన్ కోడ్:",price:"ధర:",descriptionPrefix:"వివరణ:",image:"చిత్రం:",shareDetails:"దయచేసి వివరాలు తెలియజేయండి.",showing:function(n,total){return total+" డిజైన్లలో "+n+" చూపిస్తున్నాం";}},
    hi:{all:"सभी डिज़ाइन",loading:"डिज़ाइन लोड हो रहे हैं…",errorTitle:"अभी डिज़ाइन लोड नहीं हो सके।",errorHelp:"कृपया इंटरनेट कनेक्शन जाँचकर फिर कोशिश करें।",retry:"फिर कोशिश करें",emptyTitle:"हमारी डिज़ाइन गैलरी अपडेट हो रही है।",emptyHelp:"नए डिज़ाइन जल्द दिखेंगे। हमारा नया काम देखने के लिए WhatsApp पर संदेश भेजें।",noMatchTitle:"आपकी पसंद से मेल खाते डिज़ाइन नहीं मिले।",noMatchHelp:"दूसरी श्रेणी आज़माएँ या फ़िल्टर हटाएँ।",clearFilters:"फ़िल्टर हटाएँ",featured:"★ खास डिज़ाइन",featuredOnly:"केवल खास डिज़ाइन",searchLabel:"डिज़ाइन खोजें",searchPlaceholder:"डिज़ाइन खोजें…",sortLabel:"डिज़ाइन क्रम",sortNewest:"नए पहले",sortOldest:"पुराने पहले",sortName:"नाम A–Z",photoUnavailable:"फ़ोटो उपलब्ध नहीं",like:"♡ यह डिज़ाइन पसंद है",liked:"♥ पसंद किया",enquire:"WhatsApp पर पूछें",contactUnavailable:"अभी WhatsApp नंबर उपलब्ध नहीं है।",description:"विवरण",priceOnEnquiry:"कीमत के लिए पूछें",moreDetails:"इस डिज़ाइन के बारे में अधिक जानकारी के लिए हमसे संपर्क करें।",closeDetails:"डिज़ाइन विवरण बंद करें",coverPhoto:"मुख्य फ़ोटो",photo:"फ़ोटो",design:"डिज़ाइन",viewDetails:"विवरण देखें:",whatsappHello:"नमस्ते Parvathi Creations! मुझे यह डिज़ाइन पसंद है:",designCode:"डिज़ाइन कोड:",price:"कीमत:",descriptionPrefix:"विवरण:",image:"चित्र:",shareDetails:"कृपया जानकारी साझा करें।",showing:function(n,total){return total+" में से "+n+" डिज़ाइन दिख रहे हैं";}}
  };
  const CL = {
    maggam:{en:"Maggam Work",te:"మగ్గం వర్క్",hi:"मग्गम वर्क"},computer:{en:"Computer Embroidery",te:"కంప్యూటర్ ఎంబ్రాయిడరీ",hi:"कंप्यूटर कढ़ाई"},blouse:{en:"Blouse Designs",te:"బ్లౌజ్ డిజైన్లు",hi:"ब्लाउज़ डिज़ाइन"},designer:{en:"Designer Wear",te:"డిజైనర్ దుస్తులు",hi:"डिज़ाइनर परिधान"},frocks:{en:"Frocks",te:"ఫ్రాక్స్",hi:"फ्रॉक"},lehenga:{en:"Designer Lehengas",te:"డిజైనర్ లెహెంగాలు",hi:"डिज़ाइनर लहंगे"},bridal:{en:"Wedding Wear",te:"పెళ్లి దుస్తులు",hi:"शादी के परिधान"},kids:{en:"Kids Wear",te:"పిల్లల దుస్తులు",hi:"बच्चों के कपड़े"},saree:{en:"Sarees & Tassels",te:"చీరలు & టాసెల్స్",hi:"साड़ियाँ और लटकन"},custom:{en:"Custom Designs",te:"కస్టమ్ డిజైన్లు",hi:"कस्टम डिज़ाइन"},uncategorized:{en:"Other",te:"ఇతరాలు",hi:"अन्य"}
  };
  const DESIGN_COPY = {
    "7": {
      name:{en:"Sweetheart Blouse",te:"స్వీట్‌హార్ట్ బ్లౌజ్",hi:"स्वीटहार्ट ब्लाउज़"},
      description:{
        en:"#Stiching only\nLavender Pearl Blouse Details✨\n💜Sleeve:Sheer puff organza style with scattered floral embroidery and wide embroidered cuffs.\n💜Back:Deep U-cut,pearl border,dori tie-up with fabric latkans,lower button placket.",
        te:"#కుట్టు మాత్రమే\nలావెండర్ పెర్ల్ బ్లౌజ్ వివరాలు✨\n💜చేతులు: అక్కడక్కడ పూల ఎంబ్రాయిడరీతో పారదర్శక పఫ్ ఆర్గంజా చేతులు, వెడల్పైన ఎంబ్రాయిడరీ కఫ్స్.\n💜వెనుక భాగం: లోతైన U-కట్, ముత్యాల అంచు, వస్త్ర లట్కన్‌లతో డోరీ కట్టు, కింద బటన్ల పట్టీ.",
        hi:"#केवल सिलाई\nलैवेंडर पर्ल ब्लाउज़ विवरण✨\n💜आस्तीन: हल्के पारदर्शी पफ ऑर्गेंज़ा स्टाइल में बिखरी फूलों की कढ़ाई और चौड़े कढ़ाईदार कफ।\n💜पीछे: गहरा U-कट, मोतियों की बॉर्डर, कपड़े की लटकन वाली डोरी और नीचे बटनों की पट्टी।"
      }
    },
    "6": {name:{en:"Daily wear blouse",te:"రోజువారీ బ్లౌజ్",hi:"रोज़ाना पहनने वाला ब्लाउज़"},description:{en:"Can be done according to the size blouse or measurements given",te:"మీ బ్లౌజ్ సైజు లేదా మీరు ఇచ్చే కొలతల ప్రకారం కుట్టి ఇవ్వగలము.",hi:"आपके ब्लाउज़ के साइज़ या दिए गए माप के अनुसार सिलाई की जा सकती है।"}},
    "5": {name:{en:"Lehanga",te:"లెహంగా",hi:"लहंगा"},description:{en:"Can be stiched according to respective customer",te:"ప్రతి కస్టమర్ అభిరుచి మరియు కొలతల ప్రకారం కుట్టి ఇవ్వగలము.",hi:"हर ग्राहक की पसंद और माप के अनुसार सिलाई की जा सकती है।"}},
    "4": {name:{en:"Long frock",te:"లాంగ్ ఫ్రాక్",hi:"लंबी फ्रॉक"},description:{
      en:"This silhouette is an Anarkali-style Gown Suit, a traditional South Asian attire known for its flared, floor-length umbrella cut paired with a simple neck line and matching dupatta.\nStyle & Model Breakdown\nNeckline & Bodice: Features a clean scoop neck (wide U-shaped neckline) paired with a fitted chest region.\nSleeve Design: Long, full-length fitted sleeves that create a streamlined aesthetic.\nCut & Flare: High-waisted waistline featuring tight gathering that transitions into a wide, floor-length A-line flare (Umbrella cut).\nFabric & Details: Crafted with a subtle, all-over tonal floral embroidery pattern, paired with a lightweight sheer dupatta wrapped neatly around the neck.",
      te:"ఇది అనార్కలి శైలిలోని గౌన్ సూట్. విస్తరించే నేలను తాకే గొడుగు ఆకారపు కట్, సరళమైన మెడ డిజైన్, సరిపోలే దుపట్టా దీనికి ప్రత్యేకత.\nశైలి మరియు డిజైన్ వివరాలు\nమెడ మరియు పైభాగం: వెడల్పైన U ఆకారపు గుండ్రని మెడ, శరీరానికి సరిపోయే ఛాతీ భాగం.\nచేతుల డిజైన్: సొగసైన రూపాన్ని ఇచ్చే పూర్తి పొడవు, శరీరానికి సరిపోయే చేతులు.\nకట్ మరియు విస్తరణ: నడుము వద్ద మడతలతో మొదలై నేలవరకు A-లైన్ గొడుగు ఆకారంలో విస్తరిస్తుంది.\nవస్త్రం మరియు వివరాలు: మొత్తం మీద సున్నితమైన పూల ఎంబ్రాయిడరీ, మెడ చుట్టూ చక్కగా వేసుకునే తేలికపాటి పారదర్శక దుపట్టా.",
      hi:"यह अनारकली शैली का गाउन सूट है। इसकी पहचान नीचे तक फैला छतरी जैसा घेरा, सादा नेकलाइन और मैचिंग दुपट्टा है।\nशैली और डिज़ाइन विवरण\nनेकलाइन और ऊपरी हिस्सा: चौड़ी U-आकार की गोल नेकलाइन और फिटेड चेस्ट भाग।\nआस्तीन: साफ़ और सुघड़ लुक देने वाली पूरी लंबाई की फिटेड आस्तीन।\nकट और घेर: ऊँची कमर पर बारीक चुन्नटें, जो नीचे तक A-लाइन छतरी जैसे घेरे में फैलती हैं।\nकपड़ा और विवरण: पूरे कपड़े पर हल्की टोनल फूलों की कढ़ाई और गले के चारों ओर करीने से रखा हल्का पारदर्शी दुपट्टा।"
      }},
    "3": {name:{en:"Knee length frock",te:"మోకాలి పొడవు ఫ్రాక్",hi:"घुटने तक लंबी फ्रॉक"},description:{en:"This elegantly stiched frock is perfectly fit for parties is gives you of an amazing look it has puff seleves with the knee length frock",te:"అందంగా కుట్టిన ఈ మోకాలి పొడవు ఫ్రాక్ పార్టీలకు చక్కగా సరిపోతుంది. పఫ్ చేతులు దీనికి ప్రత్యేకమైన, ఆకర్షణీయమైన రూపాన్ని ఇస్తాయి.",hi:"यह खूबसूरती से सिली घुटने तक लंबी फ्रॉक पार्टियों के लिए बेहतरीन है। इसकी पफ आस्तीन इसे आकर्षक लुक देती हैं।"}},
    "2": {name:{en:"White long Dress",te:"తెల్లని పొడవాటి డ్రెస్",hi:"सफ़ेद लंबी ड्रेस"},description:{en:"",te:"",hi:""}},
    "1": {name:{en:"Maggam",te:"మగ్గం వర్క్",hi:"मग्गम वर्क"},description:{en:"",te:"",hi:""}}
  };
  let currentLanguage="en";
  TEXT=L.en;
  function catLabel(key,raw){return CL[key] ? CL[key][currentLanguage] : (currentLanguage==="en"?(raw||"Other"):CL.uncategorized[currentLanguage]);}
  function localField(d,field){const v=d[field+"_"+currentLanguage];if(v&&String(v).trim())return String(v).trim();const item=DESIGN_COPY[String(d.id||"")];if(item&&item[field]&&item[field][currentLanguage]!==undefined)return item[field][currentLanguage];return d[field]||"";}
  function applyStatic(language){
    const copy={
      en:["PARVATHI CREATIONS · TELANGANA","Tradition, tailored<br>to <em>you.</em>","Thoughtful stitching, intricate embroidery and occasionwear made with care — for the moments you want to remember.","Explore the collection","Made with care. Finished with love.","A LITTLE SOMETHING FOR EVERY OCCASION","01 — THE COLLECTION","Find your <em>favourite.</em>","From everyday elegance to wedding-day details, explore pieces inspired by your style.","Each custom order is discussed with you before stitching.","THE BEAUTY IS IN THE DETAILS","Made by hand.<br>Made for <em>you.</em>","From delicate threadwork to carefully finished blouses, we bring your ideas to life with patience, skill and a personal touch.","Let’s create something together <span>→</span>","WHAT WE DO","02 — OUR SERVICES","Every detail,<br><em>considered.</em>","Tell us what you have in mind. We’ll help you find the right finish, fit and details for your occasion.","Maggam work & hand embroidery","Computer embroidery","Blouse stitching & custom designs","Bridal wear, lehengas & occasionwear","Frocks, kids wear & salwar stitching","Saree tassels & finishing","YOUR IDEA, OUR CRAFT","Have something<br><em>in mind?</em>","Share your inspiration with us. Let’s talk about your design.","Chat with us on WhatsApp <span>↗</span>","Where every stitch tells a story."],
      te:["పార్వతి క్రియేషన్స్ · తెలంగాణ","సంప్రదాయానికి<br><em>మీ కోసం</em> అందమైన రూపం.","ప్రత్యేక సందర్భాల కోసం శ్రద్ధగా కుట్టిన దుస్తులు, అందమైన ఎంబ్రాయిడరీ, వేడుకల దుస్తులు.","కలెక్షన్ చూడండి","శ్రద్ధతో కుట్టి, ప్రేమతో పూర్తి చేసినవి.","ప్రతి సందర్భానికి ప్రత్యేకంగా","01 — మా కలెక్షన్","మీకు నచ్చినది <em>ఎంచుకోండి.</em>","రోజువారీ అందమైన దుస్తుల నుంచి పెళ్లి ప్రత్యేక డిజైన్ల వరకు మీ అభిరుచికి తగినవి చూడండి.","కుట్టు ప్రారంభించే ముందు ప్రతి కస్టమ్ ఆర్డర్ గురించి మీతో చర్చిస్తాము.","అందం ప్రతి వివరంలో ఉంది","చేతితో చేసినవి.<br><em>మీ కోసం.</em>","సున్నితమైన దారపు పనుల నుంచి చక్కగా పూర్తి చేసిన బ్లౌజ్‌ల వరకు, మీ ఆలోచనలను ఓర్పు మరియు నైపుణ్యంతో రూపుదిద్దుతాము.","కలిసి అందమైన డిజైన్ చేద్దాం <span>→</span>","మా సేవలు","02 — మా సేవలు","ప్రతి వివరానికి<br><em>ప్రత్యేక శ్రద్ధ.</em>","మీ ఆలోచనను మాతో పంచుకోండి. మీ సందర్భానికి సరిపోయే ఫినిషింగ్, ఫిట్, వివరాలను ఎంచుకోవడంలో సహాయపడతాము.","మగ్గం వర్క్ & చేతి ఎంబ్రాయిడరీ","కంప్యూటర్ ఎంబ్రాయిడరీ","బ్లౌజ్ కుట్టు & కస్టమ్ డిజైన్లు","పెళ్లి దుస్తులు, లెహెంగాలు & వేడుకల దుస్తులు","ఫ్రాక్స్, పిల్లల దుస్తులు & సల్వార్ కుట్టు","చీరల టాసెల్స్ & ఫినిషింగ్","మీ ఆలోచన — మా నైపుణ్యం","మీ మనసులో<br><em>ఏదైనా ఉందా?</em>","మీకు నచ్చిన నమూనాను మాతో పంచుకోండి. మీ డిజైన్ గురించి మాట్లాడుకుందాం.","WhatsAppలో మాతో మాట్లాడండి <span>↗</span>","ప్రతి కుట్టులో ఒక కథ ఉంటుంది."],
      hi:["पार्वती क्रिएशन्स · तेलंगाना","परंपरा का अंदाज़,<br><em>आपके लिए।</em>","आपके यादगार पलों के लिए सावधानी से की गई सिलाई, बारीक कढ़ाई और खास परिधान।","कलेक्शन देखें","ध्यान से बनाया, प्यार से पूरा किया।","हर अवसर के लिए कुछ खास","01 — कलेक्शन","अपनी <em>पसंद चुनें।</em>","रोज़मर्रा की सुंदरता से लेकर शादी के खास डिज़ाइन तक, अपनी शैली के अनुसार चुनें।","सिलाई शुरू करने से पहले हर कस्टम ऑर्डर पर आपसे चर्चा की जाती है।","खूबसूरती बारीकियों में है","हाथों से बनाया।<br><em>आपके लिए।</em>","नाज़ुक धागे के काम से लेकर बारीकी से तैयार ब्लाउज़ तक, हम आपके विचारों को धैर्य और कौशल से साकार करते हैं।","आइए, मिलकर कुछ खास बनाएँ <span>→</span>","हमारी सेवाएँ","02 — हमारी सेवाएँ","हर बारीकी पर<br><em>ध्यान।</em>","अपना विचार बताएँ। हम आपके अवसर के अनुसार सही फ़िनिश, फिट और विवरण चुनने में मदद करेंगे।","मग्गम वर्क और हाथ की कढ़ाई","कंप्यूटर कढ़ाई","ब्लाउज़ सिलाई और कस्टम डिज़ाइन","शादी के परिधान, लहंगे और खास कपड़े","फ्रॉक, बच्चों के कपड़े और सलवार सिलाई","साड़ी की लटकन और फ़िनिशिंग","आपका विचार, हमारा हुनर","कुछ खास<br><em>सोचा है?</em>","अपनी पसंद हमें दिखाएँ। आपके डिज़ाइन के बारे में बात करें।","WhatsApp पर बात करें <span>↗</span>","हर सिलाई एक कहानी कहती है."]
    }[language];
    const sel=[".hero-copy .eyebrow",".hero-copy h1",".hero-description",".hero-copy .button-dark",".hero-note",".collection .section-topline .eyebrow",".collection .section-topline .section-index",".collection .section-heading-row h2",".collection .section-heading-row > p",".photo-disclaimer",".craft-copy .eyebrow",".craft-copy h2",".craft-copy > p:not(.eyebrow)",".craft-copy .text-link",".services .section-topline .eyebrow",".services .section-topline .section-index",".services-heading h2",".services-heading > p",".service-list h3:nth-of-type(1)",".service-list h3:nth-of-type(2)",".service-list h3:nth-of-type(3)",".service-list h3:nth-of-type(4)",".service-list h3:nth-of-type(5)",".service-list h3:nth-of-type(6)",".contact-band .eyebrow",".contact-band h2",".contact-band > p:not(.eyebrow)",".contact-band .button",".footer-brand + p"];
    sel.forEach((s,i)=>{const n=document.querySelector(s);if(n&&copy[i]!==undefined)n.innerHTML=copy[i];});
    document.querySelectorAll(".service-list h3").forEach((n,i)=>{const k="service"+(i+1);const lists={en:["Maggam work & hand embroidery","Computer embroidery","Blouse stitching & custom designs","Bridal wear, lehengas & occasionwear","Frocks, kids wear & salwar stitching","Saree tassels & finishing"],te:["మగ్గం వర్క్ & చేతి ఎంబ్రాయిడరీ","కంప్యూటర్ ఎంబ్రాయిడరీ","బ్లౌజ్ కుట్టు & కస్టమ్ డిజైన్లు","పెళ్లి దుస్తులు, లెహెంగాలు & వేడుకల దుస్తులు","ఫ్రాక్స్, పిల్లల దుస్తులు & సల్వార్ కుట్టు","చీరల టాసెల్స్ & ఫినిషింగ్"],hi:["मग्गम वर्क और हाथ की कढ़ाई","कंप्यूटर कढ़ाई","ब्लाउज़ सिलाई और कस्टम डिज़ाइन","शादी के परिधान, लहंगे और खास कपड़े","फ्रॉक, बच्चों के कपड़े और सलवार सिलाई","साड़ी की लटकन और फ़िनिशिंग"]};n.textContent=lists[language][i]||n.textContent;});
    const nav={en:["Home","Collection","Our Craft","Services","Contact"],te:["హోమ్","కలెక్షన్","మా కళ","సేవలు","సంప్రదించండి"],hi:["होम","कलेक्शन","हमारी कला","सेवाएँ","संपर्क"]}[language];
    document.querySelectorAll(".main-nav a").forEach((n,i)=>{if(nav[i])n.textContent=nav[i];});
    const f=document.querySelectorAll(".footer-links a");const ft={en:["Collection","Services","Contact","Instagram ↗","Owner login"],te:["కలెక్షన్","సేవలు","సంప్రదింపు","ఇన్‌స్టాగ్రామ్ ↗","యజమాని లాగిన్"],hi:["कलेक्शन","सेवाएँ","संपर्क","इंस्टाग्राम ↗","मालिक लॉगिन"]}[language];f.forEach((n,i)=>{if(ft[i])n.textContent=ft[i];});
    const c=document.querySelector(".site-footer small");if(c)c.innerHTML="© <span id='year'>"+new Date().getFullYear()+"</span> "+({en:"Parvathi Creations. Made with care.",te:"పార్వతి క్రియేషన్స్. శ్రద్ధతో రూపొందించబడింది.",hi:"पार्वती क्रिएशन्स। प्यार से बनाया गया।"}[language]);
    const fallback=document.querySelector("noscript .gallery-status");if(fallback)fallback.textContent=language==="en"?"Please turn on JavaScript to see our design gallery, or message us on WhatsApp.":language==="te"?"డిజైన్ గ్యాలరీని చూడటానికి JavaScript ఆన్ చేయండి లేదా WhatsAppలో సందేశం పంపండి.":"डिज़ाइन गैलरी देखने के लिए JavaScript चालू करें या WhatsApp पर संदेश भेजें.";
    const meta=document.querySelector('meta[name="description"]');if(meta)meta.content=({en:"Parvathi Creations — custom blouses, maggam work, embroidery, bridal wear, frocks and handcrafted tailoring in Telangana.",te:"పార్వతి క్రియేషన్స్ — బ్లౌజ్‌లు, మగ్గం వర్క్, ఎంబ్రాయిడరీ, పెళ్లి దుస్తులు, ఫ్రాక్స్ మరియు కుట్టు సేవలు.",hi:"पार्वती क्रिएशन्स — कस्टम ब्लाउज़, मग्गम वर्क, कढ़ाई, शादी के परिधान, फ्रॉक और सिलाई सेवाएँ।"}[language]);
    document.title=({en:"Parvathi Creations | Thoughtfully Made, Beautifully Yours",te:"పార్వతి క్రియేషన్స్ | మీ కోసం ప్రేమతో రూపొందించినవి",hi:"पार्वती क्रिएशन्स | आपके लिए प्यार से तैयार"}[language]);
    const kicker=document.querySelector(".hero-slide-kicker");if(kicker)kicker.textContent=language==="en"?"MADE WITH CARE":language==="te"?"శ్రద్ధతో రూపొందించబడింది":"ध्यान से बनाया गया";
    const filters=document.getElementById("galleryFilters");if(filters)filters.setAttribute("aria-label",language==="en"?"Filter designs by category":language==="te"?"వర్గం ఆధారంగా డిజైన్లను వడపోసండి":"श्रेणी के अनुसार डिज़ाइन छाँटें");
    const navEl=document.querySelector(".main-nav");if(navEl)navEl.setAttribute("aria-label",language==="en"?"Main navigation":language==="te"?"ప్రధాన నావిగేషన్":"मुख्य नेविगेशन");
    const lab=document.querySelector(".language-picker label");if(lab)lab.textContent=language==="en"?"🌐 Language / భాష / भाषा":language==="te"?"🌐 భాష / Language / भाषा":"🌐 भाषा / Language / భాష";
    const cta=document.querySelector(".header-cta");if(cta)cta.innerHTML=({en:"Enquire",te:"వివరాలు అడగండి",hi:"पूछताछ करें"}[language])+" <span>↗</span>";
  }
  function updateStaticWhatsAppLinks(language) {
    const messages = {
      en:["Hello Parvathi Creations, I’d like to enquire about a design.","Hello Parvathi Creations, I’d like to discuss a custom design.","Hello Parvathi Creations, I’d like to enquire about a custom order."],
      te:["నమస్కారం పార్వతి క్రియేషన్స్, ఒక డిజైన్ గురించి వివరాలు కావాలి.","నమస్కారం పార్వతి క్రియేషన్స్, కస్టమ్ డిజైన్ గురించి మాట్లాడాలనుకుంటున్నాను.","నమస్కారం పార్వతి క్రియేషన్స్, కస్టమ్ ఆర్డర్ గురించి వివరాలు కావాలి."],
      hi:["नमस्ते पार्वती क्रिएशन्स, मुझे एक डिज़ाइन के बारे में जानकारी चाहिए।","नमस्ते पार्वती क्रिएशन्स, मैं कस्टम डिज़ाइन पर चर्चा करना चाहती हूँ।","नमस्ते पार्वती क्रिएशन्स, मुझे कस्टम ऑर्डर के बारे में जानकारी चाहिए।"]
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
