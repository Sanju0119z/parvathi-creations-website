(() => {
  "use strict";

  /* ---------- Configuration ---------- */
  const SUPABASE_URL = "https://ydhqjkyzbbooolaugdk.supabase.co";
  const SUPABASE_KEY = "sb_publishable_uAy9Zv6zXK_cVFFGJfOxKQ_I1aRhJMs"; // public (publishable) key by design; access is controlled by RLS
  const WHATSAPP_NUMBER = "919550766784";
  const LIKES_KEY = "parvathi-creations-liked-designs";
  const RECENT_KEY = "parvathi-creations-recently-viewed";
  const INTEREST_TABLE = "design_interactions";

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

  /* Gallery status and count text follows the same language selector as the rest of the site. */
  const galleryTextByLanguage = {
    te: {
      loading: "à°¡à°¿à°à±à°¨à±à°²à± à°²à±à°¡à± à°à°µà±à°¤à±à°¨à±à°¨à°¾à°¯à°¿â¦",
      errorTitle: "à°ªà±à°°à°¸à±à°¤à±à°¤à° à°¡à°¿à°à±à°¨à±à°²à°¨à± à°²à±à°¡à± à°à±à°¯à°²à±à°à°ªà±à°¯à°¾à°.",
      errorHelp: "à°à°à°à°°à±à°¨à±à°à± à°à°¨à±à°à±à°·à°¨à±âà°¨à± à°¤à°¨à°¿à°à± à°à±à°¸à°¿ à°®à°³à±à°²à± à°ªà±à°°à°¯à°¤à±à°¨à°¿à°à°à°à°¡à°¿.",
      retry: "à°®à°³à±à°²à± à°ªà±à°°à°¯à°¤à±à°¨à°¿à°à°à°à°¡à°¿",
      emptyTitle: "à°®à°¾ à°¡à°¿à°à±à°¨à± à°à±à°¯à°¾à°²à°°à± à°¨à°µà±à°à°°à°¿à°à°à°¬à°¡à±à°¤à±à°à°¦à°¿.",
      emptyHelp: "à°à±à°¤à±à°¤ à°¡à°¿à°à±à°¨à±à°²à± à°¤à±à°µà°°à°²à± à°à°¨à°¿à°ªà°¿à°¸à±à°¤à°¾à°¯à°¿. à°à°ªà±à°ªà°à°¿à°µà°°à°à± à°¤à°¾à°à°¾ à°¡à°¿à°à±à°¨à±à°² à°à±à°¸à° WhatsAppà°²à± à°¸à°à°¦à±à°¶à° à°ªà°à°ªà°à°¡à°¿.",
      noMatchTitle: "à°®à± à°à°à°ªà°¿à°à°²à°à± à°¸à°°à°¿à°ªà±à°¯à± à°¡à°¿à°à±à°¨à±à°²à± à°²à±à°µà±.",
      noMatchHelp: "à°®à°°à±à° à°µà°°à±à°à° à°²à±à°¦à°¾ à°¶à±à°§à°¨à°¨à± à°ªà±à°°à°¯à°¤à±à°¨à°¿à°à°à°à°¡à°¿, à°²à±à°¦à°¾ à°«à°¿à°²à±à°à°°à±à°²à°¨à± à°¤à±à°²à°à°¿à°à°à°à°¡à°¿.",
      clearFilters: "à°«à°¿à°²à±à°à°°à±à°²à°¨à± à°¤à±à°²à°à°¿à°à°à°à°¡à°¿",
      photoUnavailable: "à°«à±à°à± à°à°à°¦à±à°¬à°¾à°à±à°²à± à°²à±à°¦à±",
      showing: (n, total) => total + " à°¡à°¿à°à±à°¨à±à°²à°²à± " + n + " à°à±à°ªà°¿à°¸à±à°¤à±à°¨à±à°¨à°¾à°"
    },
    hi: {
      loading: "à¤¡à¤¿à¤à¤¼à¤¾à¤à¤¨ à¤²à¥à¤¡ à¤¹à¥ à¤°à¤¹à¥ à¤¹à¥à¤â¦",
      errorTitle: "à¤à¤­à¥ à¤¡à¤¿à¤à¤¼à¤¾à¤à¤¨ à¤²à¥à¤¡ à¤¨à¤¹à¥à¤ à¤¹à¥ à¤¸à¤à¥à¥¤",
      errorHelp: "à¤à¤ªà¤¨à¤¾ à¤à¤à¤à¤°à¤¨à¥à¤ à¤à¤¨à¥à¤à¥à¤¶à¤¨ à¤à¤¾à¤à¤à¥à¤ à¤à¤° à¤«à¤¿à¤° à¤à¥à¤¶à¤¿à¤¶ à¤à¤°à¥à¤à¥¤",
      retry: "à¤«à¤¿à¤° à¤à¥à¤¶à¤¿à¤¶ à¤à¤°à¥à¤",
      emptyTitle: "à¤¹à¤®à¤¾à¤°à¥ à¤¡à¤¿à¤à¤¼à¤¾à¤à¤¨ à¤à¥à¤²à¤°à¥ à¤à¤ªà¤¡à¥à¤ à¤¹à¥ à¤°à¤¹à¥ à¤¹à¥à¥¤",
      emptyHelp: "à¤¨à¤ à¤¡à¤¿à¤à¤¼à¤¾à¤à¤¨ à¤à¤²à¥à¤¦ à¤¦à¤¿à¤à¤¾à¤ à¤¦à¥à¤à¤à¥à¥¤ à¤¤à¤¬ à¤¤à¤ à¤¹à¤®à¤¾à¤°à¥ à¤¨à¤ à¤à¤¾à¤® à¤¦à¥à¤à¤¨à¥ à¤à¥ à¤²à¤¿à¤ WhatsApp à¤ªà¤° à¤¸à¤à¤¦à¥à¤¶ à¤­à¥à¤à¥à¤à¥¤",
      noMatchTitle: "à¤à¤ªà¤à¥ à¤ªà¤¸à¤à¤¦ à¤¸à¥ à¤®à¥à¤² à¤à¤¾à¤¨à¥ à¤µà¤¾à¤²à¥ à¤¡à¤¿à¤à¤¼à¤¾à¤à¤¨ à¤¨à¤¹à¥à¤ à¤®à¤¿à¤²à¥à¥¤",
      noMatchHelp: "à¤¦à¥à¤¸à¤°à¥ à¤¶à¥à¤°à¥à¤£à¥ à¤¯à¤¾ à¤à¥à¤ à¤à¤à¤¼à¤®à¤¾à¤à¤, à¤¯à¤¾ à¤«à¤¼à¤¿à¤²à¥à¤à¤° à¤¹à¤à¤¾à¤à¤à¥¤",
      clearFilters: "à¤«à¤¼à¤¿à¤²à¥à¤à¤° à¤¹à¤à¤¾à¤à¤",
      photoUnavailable: "à¤«à¤¼à¥à¤à¥ à¤à¤ªà¤²à¤¬à¥à¤§ à¤¨à¤¹à¥à¤ à¤¹à¥",
      showing: (n, total) => total + " à¤¡à¤¿à¤à¤¼à¤¾à¤à¤¨ à¤®à¥à¤ à¤¸à¥ " + n + " à¤¦à¤¿à¤à¤¾à¤ à¤à¤¾ à¤°à¤¹à¥ à¤¹à¥à¤"
    }
  };

  function applyGalleryLanguage(language) {
    const translated = galleryTextByLanguage[language];
    if (!translated) {
      TEXT.loading = "Loading designsâ¦";
      TEXT.errorTitle = "We couldnât load the designs right now.";
      TEXT.errorHelp = "Please check your connection and try again.";
      TEXT.retry = "Try again";
      TEXT.emptyTitle = "Our design gallery is being updated.";
      TEXT.emptyHelp = "New designs will appear here soon. In the meantime, message us on WhatsApp to see our latest work.";
      TEXT.noMatchTitle = "No designs match your choices.";
      TEXT.noMatchHelp = "Try another category or search, or clear the filters.";
      TEXT.clearFilters = "Clear filters";
      TEXT.photoUnavailable = "Photo unavailable";
      TEXT.showing = (n, total) => "Showing " + n + " of " + total + " design" + (total === 1 ? "" : "s");
      return;
    }
    Object.keys(translated).forEach(key => { TEXT[key] = translated[key]; });
  }

  const cats = window.PCCategories || (function () {
    /* Keep the gallery usable if categories.js is blocked by a CDN/network hiccup. */
    const list = [
      { key: "maggam", label: "Maggam Work", aliases: ["maggam", "maggam work", "thread work", "hand embroidery"] },
      { key: "computer", label: "Computer Embroidery", aliases: ["computer", "computer work", "computer embroidery", "computerized embroidery", "machine embroidery"] },
      { key: "blouse", label: "Blouse Designs", aliases: ["blouse", "blouses", "blouse designs"] },
      { key: "designer-blouses", label: "Designer Blouses", aliases: ["designer blouse", "designer blouses"] },
      { key: "designer", label: "Designer Wear", aliases: ["designer", "designer wear", "designerwear"] },
      { key: "frocks", label: "Frocks", aliases: ["frock", "frocks", "kids frock", "baby frock"] },
      { key: "lehenga", label: "Designer Lehengas", aliases: ["lehenga", "lehengas", "designer lehengas"] },
      { key: "bridal", label: "Wedding Wear", aliases: ["bridal", "bridal wear", "wedding", "wedding wear", "wedding dresses", "occasionwear"] },
      { key: "kids", label: "Kids Wear", aliases: ["kids", "kids wear", "children wear"] },
      { key: "saree", label: "Sarees & Tassels", aliases: ["saree", "sarees", "saree tassels", "tassels"] },
      { key: "custom", label: "Custom Designs", aliases: ["custom", "custom design", "custom designs", "tailoring", "salwar"] }
    ];
    const normalizeText = value => String(value == null ? "" : value).toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9 ]+/g, " ").replace(/\\s+/g, " ").trim();
    const aliasToKey = {};
    list.forEach(category => {
      aliasToKey[normalizeText(category.key)] = category.key;
      aliasToKey[normalizeText(category.label)] = category.key;
      category.aliases.forEach(alias => { aliasToKey[normalizeText(alias)] = category.key; });
    });
    return {
      list,
      UNCATEGORIZED: "uncategorized",
      normalizeText,
      keyFor: value => aliasToKey[normalizeText(value)] || "uncategorized",
      labelFor: key => (list.find(category => category.key === key) || {}).label || "Other",
      isKnownKey: key => list.some(category => category.key === key)
    };
  })();
  const state = { designs: [], category: "all", query: "", sort: "newest", featuredOnly: false, view: "all", status: "loading", offlineFallback: false };
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
      categoryLabel: /^festival\s*banner$/i.test(categoryRaw) ? "Festival Greeting" : (key === cats.UNCATEGORIZED ? (categoryRaw || "Other") : cats.labelFor(key)),
      isFestivalBanner: /^festival\s*banner$/i.test(categoryRaw),
      description: cleanText(row && row.description),
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
    const savedIds = readLikedDesigns();
    const recentIds = readRecentDesigns();
    const list = state.designs.filter(d => {
      if (state.view === "saved" && !savedIds.includes(d.id)) return false;
      if (state.view === "recent" && !recentIds.includes(d.id)) return false;
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
  function readRecentDesigns() {
    try {
      const value = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
      return Array.isArray(value) ? value : [];
    } catch (_) { return []; }
  }
  function rememberRecentDesign(id) {
    const recent = readRecentDesigns().filter(value => value !== id);
    recent.unshift(id);
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, 12))); } catch (_) {}
  }
  async function trackInterest(eventType, design) {
    if (!design || !design.id) return;
    try {
      const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
      const { error } = await client.from(INTEREST_TABLE).insert({
        event_type: eventType,
        design_id: String(design.id),
        design_code: design.code || null,
        design_name: (design.name || design.categoryLabel || "Design").slice(0, 160)
      });
      if (error) throw error;
    } catch (error) {
      // Analytics is optional until the interest table and its policies are installed.
      if (window.__PC_ANALYTICS_DEBUG__) console.debug("Customer-interest tracking is not configured yet.", error);
    }
  }

  function openWhatsApp(design) {
    if (!/^\d{8,15}$/.test(WHATSAPP_NUMBER)) { window.alert(TEXT.contactUnavailable); return; }
    trackInterest("enquiry", design);
    const parts = [pcUiText("message") + (design.name || design.categoryLabel) + " (" + design.categoryLabel + ")."];
    if (design.code) parts.push(pcUiText("code") + design.code + ".");
    if (design.price) parts.push(pcUiText("price") + design.price);
    if (design.description) parts.push(pcUiText("description") + design.description);
    parts.push("Image: " + design.imageUrl);
    parts.push(pcUiText("details"));
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
    dialog.setAttribute("aria-label", pcTranslateDesignText(design.name || design.categoryLabel, pcCurrentLanguage(), "name") + (pcCurrentLanguage() === "te" ? " à°µà°¿à°µà°°à°¾à°²à±" : pcCurrentLanguage() === "hi" ? " à¤µà¤¿à¤µà¤°à¤£" : " details"));

    const close = document.createElement("button");
    close.type = "button";
    close.className = "design-details-close";
    close.textContent = "Ã";
    close.setAttribute("aria-label", pcCurrentLanguage() === "te" ? "à°¡à°¿à°à±à°¨à± à°µà°¿à°µà°°à°¾à°²à°¨à± à°®à±à°¸à°¿à°µà±à°¯à°à°¡à°¿" : pcCurrentLanguage() === "hi" ? "à¤¡à¤¿à¤à¤¼à¤¾à¤à¤¨ à¤µà¤¿à¤µà¤°à¤£ à¤¬à¤à¤¦ à¤à¤°à¥à¤" : "Close design details");
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
    photo.alt = pcTranslateDesignText(design.name || design.categoryLabel, pcCurrentLanguage(), "name") + (pcCurrentLanguage() === "te" ? " à°¡à°¿à°à±à°¨à±" : pcCurrentLanguage() === "hi" ? " à¤¡à¤¿à¤à¤¼à¤¾à¤à¤¨" : " design");
    media.append(photo);
    const galleryImages = Array.isArray(design.galleryImages) ? design.galleryImages : [design.imageUrl];
    if (galleryImages.length > 1) {
      const thumbnails = document.createElement("div");
      thumbnails.className = "design-details-thumbnails";
      galleryImages.slice(0, 6).forEach((url, index) => {
        const thumb = document.createElement("button");
        thumb.type = "button";
        thumb.className = "design-details-thumbnail" + (url === design.imageUrl ? " is-active" : "");
        thumb.setAttribute("aria-label", pcCurrentLanguage() === "te" ? (index === 0 ? "à°ªà±à°°à°§à°¾à°¨ à°«à±à°à±" : "à°«à±à°à± " + (index + 1)) : pcCurrentLanguage() === "hi" ? (index === 0 ? "à¤®à¥à¤à¥à¤¯ à¤«à¤¼à¥à¤à¥" : "à¤«à¤¼à¥à¤à¥ " + (index + 1)) : (index === 0 ? "Cover photo" : "Photo " + (index + 1)));
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
    category.textContent = pcTranslateDesignText(design.categoryLabel, pcCurrentLanguage(), "category");
    const heading = document.createElement("h2");
    heading.textContent = pcTranslateDesignText(design.name || design.categoryLabel, pcCurrentLanguage(), "name");
    const price = document.createElement("p");
    price.className = "design-details-price";
    price.textContent = design.price ? "â¹" + design.price : (pcCurrentLanguage() === "te" ? "à°§à°° à°à±à°¸à° à°¸à°à°ªà±à°°à°¦à°¿à°à°à°à°¡à°¿" : pcCurrentLanguage() === "hi" ? "à¤à¥à¤®à¤¤ à¤à¤¾à¤¨à¤¨à¥ à¤à¥ à¤²à¤¿à¤ à¤¸à¤à¤ªà¤°à¥à¤ à¤à¤°à¥à¤" : "Price available on enquiry");
    const descriptionLabel = document.createElement("h3");
    descriptionLabel.textContent = pcCurrentLanguage() === "te" ? "à°µà°¿à°µà°°à°£" : pcCurrentLanguage() === "hi" ? "à¤µà¤¿à¤µà¤°à¤£" : "Description";
    const description = document.createElement("p");
    description.className = "design-details-description";
    description.textContent = design.description ? pcTranslateDesignText(design.description, pcCurrentLanguage(), "description") : (pcCurrentLanguage() === "te" ? "à° à°¡à°¿à°à±à°¨à± à°µà°¿à°µà°°à°¾à°² à°à±à°¸à° à°¦à°¯à°à±à°¸à°¿ à°®à°®à±à°®à°²à±à°¨à°¿ à°¸à°à°ªà±à°°à°¦à°¿à°à°à°à°¡à°¿." : pcCurrentLanguage() === "hi" ? "à¤à¤¸ à¤¡à¤¿à¤à¤¼à¤¾à¤à¤¨ à¤à¥ à¤à¤§à¤¿à¤ à¤à¤¾à¤¨à¤à¤¾à¤°à¥ à¤à¥ à¤²à¤¿à¤ à¤à¥à¤ªà¤¯à¤¾ à¤¸à¤à¤ªà¤°à¥à¤ à¤à¤°à¥à¤." : "Please contact us for more details about this design.");
    info.append(category, heading, price);
    if (design.code) {
      const code = document.createElement("p");
      code.className = "design-details-code";
      code.textContent = (pcCurrentLanguage() === "te" ? "à°¡à°¿à°à±à°¨à± à°à±à°¡à±: " : pcCurrentLanguage() === "hi" ? "à¤¡à¤¿à¤à¤¼à¤¾à¤à¤¨ à¤à¥à¤¡: " : "Design code: ") + design.code;
      info.append(code);
    }
    info.append(descriptionLabel, description);
    const enquire = document.createElement("button");
    enquire.type = "button";
    enquire.className = "design-action design-enquire design-details-enquire";
    enquire.textContent = pcUiText("enquire");
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
  /* Translate uploaded design labels without changing the saved Supabase values. */
  function pcTranslateDesignText(value, language, kind) {
    const original = typeof value === "string" ? value.trim() : "";
    if (!original || language === "en") return original;
    const phraseMaps = {
      te: {
        "Computer Embroidery":"à°à°à°ªà±à°¯à±à°à°°à± à°à°à°¬à±à°°à°¾à°¯à°¿à°¡à°°à±", "Computer Work":"à°à°à°ªà±à°¯à±à°à°°à± à°µà°°à±à°à±", "Computerized Embroidery":"à°à°à°ªà±à°¯à±à°à°°à± à°à°à°¬à±à°°à°¾à°¯à°¿à°¡à°°à±", "Designer Lehengas":"à°¡à°¿à°à±à°¨à°°à± à°²à±à°¹à°à°à°¾à°²à±", "Designer Wear":"à°¡à°¿à°à±à°¨à°°à± à°¦à±à°¸à±à°¤à±à°²à±", "Designer Blouses":"à°¡à°¿à°à±à°¨à°°à± à°¬à±à°²à±à°à±à°²à±", "Designer Blouse":"à°¡à°¿à°à±à°¨à°°à± à°¬à±à°²à±à°à±", "Blouse Designs":"à°¬à±à°²à±à°à± à°¡à°¿à°à±à°¨à±à°²à±", "Blouse Design":"à°¬à±à°²à±à°à± à°¡à°¿à°à±à°¨à±", "Wedding Dresses":"à°ªà±à°³à±à°²à°¿ à°¦à±à°¸à±à°¤à±à°²à±", "Wedding Wear":"à°ªà±à°³à±à°²à°¿ à°¦à±à°¸à±à°¤à±à°²à±", "Bridal Wear":"à°µà°§à±à°µà± à°¦à±à°¸à±à°¤à±à°²à±", "Kids Wear":"à°ªà°¿à°²à±à°²à°² à°¦à±à°¸à±à°¤à±à°²à±", "Sarees & Tassels":"à°à±à°°à°²à± à°®à°°à°¿à°¯à± à°à°¾à°¸à±à°²à±à°¸à±", "Saree Tassels":"à°à±à°° à°à°¾à°¸à±à°²à±à°¸à±", "Custom Designs":"à°à°¸à±à°à°®à± à°¡à°¿à°à±à°¨à±à°²à±", "Custom Design":"à°à°¸à±à°à°®à± à°¡à°¿à°à±à°¨à±", "Maggam Work":"à°®à°à±à°à° à°µà°°à±à°à±", "Frocks":"à°«à±à°°à°¾à°à±à°¸à±", "Frock":"à°«à±à°°à°¾à°à±", "Lehengas":"à°²à±à°¹à°à°à°¾à°²à±", "Lehenga":"à°²à±à°¹à°à°à°¾", "Sarees":"à°à±à°°à°²à±", "Saree":"à°à±à°°", "Tassels":"à°à°¾à°¸à±à°²à±à°¸à±", "Embroidery":"à°à°à°¬à±à°°à°¾à°¯à°¿à°¡à°°à±", "Tailoring":"à°¦à±à°¸à±à°¤à±à°² à°à±à°à±à°à±", "Traditional":"à°¸à°à°ªà±à°°à°¦à°¾à°¯", "Handwork":"à°à±à°¤à°¿à°ªà°¨à°¿", "Hand Work":"à°à±à°¤à°¿à°ªà°¨à°¿", "Silk":"à°ªà°à±à°à±", "Cotton":"à°à°¾à°à°¨à±", "Party Wear":"à°ªà°¾à°°à±à°à± à°µà±à°°à±", "Bridal":"à°ªà±à°³à±à°²à°¿", "Beautiful":"à°à°à°¦à°®à±à°¨", "New Design":"à°à±à°¤à±à°¤ à°¡à°¿à°à±à°¨à±", "Description":"à°µà°¿à°µà°°à°£", "Price available on enquiry":"à°§à°° à°à±à°¸à° à°¸à°à°ªà±à°°à°¦à°¿à°à°à°à°¡à°¿", "Please contact us for more details about this design.":"à° à°¡à°¿à°à±à°¨à± à°µà°¿à°µà°°à°¾à°² à°à±à°¸à° à°¦à°¯à°à±à°¸à°¿ à°®à°®à±à°®à°²à±à°¨à°¿ à°¸à°à°ªà±à°°à°¦à°¿à°à°à°à°¡à°¿."
      },
      hi: {
        "Computer Embroidery":"à¤à¤à¤ªà¥à¤¯à¥à¤à¤° à¤à¤¢à¤¼à¤¾à¤", "Computer Work":"à¤à¤à¤ªà¥à¤¯à¥à¤à¤° à¤µà¤°à¥à¤", "Computerized Embroidery":"à¤à¤à¤ªà¥à¤¯à¥à¤à¤° à¤à¤¢à¤¼à¤¾à¤", "Designer Lehengas":"à¤¡à¤¿à¤à¤¼à¤¾à¤à¤¨à¤° à¤²à¤¹à¤à¤à¥", "Designer Wear":"à¤¡à¤¿à¤à¤¼à¤¾à¤à¤¨à¤° à¤à¤ªà¤¡à¤¼à¥", "Designer Blouses":"à¤¡à¤¿à¤à¤¼à¤¾à¤à¤¨à¤° à¤¬à¥à¤²à¤¾à¤à¤à¤¼", "Designer Blouse":"à¤¡à¤¿à¤à¤¼à¤¾à¤à¤¨à¤° à¤¬à¥à¤²à¤¾à¤à¤à¤¼", "Blouse Designs":"à¤¬à¥à¤²à¤¾à¤à¤à¤¼ à¤¡à¤¿à¤à¤¼à¤¾à¤à¤¨", "Blouse Design":"à¤¬à¥à¤²à¤¾à¤à¤à¤¼ à¤¡à¤¿à¤à¤¼à¤¾à¤à¤¨", "Wedding Dresses":"à¤¶à¤¾à¤¦à¥ à¤à¥ à¤à¤ªà¤¡à¤¼à¥", "Wedding Wear":"à¤¶à¤¾à¤¦à¥ à¤à¥ à¤à¤ªà¤¡à¤¼à¥", "Bridal Wear":"à¤¦à¥à¤²à¥à¤¹à¤¨ à¤à¥ à¤à¤ªà¤¡à¤¼à¥", "Kids Wear":"à¤¬à¤à¥à¤à¥à¤ à¤à¥ à¤à¤ªà¤¡à¤¼à¥", "Sarees & Tassels":"à¤¸à¤¾à¤¡à¤¼à¥ à¤à¤° à¤²à¤à¤à¤¨", "Saree Tassels":"à¤¸à¤¾à¤¡à¤¼à¥ à¤à¥à¤¸à¤²", "Custom Designs":"à¤à¤¸à¥à¤à¤® à¤¡à¤¿à¤à¤¼à¤¾à¤à¤¨", "Custom Design":"à¤à¤¸à¥à¤à¤® à¤¡à¤¿à¤à¤¼à¤¾à¤à¤¨", "Maggam Work":"à¤®à¤à¥à¤à¤® à¤µà¤°à¥à¤", "Frocks":"à¤«à¥à¤°à¥à¤", "Frock":"à¤«à¥à¤°à¥à¤", "Lehengas":"à¤²à¤¹à¤à¤à¥", "Lehenga":"à¤²à¤¹à¤à¤à¤¾", "Sarees":"à¤¸à¤¾à¤¡à¤¼à¤¿à¤¯à¤¾à¤", "Saree":"à¤¸à¤¾à¤¡à¤¼à¥", "Tassels":"à¤²à¤à¤à¤¨", "Embroidery":"à¤à¤¢à¤¼à¤¾à¤", "Tailoring":"à¤¸à¤¿à¤²à¤¾à¤", "Traditional":"à¤ªà¤¾à¤°à¤à¤ªà¤°à¤¿à¤", "Handwork":"à¤¹à¤¾à¤¥ à¤à¤¾ à¤à¤¾à¤®", "Hand Work":"à¤¹à¤¾à¤¥ à¤à¤¾ à¤à¤¾à¤®", "Silk":"à¤°à¥à¤¶à¤®", "Cotton":"à¤¸à¥à¤¤à¥", "Party Wear":"à¤ªà¤¾à¤°à¥à¤à¥ à¤µà¤¿à¤¯à¤°", "Bridal":"à¤¦à¥à¤²à¥à¤¹à¤¨", "Beautiful":"à¤¸à¥à¤à¤¦à¤°", "New Design":"à¤¨à¤¯à¤¾ à¤¡à¤¿à¤à¤¼à¤¾à¤à¤¨", "Description":"à¤µà¤¿à¤µà¤°à¤£", "Price available on enquiry":"à¤à¥à¤®à¤¤ à¤à¤¾à¤¨à¤¨à¥ à¤à¥ à¤²à¤¿à¤ à¤¸à¤à¤ªà¤°à¥à¤ à¤à¤°à¥à¤", "Please contact us for more details about this design.":"à¤à¤¸ à¤¡à¤¿à¤à¤¼à¤¾à¤à¤¨ à¤à¥ à¤à¤§à¤¿à¤ à¤à¤¾à¤¨à¤à¤¾à¤°à¥ à¤à¥ à¤²à¤¿à¤ à¤à¥à¤ªà¤¯à¤¾ à¤¸à¤à¤ªà¤°à¥à¤ à¤à¤°à¥à¤."
      }
    };
    let result = original;
    const map = phraseMaps[language] || {};
    Object.keys(map).sort((a,b) => b.length-a.length).forEach(key => {
      result = result.replace(new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), map[key]);
    });
    return result;
  }
  function pcCurrentLanguage() {
    try { return localStorage.getItem("parvathiLanguage") || document.documentElement.lang || "en"; }
    catch (_) { return document.documentElement.lang || "en"; }
  }

  function pcUiText(key) {
    const labels = {
      en: {like:"â¡ I Like This Design", liked:"â¥ Liked", enquire:"Enquire on WhatsApp", message:"Hello Parvathi Creations! I would like to enquire about this design: ", code:"Design code: ", price:"Price: â¹", description:"Description: ", details:"Please share details."},
      te: {like:"â¡ à° à°¡à°¿à°à±à°¨à± à°¨à°¾à°à± à°¨à°à±à°à°¿à°à°¦à°¿", liked:"â¥ à°¨à°à±à°à°¿à°à°¦à°¿", enquire:"à°µà°¾à°à±à°¸à°¾à°ªà±âà°²à± à°µà°¿à°µà°°à°¾à°²à± à°à°¡à°à°à°¡à°¿", message:"à°¨à°®à°¸à±à°à°¾à°°à° à°ªà°¾à°°à±à°µà°¤à°¿ à°à±à°°à°¿à°¯à±à°·à°¨à±à°¸à±! à° à°¡à°¿à°à±à°¨à± à°à±à°°à°¿à°à°à°¿ à°µà°¿à°µà°°à°¾à°²à± à°à°¾à°µà°¾à°²à°¿: ", code:"à°¡à°¿à°à±à°¨à± à°à±à°¡à±: ", price:"à°§à°°: â¹", description:"à°µà°¿à°µà°°à°£: ", details:"à°¦à°¯à°à±à°¸à°¿ à°®à°°à°¿à°¨à±à°¨à°¿ à°µà°¿à°µà°°à°¾à°²à± à°ªà°à°ªà°à°¡à°¿."},
      hi: {like:"â¡ à¤®à¥à¤à¥ à¤¯à¤¹ à¤¡à¤¿à¤à¤¼à¤¾à¤à¤¨ à¤ªà¤¸à¤à¤¦ à¤¹à¥", liked:"â¥ à¤ªà¤¸à¤à¤¦ à¤à¤¯à¤¾", enquire:"WhatsApp à¤ªà¤° à¤ªà¥à¤à¤¤à¤¾à¤ à¤à¤°à¥à¤", message:"à¤¨à¤®à¤¸à¥à¤¤à¥ à¤ªà¤¾à¤°à¥à¤µà¤¤à¥ à¤à¥à¤°à¤¿à¤à¤¶à¤¨à¥à¤¸! à¤®à¥à¤à¥ à¤à¤¸ à¤¡à¤¿à¤à¤¼à¤¾à¤à¤¨ à¤à¥ à¤¬à¤¾à¤°à¥ à¤®à¥à¤ à¤à¤¾à¤¨à¤à¤¾à¤°à¥ à¤à¤¾à¤¹à¤¿à¤: ", code:"à¤¡à¤¿à¤à¤¼à¤¾à¤à¤¨ à¤à¥à¤¡: ", price:"à¤à¥à¤®à¤¤: â¹", description:"à¤µà¤¿à¤µà¤°à¤£: ", details:"à¤à¥à¤ªà¤¯à¤¾ à¤à¤° à¤à¤¾à¤¨à¤à¤¾à¤°à¥ à¤¸à¤¾à¤à¤¾ à¤à¤°à¥à¤à¥¤"}
    };
    return (labels[pcCurrentLanguage()] || labels.en)[key] || labels.en[key] || "";
  }

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
    imageButton.setAttribute("aria-label", (pcCurrentLanguage() === "te" ? "à°¡à°¿à°à±à°¨à± à°µà°¿à°µà°°à°¾à°²à± à°à±à°¡à°à°¡à°¿: " : pcCurrentLanguage() === "hi" ? "à¤¡à¤¿à¤à¤¼à¤¾à¤à¤¨ à¤µà¤¿à¤µà¤°à¤£ à¤¦à¥à¤à¥à¤: " : "View details for ") + pcTranslateDesignText(design.name || design.categoryLabel, pcCurrentLanguage(), "name"));
    imageButton.addEventListener("click", () => {
      rememberRecentDesign(design.id);
      trackInterest("view", design);
      openDesignDetails(design);
    });
    const img = document.createElement("img");
    img.src = design.imageUrl;
    img.alt = pcTranslateDesignText(design.name || design.categoryLabel, pcCurrentLanguage(), "name") + (pcCurrentLanguage() === "te" ? " à°¡à°¿à°à±à°¨à±" : pcCurrentLanguage() === "hi" ? " à¤¡à¤¿à¤à¤¼à¤¾à¤à¤¨" : " design");
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
    heading.textContent = pcTranslateDesignText(design.name || design.categoryLabel, pcCurrentLanguage(), "name");
    const sub = document.createElement("p");
    sub.className = "card-category";
    sub.textContent = pcTranslateDesignText(design.categoryLabel, pcCurrentLanguage(), "category");
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
      like.textContent = liked ? pcUiText("liked") : pcUiText("like");
    };
    renderLike();
    like.addEventListener("click", () => {
      const liked = readLikedDesigns();
      const index = liked.indexOf(design.id);
      if (index >= 0) { liked.splice(index, 1); trackInterest("unlike", design); }
      else { liked.push(design.id); trackInterest("like", design); }
      writeLikedDesigns(liked);
      renderLike();
      if (state.view === "saved") render();
    });
    const enquire = document.createElement("button");
    enquire.type = "button";
    enquire.className = "design-action design-enquire";
    enquire.textContent = pcUiText("enquire");
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
    if (el.saved && el.recent) {
      const lang = pcCurrentLanguage();
      const labels = {en:{saved:"â¡ Saved designs",recent:"â· Recently viewed",savedOn:"â¥ Showing saved designs",recentOn:"â· Showing recently viewed"},te:{saved:"â¡ à°¸à±à°µà± à°à±à°¸à°¿à°¨ à°¡à°¿à°à±à°¨à±à°²à±",recent:"â· à°à°à±à°µà°² à°à±à°¸à°¿à°¨à°µà°¿",savedOn:"â¥ à°¸à±à°µà± à°à±à°¸à°¿à°¨ à°¡à°¿à°à±à°¨à±à°²à±",recentOn:"â· à°à°à±à°µà°² à°à±à°¸à°¿à°¨à°µà°¿"},hi:{saved:"â¡ à¤¸à¥à¤µ à¤à¤¿à¤ à¤¡à¤¿à¤à¤¼à¤¾à¤à¤¨",recent:"â· à¤¹à¤¾à¤² à¤¹à¥ à¤®à¥à¤ à¤¦à¥à¤à¥",savedOn:"â¥ à¤¸à¥à¤µ à¤à¤¿à¤ à¤¡à¤¿à¤à¤¼à¤¾à¤à¤¨",recentOn:"â· à¤¹à¤¾à¤² à¤¹à¥ à¤®à¥à¤ à¤¦à¥à¤à¥"}};
      const t = labels[lang] || labels.en;
      el.saved.textContent = state.view === "saved" ? t.savedOn : t.saved;
      el.recent.textContent = state.view === "recent" ? t.recentOn : t.recent;
      el.saved.setAttribute("aria-pressed", String(state.view === "saved"));
      el.recent.setAttribute("aria-pressed", String(state.view === "recent"));
      el.saved.classList.toggle("active", state.view === "saved");
      el.recent.classList.toggle("active", state.view === "recent");
    }
    el.grid.setAttribute("aria-busy", String(state.status === "loading"));
    if (state.status === "loading") { setStatus("loading", TEXT.loading); el.count.textContent = ""; return; }
    if (state.status === "error") { setStatus("error", TEXT.errorTitle, TEXT.errorHelp, TEXT.retry, loadDesigns); el.count.textContent = ""; return; }
    if (!state.designs.length) { setStatus("empty", TEXT.emptyTitle, TEXT.emptyHelp); el.count.textContent = ""; return; }
    if (state.offlineFallback) {
      setStatus("error", TEXT.errorTitle, TEXT.errorHelp + " Showing a local sample photo until the online gallery reconnects.", TEXT.retry, loadDesigns);
    } else {
      setStatus(null);
    }
    const list = visibleDesigns();
    el.count.textContent = TEXT.showing(list.length, state.designs.length);
    if (!list.length && state.view === "saved") {
      const lang = pcCurrentLanguage();
      setStatus("empty", lang === "te" ? "à°à°à°à°¾ à°¸à±à°µà± à°à±à°¸à°¿à°¨ à°¡à°¿à°à±à°¨à±à°²à± à°²à±à°µà±." : lang === "hi" ? "à¤à¤­à¥ à¤à¥à¤ à¤¡à¤¿à¤à¤¼à¤¾à¤à¤¨ à¤¸à¥à¤µ à¤¨à¤¹à¥à¤ à¤¹à¥à¥¤" : "No saved designs yet.",
        lang === "te" ? "à°®à±à°à± à°¨à°à±à°à°¿à°¨ à°¡à°¿à°à±à°¨à±âà°²à±à°¨à°¿ à°¹à±à°¦à°¯ à°à±à°°à±à°¤à±à°¨à± à°¨à±à°à±à°à°¿à°¤à± à°à°à±à°à°¡ à°à°¨à°¿à°ªà°¿à°¸à±à°¤à±à°à°¦à°¿." : lang === "hi" ? "à¤à¤¿à¤¸à¥ à¤¡à¤¿à¤à¤¼à¤¾à¤à¤¨ à¤ªà¤° à¤¦à¤¿à¤² à¤à¥ à¤¨à¤¿à¤¶à¤¾à¤¨ à¤à¥ à¤¦à¤¬à¤¾à¤à¤, à¤µà¤¹ à¤¯à¤¹à¤¾à¤ à¤¦à¤¿à¤à¤¾à¤ à¤¦à¥à¤à¤¾à¥¤" : "Tap the heart on any design to save it here.",
        lang === "te" ? "à°à°¨à±à°¨à°¿ à°¡à°¿à°à±à°¨à±à°²à± à°à±à°¡à°à°¡à°¿" : lang === "hi" ? "à¤¸à¤­à¥ à¤¡à¤¿à¤à¤¼à¤¾à¤à¤¨ à¤¦à¥à¤à¥à¤" : "Browse all designs", () => { state.view = "all"; render(); });
      return;
    }
    if (!list.length && state.view === "recent") {
      const lang = pcCurrentLanguage();
      setStatus("empty", lang === "te" ? "à°à°à±à°µà°² à°à±à°¸à°¿à°¨ à°¡à°¿à°à±à°¨à±à°²à± à°à°à°à°¾ à°²à±à°µà±." : lang === "hi" ? "à¤à¤­à¥ à¤¹à¤¾à¤² à¤¹à¥ à¤®à¥à¤ à¤¦à¥à¤à¥ à¤à¤ à¤¡à¤¿à¤à¤¼à¤¾à¤à¤¨ à¤¨à¤¹à¥à¤ à¤¹à¥à¤à¥¤" : "No recently viewed designs yet.",
        lang === "te" ? "à°à°¦à±à°¨à°¾ à°¡à°¿à°à±à°¨à±âà°¨à± à°¤à±à°°à°¿à°¸à±à°¤à± à°à°¦à°¿ à°à°à±à°à°¡ à°à°¨à°¿à°ªà°¿à°¸à±à°¤à±à°à°¦à°¿." : lang === "hi" ? "à¤à¤¿à¤¸à¥ à¤¡à¤¿à¤à¤¼à¤¾à¤à¤¨ à¤à¥ à¤à¥à¤²à¥à¤, à¤µà¤¹ à¤¯à¤¹à¤¾à¤ à¤¦à¤¿à¤à¤¾à¤ à¤¦à¥à¤à¤¾à¥¤" : "Open a design to see it listed here.",
        lang === "te" ? "à°à°¨à±à°¨à°¿ à°¡à°¿à°à±à°¨à±à°²à± à°à±à°¡à°à°¡à°¿" : lang === "hi" ? "à¤¸à¤­à¥ à¤¡à¤¿à¤à¤¼à¤¾à¤à¤¨ à¤¦à¥à¤à¥à¤" : "Browse all designs", () => { state.view = "all"; render(); });
      return;
    }
    if (!list.length) { setStatus("empty", TEXT.noMatchTitle, TEXT.noMatchHelp, TEXT.clearFilters, clearFilters); return; }
    setStatus(null);
    const frag = document.createDocumentFragment();
    list.forEach(d => frag.append(buildCard(d)));
    el.grid.append(frag);
  }


  document.addEventListener("parvathi-language-changed", function () {
    applyGalleryLanguage(document.documentElement.lang || "en");
    const lang = pcCurrentLanguage();
    if (el.saved && el.recent) {
      const labels = {
        en: {saved:"â¡ Saved designs", recent:"â· Recently viewed", savedOn:"â¥ Showing saved designs", recentOn:"â· Showing recently viewed"},
        te: {saved:"â¡ à°¸à±à°µà± à°à±à°¸à°¿à°¨ à°¡à°¿à°à±à°¨à±à°²à±", recent:"â· à°à°à±à°µà°² à°à±à°¸à°¿à°¨à°µà°¿", savedOn:"â¥ à°¸à±à°µà± à°à±à°¸à°¿à°¨ à°¡à°¿à°à±à°¨à±à°²à±", recentOn:"â· à°à°à±à°µà°² à°à±à°¸à°¿à°¨à°µà°¿"},
        hi: {saved:"â¡ à¤¸à¥à¤µ à¤à¤¿à¤ à¤¡à¤¿à¤à¤¼à¤¾à¤à¤¨", recent:"â· à¤¹à¤¾à¤² à¤¹à¥ à¤®à¥à¤ à¤¦à¥à¤à¥", savedOn:"â¥ à¤¸à¥à¤µ à¤à¤¿à¤ à¤¡à¤¿à¤à¤¼à¤¾à¤à¤¨", recentOn:"â· à¤¹à¤¾à¤² à¤¹à¥ à¤®à¥à¤ à¤¦à¥à¤à¥"}
      };
      const t = labels[lang] || labels.en;
      el.saved.textContent = state.view === "saved" ? t.savedOn : t.saved;
      el.recent.textContent = state.view === "recent" ? t.recentOn : t.recent;
    }
    if (state.status !== "loading" && el.grid) render();
  });

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
    const availableSlides = (Array.isArray(designs) ? designs : []).filter(d => d && !d.hidden && /^https?:\/\//i.test(d.imageUrl || ""));
    /* Prefer designs marked Featured in Admin, but fall back to all visible uploaded designs so the hero never disappears just because none are featured. */
    const featuredSlides = availableSlides.filter(d => d.featured);
    const slides = featuredSlides.length ? featuredSlides : availableSlides;
    if (!slides.length) {
      /* Keep the hero visible during an empty gallery or temporary Supabase outage. */
      root.hidden = false;
      root.classList.add("is-single");
      image.src = "sareejpg.jpg";
      image.alt = "Parvathi Creations boutique design";
      if (name) name.textContent = "Thoughtfully Made, Beautifully Yours";
      if (category) category.textContent = "Custom stitching & occasionwear";
      if (dots) dots.replaceChildren();
      if (count) count.textContent = "";
      const kicker = root.querySelector(".hero-slide-kicker");
      if (kicker) kicker.textContent = "PARVATHI CREATIONS";
      [document.getElementById("heroSlidePrev"), document.getElementById("heroSlideNext")].forEach(button => {
        if (button) button.hidden = true;
      });
      return;
    }
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
      const kicker = root.querySelector(".hero-slide-kicker");
      if (kicker) kicker.textContent = design.isFestivalBanner ? "FESTIVAL GREETINGS" : "MADE WITH CARE";
      image.src = design.imageUrl;
      image.alt = [design.name, design.categoryLabel, "Parvathi Creations design"].filter(Boolean).join(" â ");
      name.textContent = design.name || design.categoryLabel || "A design made with care";
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
      state.designs = all.filter(d => !d.hidden && d.imageUrl && !d.isFestivalBanner);
      state.offlineFallback = false;
      initHeroSlider(all.filter(d => !d.hidden && d.imageUrl));
      state.status = "ready";
    } catch (error) {
      console.error("Parvathi Creations: could not load designs.", error);
      /* Keep both the hero and gallery visual when the remote catalogue is unavailable. */
      const fallbackCategory = cats.keyFor("Sarees & Tassels");
      const fallbackLabel = cats.labelFor(fallbackCategory);
      state.designs = [{
        id: "local-featured-saree", name: "Featured Saree Design",
        categoryRaw: "Sarees & Tassels", categoryKey: fallbackCategory, categoryLabel: fallbackLabel,
        description: "Explore Parvathi Creations. Contact us on WhatsApp for current designs.",
        code: "", price: "", imageUrl: "sareejpg.jpg", galleryImages: ["sareejpg.jpg"],
        featured: true, hidden: false, created: 0, numericId: 0, isFestivalBanner: false
      }];
      state.offlineFallback = true;
      initHeroSlider([]);
      state.status = "ready";
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
    el.saved = document.getElementById("gallerySaved");
    el.recent = document.getElementById("galleryRecent");
    if (!el.grid || !el.filters || !el.status || !el.search || !el.sort || !el.featured || !el.count || !el.saved || !el.recent) return false;

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
    el.saved.addEventListener("click", () => { state.view = state.view === "saved" ? "all" : "saved"; render(); });
    el.recent.addEventListener("click", () => { state.view = state.view === "recent" ? "all" : "recent"; render(); });
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

const pcTranslations = {
  en: { home:"Home", collection:"Collection", craft:"Our Craft", services:"Services", contact:"Contact", enquire:"Enquire", language:"ð Language", all:"All Designs", maggam:"Maggam Work", computer:"Computer Embroidery", blouse:"Blouse Designs", designerBlouses:"Designer Blouses", custom:"Custom Designs", designer:"Designer Wear", frocks:"Frocks", lehenga:"Designer Lehengas", bridal:"Wedding Wear", kids:"Kids Wear", saree:"Saree Tassels", search:"Search designs", sortNewest:"Newest first", sortOldest:"Oldest first", sortName:"Name AâZ", featured:"â Featured only", heroEyebrow:"PARVATHI CREATIONS Â· TELANGANA", heroTitle:"Tradition, tailored to you.", heroDescription:"Thoughtful stitching, intricate embroidery and occasionwear made with care â for the moments you want to remember.", explore:"Explore the collection", heroNote:"Made with care. Finished with love.", collectionEyebrow:"A LITTLE SOMETHING FOR EVERY OCCASION", collectionTitle:"Find your favourite.", collectionDescription:"From everyday elegance to wedding-day details, explore pieces inspired by your style.", photoDisclaimer:"Each custom order is discussed with you before stitching.", craftEyebrow:"THE BEAUTY IS IN THE DETAILS", craftTitle:"Made by hand. Made for you.", craftDescription:"From delicate threadwork to carefully finished blouses, we bring your ideas to life with patience, skill and a personal touch.", craftCta:"Letâs create something together", servicesEyebrow:"WHAT WE DO", servicesTitle:"Every detail, considered.", servicesDescription:"Tell us what you have in mind. Weâll help you find the right finish, fit and details for your occasion.", contactEyebrow:"YOUR IDEA, OUR CRAFT", contactTitle:"Have something in mind?", contactDescription:"Share your inspiration with us. Letâs talk about your design.", whatsapp:"Chat with us on WhatsApp", footerStory:"Where every stitch tells a story.", instagram:"Instagram", owner:"Owner login", footerCollection:"Collection", footerServices:"Services", footerContact:"Contact", service1:"Maggam work & hand embroidery", service2:"Computer embroidery", service3:"Blouse stitching & custom designs", service4:"Bridal wear, lehengas & occasionwear", service5:"Frocks, kids wear & salwar stitching", service6:"Saree tassels & finishing" },
  te: { home:"à°¹à±à°®à±", collection:"à°à°²à±à°à±à°·à°¨à±", craft:"à°®à°¾ à°à°³", services:"à°¸à±à°µà°²à±", contact:"à°¸à°à°ªà±à°°à°¦à°¿à°à°à°à°¡à°¿", enquire:"à°µà°¿à°à°¾à°°à°¿à°à°à°à°¡à°¿", language:"ð à°­à°¾à°·", all:"à°à°¨à±à°¨à°¿ à°¡à°¿à°à±à°¨à±à°²à±", maggam:"à°®à°à±à°à° à°µà°°à±à°à±", computer:"à°à°à°ªà±à°¯à±à°à°°à± à°à°à°¬à±à°°à°¾à°¯à°¿à°¡à°°à±", blouse:"à°¬à±à°²à±à°à± à°¡à°¿à°à±à°¨à±à°²à±", designerBlouses:"à°¡à°¿à°à±à°¨à°°à± à°¬à±à°²à±à°à±à°²à±", custom:"à°à°¸à±à°à°®à± à°¡à°¿à°à±à°¨à±à°²à±", designer:"à°¡à°¿à°à±à°¨à°°à± à°¦à±à°¸à±à°¤à±à°²à±", frocks:"à°«à±à°°à°¾à°à±à°¸à±", lehenga:"à°¡à°¿à°à±à°¨à°°à± à°²à±à°¹à°à°à°¾à°²à±", bridal:"à°ªà±à°³à±à°²à°¿ à°¦à±à°¸à±à°¤à±à°²à±", kids:"à°ªà°¿à°²à±à°²à°² à°¦à±à°¸à±à°¤à±à°²à±", saree:"à°à±à°° à°à°¾à°¸à±à°²à±à°¸à±", search:"à°¡à°¿à°à±à°¨à±à°²à°¨à± à°µà±à°¤à°à°à°¡à°¿", sortNewest:"à°à±à°¤à±à°¤à°µà°¿ à°®à±à°à°¦à±", sortOldest:"à°ªà°¾à°¤à°µà°¿ à°®à±à°à°¦à±", sortName:"à°ªà±à°°à± à°ªà±à°°à°à°¾à°°à°", featured:"â à°ªà±à°°à°¤à±à°¯à±à° à°¡à°¿à°à±à°¨à±à°²à± à°®à°¾à°¤à±à°°à°®à±", heroEyebrow:"à°ªà°¾à°°à±à°µà°¤à°¿ à°à±à°°à°¿à°¯à±à°·à°¨à±à°¸à± Â· à°¤à±à°²à°à°à°¾à°£", heroTitle:"à°®à± à°à°­à°¿à°°à±à°à°¿à°à°¿ à°¤à°à±à° à°¸à°à°ªà±à°°à°¦à°¾à°¯ à°¶à±à°²à°¿.", heroDescription:"à°®à±à°à± à°à±à°°à±à°¤à±à°à°¡à°¿à°ªà±à°¯à± à°¸à°à°¦à°°à±à°­à°¾à°² à°à±à°¸à° à°¶à±à°°à°¦à±à°§à°à°¾ à°à±à°à±à°à°¿à°¨ à°¦à±à°¸à±à°¤à±à°²à±, à°à°à°¦à°®à±à°¨ à°à°à°¬à±à°°à°¾à°¯à°¿à°¡à°°à±, à°ªà±à°°à°¤à±à°¯à±à° à°µà±à°¡à±à°à°² à°¦à±à°¸à±à°¤à±à°²à±.", explore:"à°à°²à±à°à±à°·à°¨à± à°à±à°¡à°à°¡à°¿", heroNote:"à°¶à±à°°à°¦à±à°§à°¤à± à°¤à°¯à°¾à°°à± à°à±à°¸à°¿, à°ªà±à°°à±à°®à°¤à± à°ªà±à°°à±à°¤à°¿ à°à±à°¸à±à°¤à°¾à°.", collectionEyebrow:"à°ªà±à°°à°¤à°¿ à°¸à°à°¦à°°à±à°­à°¾à°¨à°¿à°à± à°ªà±à°°à°¤à±à°¯à±à°à°à°à°¾", collectionTitle:"à°®à±à°à± à°¨à°à±à°à°¿à°¨ à°¡à°¿à°à±à°¨à±âà°¨à± à°à°à°à±à°à±à°à°¡à°¿.", collectionDescription:"à°°à±à°à±à°µà°¾à°°à± à°à°à°¦à° à°¨à±à°à°à°¿ à°ªà±à°³à±à°²à°¿ à°µà±à°¡à±à°à°² à°¦à±à°¸à±à°¤à±à°² à°µà°°à°à±, à°®à± à°¶à±à°²à°¿à°à°¿ à°¸à°°à°¿à°ªà±à°¯à± à°¡à°¿à°à±à°¨à±à°²à°¨à± à°à±à°¡à°à°¡à°¿.", photoDisclaimer:"à°à±à°à±à°à± à°ªà±à°°à°¾à°°à°à°­à°¿à°à°à± à°®à±à°à°¦à± à°ªà±à°°à°¤à°¿ à°à°¸à±à°à°®à± à°à°°à±à°¡à°°à± à°à±à°°à°¿à°à°à°¿ à°®à±à°¤à± à°à°°à±à°à°¿à°¸à±à°¤à°¾à°.", craftEyebrow:"à°µà°¿à°µà°°à°¾à°²à±à°²à±à°¨à± à°à°à°¦à°", craftTitle:"à°à±à°¤à°¿à°¤à± à°¤à°¯à°¾à°°à± à°à±à°¸à°¿à°¨à°µà°¿. à°®à±à°à±à°¸à°®à±.", craftDescription:"à°¸à±à°¨à±à°¨à°¿à°¤à°®à±à°¨ à°¦à°¾à°°à°ªà± à°ªà°¨à±à°² à°¨à±à°à°à°¿ à°à°à±à°à°à°¾ à°ªà±à°°à±à°¤à°¿ à°à±à°¸à°¿à°¨ à°¬à±à°²à±à°à±âà°² à°µà°°à°à±, à°®à± à°à°²à±à°à°¨à°²à°à± à°°à±à°ªà° à°à°¸à±à°¤à°¾à°.", craftCta:"à°®à°¨à°¿à°¦à±à°¦à°°à° à°à°²à°¿à°¸à°¿ à°à°à°¦à°®à±à°¨ à°¡à°¿à°à±à°¨à± à°à±à°¦à±à°¦à°¾à°", servicesEyebrow:"à°®à°¾ à°¸à±à°µà°²à±", servicesTitle:"à°ªà±à°°à°¤à°¿ à°µà°¿à°µà°°à°¾à°¨à°¿à°à± à°ªà±à°°à°¤à±à°¯à±à° à°¶à±à°°à°¦à±à°§.", servicesDescription:"à°®à±à°à± à°à°¾à°µà°²à°¸à°¿à°¨ à°¡à°¿à°à±à°¨à±âà°¨à± à°à±à°ªà±à°ªà°à°¡à°¿. à°¸à°°à±à°¨ à°«à°¿à°à±, à°«à°¿à°¨à°¿à°·à°¿à°à°à±, à°µà°¿à°µà°°à°¾à°²à°¨à± à°à°à°à±à°à±à°µà°¡à°à°²à± à°¸à°¹à°¾à°¯à° à°à±à°¸à±à°¤à°¾à°.", contactEyebrow:"à°®à± à°à°²à±à°à°¨ â à°®à°¾ à°à°³", contactTitle:"à°®à± à°®à°¨à°¸à±à°²à± à°à°¦à±à°¨à°¾ à°¡à°¿à°à±à°¨à± à°à°à°¦à°¾?", contactDescription:"à°®à±à°à± à°¨à°à±à°à°¿à°¨ à°¨à°®à±à°¨à°¾à°¨à± à°®à°¾à°¤à± à°ªà°à°à±à°à±à°à°¡à°¿. à°®à± à°¡à°¿à°à±à°¨à± à°à±à°°à°¿à°à°à°¿ à°®à°¾à°à±à°²à°¾à°¡à±à°à±à°à°¦à°¾à°.", whatsapp:"à°µà°¾à°à±à°¸à°¾à°ªà±âà°²à± à°®à°¾à°à±à°²à°¾à°¡à°à°¡à°¿", footerStory:"à°ªà±à°°à°¤à°¿ à°à±à°à±à°à±à°²à± à°à° à°à°¥ à°à°à°à±à°à°¦à°¿.", instagram:"à°à°¨à±âà°¸à±à°à°¾à°à±à°°à°¾à°®à±", owner:"à°¯à°à°®à°¾à°¨à°¿ à°²à°¾à°à°¿à°¨à±", footerCollection:"à°à°²à±à°à±à°·à°¨à±", footerServices:"à°¸à±à°µà°²à±", footerContact:"à°¸à°à°ªà±à°°à°¦à°¿à°à°à°à°¡à°¿", service1:"à°®à°à±à°à° à°µà°°à±à°à± à°®à°°à°¿à°¯à± à°à±à°¤à°¿ à°à°à°¬à±à°°à°¾à°¯à°¿à°¡à°°à±", service2:"à°à°à°ªà±à°¯à±à°à°°à± à°à°à°¬à±à°°à°¾à°¯à°¿à°¡à°°à±", service3:"à°¬à±à°²à±à°à± à°à±à°à±à°à± à°®à°°à°¿à°¯à± à°à°¸à±à°à°®à± à°¡à°¿à°à±à°¨à±à°²à±", service4:"à°ªà±à°³à±à°²à°¿ à°¦à±à°¸à±à°¤à±à°²à±, à°²à±à°¹à°à°à°¾à°²à± à°®à°°à°¿à°¯à± à°ªà±à°°à°¤à±à°¯à±à° à°¦à±à°¸à±à°¤à±à°²à±", service5:"à°«à±à°°à°¾à°à±à°¸à±, à°ªà°¿à°²à±à°²à°² à°¦à±à°¸à±à°¤à±à°²à± à°®à°°à°¿à°¯à± à°¸à°²à±à°µà°¾à°°à± à°à±à°à±à°à±", service6:"à°à±à°° à°à°¾à°¸à±à°²à±à°¸à± à°®à°°à°¿à°¯à± à°«à°¿à°¨à°¿à°·à°¿à°à°à±" },
  hi: { home:"à¤¹à¥à¤®", collection:"à¤à¤²à¥à¤à¥à¤¶à¤¨", craft:"à¤¹à¤®à¤¾à¤°à¥ à¤à¤²à¤¾", services:"à¤¸à¥à¤µà¤¾à¤à¤", contact:"à¤¸à¤à¤ªà¤°à¥à¤", enquire:"à¤ªà¥à¤à¤¤à¤¾à¤", language:"ð à¤­à¤¾à¤·à¤¾", all:"à¤¸à¤­à¥ à¤¡à¤¿à¤à¤¼à¤¾à¤à¤¨", maggam:"à¤®à¤à¥à¤à¤® à¤µà¤°à¥à¤", computer:"à¤à¤à¤ªà¥à¤¯à¥à¤à¤° à¤à¤¢à¤¼à¤¾à¤", blouse:"à¤¬à¥à¤²à¤¾à¤à¤à¤¼ à¤¡à¤¿à¤à¤¼à¤¾à¤à¤¨", designerBlouses:"à¤¡à¤¿à¤à¤¼à¤¾à¤à¤¨à¤° à¤¬à¥à¤²à¤¾à¤à¤à¤¼", custom:"à¤à¤¸à¥à¤à¤® à¤¡à¤¿à¤à¤¼à¤¾à¤à¤¨", designer:"à¤¡à¤¿à¤à¤¼à¤¾à¤à¤¨à¤° à¤µà¤¿à¤¯à¤°", frocks:"à¤«à¥à¤°à¥à¤", lehenga:"à¤¡à¤¿à¤à¤¼à¤¾à¤à¤¨à¤° à¤²à¤¹à¤à¤à¥", bridal:"à¤¶à¤¾à¤¦à¥ à¤à¥ à¤à¤ªà¤¡à¤¼à¥", kids:"à¤¬à¤à¥à¤à¥à¤ à¤à¥ à¤à¤ªà¤¡à¤¼à¥", saree:"à¤¸à¤¾à¤¡à¤¼à¥ à¤à¥à¤¸à¤²", search:"à¤¡à¤¿à¤à¤¼à¤¾à¤à¤¨ à¤à¥à¤à¥à¤", sortNewest:"à¤¨à¤ à¤ªà¤¹à¤²à¥", sortOldest:"à¤ªà¥à¤°à¤¾à¤¨à¥ à¤ªà¤¹à¤²à¥", sortName:"à¤¨à¤¾à¤® à¤à¥ à¤à¤¨à¥à¤¸à¤¾à¤°", featured:"â à¤à¥à¤µà¤² à¤µà¤¿à¤¶à¥à¤· à¤¡à¤¿à¤à¤¼à¤¾à¤à¤¨", heroEyebrow:"à¤ªà¤¾à¤°à¥à¤µà¤¤à¥ à¤à¥à¤°à¤¿à¤à¤¶à¤¨à¥à¤¸ Â· à¤¤à¥à¤²à¤à¤à¤¾à¤¨à¤¾", heroTitle:"à¤à¤ªà¤à¥ à¤ªà¤¸à¤à¤¦ à¤à¥ à¤à¤¨à¥à¤¸à¤¾à¤° à¤ªà¤°à¤à¤ªà¤°à¤¾à¥¤", heroDescription:"à¤¯à¤¾à¤¦à¤à¤¾à¤° à¤ªà¤²à¥à¤ à¤à¥ à¤²à¤¿à¤ à¤¸à¤¾à¤µà¤§à¤¾à¤¨à¥ à¤¸à¥ à¤à¥ à¤à¤ à¤¸à¤¿à¤²à¤¾à¤, à¤¬à¤¾à¤°à¥à¤ à¤à¤¢à¤¼à¤¾à¤ à¤à¤° à¤à¤¾à¤¸ à¤à¤µà¤¸à¤°à¥à¤ à¤à¥ à¤à¤ªà¤¡à¤¼à¥à¥¤", explore:"à¤à¤²à¥à¤à¥à¤¶à¤¨ à¤¦à¥à¤à¥à¤", heroNote:"à¤¸à¤¾à¤µà¤§à¤¾à¤¨à¥ à¤¸à¥ à¤¬à¤¨à¤¾à¤¯à¤¾, à¤ªà¥à¤¯à¤¾à¤° à¤¸à¥ à¤ªà¥à¤°à¤¾ à¤à¤¿à¤¯à¤¾à¥¤", collectionEyebrow:"à¤¹à¤° à¤à¤µà¤¸à¤° à¤à¥ à¤²à¤¿à¤ à¤à¥à¤ à¤à¤¾à¤¸", collectionTitle:"à¤à¤ªà¤¨à¤¾ à¤ªà¤¸à¤à¤¦à¥à¤¦à¤¾ à¤¡à¤¿à¤à¤¼à¤¾à¤à¤¨ à¤à¥à¤¨à¥à¤à¥¤", collectionDescription:"à¤°à¥à¤à¤¼à¤®à¤°à¥à¤°à¤¾ à¤à¥ à¤¸à¥à¤à¤¦à¤°à¤¤à¤¾ à¤¸à¥ à¤²à¥à¤à¤° à¤¶à¤¾à¤¦à¥ à¤à¥ à¤à¤¾à¤¸ à¤à¤ªà¤¡à¤¼à¥à¤ à¤¤à¤, à¤à¤ªà¤¨à¥ à¤¶à¥à¤²à¥ à¤¸à¥ à¤ªà¥à¤°à¥à¤°à¤¿à¤¤ à¤¡à¤¿à¤à¤¼à¤¾à¤à¤¨ à¤¦à¥à¤à¥à¤à¥¤", photoDisclaimer:"à¤¸à¤¿à¤²à¤¾à¤ à¤¶à¥à¤°à¥ à¤à¤°à¤¨à¥ à¤¸à¥ à¤ªà¤¹à¤²à¥ à¤¹à¤° à¤à¤¸à¥à¤à¤® à¤à¤°à¥à¤¡à¤° à¤ªà¤° à¤à¤ªà¤¸à¥ à¤à¤°à¥à¤à¤¾ à¤à¥ à¤à¤¾à¤¤à¥ à¤¹à¥à¥¤", craftEyebrow:"à¤à¥à¤¬à¤¸à¥à¤°à¤¤à¥ à¤¬à¤¾à¤°à¥à¤à¤¿à¤¯à¥à¤ à¤®à¥à¤ à¤¹à¥", craftTitle:"à¤¹à¤¾à¤¥à¥à¤ à¤¸à¥ à¤¬à¤¨à¤¾à¤¯à¤¾à¥¤ à¤à¤ªà¤à¥ à¤²à¤¿à¤à¥¤", craftDescription:"à¤¨à¤¾à¤à¤¼à¥à¤ à¤§à¤¾à¤à¥ à¤à¥ à¤à¤¾à¤® à¤¸à¥ à¤²à¥à¤à¤° à¤à¤à¥à¤à¥ à¤¤à¤°à¤¹ à¤¤à¥à¤¯à¤¾à¤° à¤¬à¥à¤²à¤¾à¤à¤à¤¼ à¤¤à¤, à¤¹à¤® à¤à¤ªà¤à¥ à¤µà¤¿à¤à¤¾à¤°à¥à¤ à¤à¥ à¤à¤à¤¾à¤° à¤¦à¥à¤¤à¥ à¤¹à¥à¤à¥¤", craftCta:"à¤à¤à¤, à¤®à¤¿à¤²à¤à¤° à¤à¥à¤ à¤à¤¾à¤¸ à¤¬à¤¨à¤¾à¤à¤", servicesEyebrow:"à¤¹à¤®à¤¾à¤°à¥ à¤¸à¥à¤µà¤¾à¤à¤", servicesTitle:"à¤¹à¤° à¤¬à¤¾à¤°à¥à¤à¥ à¤ªà¤° à¤§à¥à¤¯à¤¾à¤¨à¥¤", servicesDescription:"à¤à¤ªà¤¨à¥ à¤ªà¤¸à¤à¤¦ à¤¬à¤¤à¤¾à¤à¤à¥¤ à¤¹à¤® à¤¸à¤¹à¥ à¤«à¤¿à¤, à¤«à¤¿à¤¨à¤¿à¤¶ à¤à¤° à¤à¤µà¤¸à¤° à¤à¥ à¤à¤¨à¥à¤¸à¤¾à¤° à¤µà¤¿à¤µà¤°à¤£ à¤à¥à¤¨à¤¨à¥ à¤®à¥à¤ à¤®à¤¦à¤¦ à¤à¤°à¥à¤à¤à¥à¥¤", contactEyebrow:"à¤à¤ªà¤à¤¾ à¤µà¤¿à¤à¤¾à¤°, à¤¹à¤®à¤¾à¤°à¥ à¤à¤²à¤¾", contactTitle:"à¤à¥à¤¯à¤¾ à¤à¤ªà¤à¥ à¤®à¤¨ à¤®à¥à¤ à¤à¥à¤ à¤¡à¤¿à¤à¤¼à¤¾à¤à¤¨ à¤¹à¥?", contactDescription:"à¤à¤ªà¤¨à¥ à¤ªà¤¸à¤à¤¦ à¤à¥ à¤¤à¤¸à¥à¤µà¥à¤° à¤¯à¤¾ à¤ªà¥à¤°à¥à¤°à¤£à¤¾ à¤¸à¤¾à¤à¤¾ à¤à¤°à¥à¤à¥¤ à¤à¤à¤, à¤à¤ªà¤à¥ à¤¡à¤¿à¤à¤¼à¤¾à¤à¤¨ à¤ªà¤° à¤¬à¤¾à¤¤ à¤à¤°à¥à¤à¥¤", whatsapp:"WhatsApp à¤ªà¤° à¤¬à¤¾à¤¤ à¤à¤°à¥à¤", footerStory:"à¤¹à¤° à¤¸à¤¿à¤²à¤¾à¤ à¤à¤ à¤à¤¹à¤¾à¤¨à¥ à¤à¤¹à¤¤à¥ à¤¹à¥à¥¤", instagram:"à¤à¤à¤¸à¥à¤à¤¾à¤à¥à¤°à¤¾à¤®", owner:"à¤®à¤¾à¤²à¤¿à¤ à¤²à¥à¤à¤¿à¤¨", footerCollection:"à¤à¤²à¥à¤à¥à¤¶à¤¨", footerServices:"à¤¸à¥à¤µà¤¾à¤à¤", footerContact:"à¤¸à¤à¤ªà¤°à¥à¤", service1:"à¤®à¤à¥à¤à¤® à¤µà¤°à¥à¤ à¤à¤° à¤¹à¤¾à¤¥ à¤à¥ à¤à¤¢à¤¼à¤¾à¤", service2:"à¤à¤à¤ªà¥à¤¯à¥à¤à¤° à¤à¤¢à¤¼à¤¾à¤", service3:"à¤¬à¥à¤²à¤¾à¤à¤à¤¼ à¤¸à¤¿à¤²à¤¾à¤ à¤à¤° à¤à¤¸à¥à¤à¤® à¤¡à¤¿à¤à¤¼à¤¾à¤à¤¨", service4:"à¤¶à¤¾à¤¦à¥ à¤à¥ à¤à¤ªà¤¡à¤¼à¥, à¤²à¤¹à¤à¤à¥ à¤à¤° à¤à¤¾à¤¸ à¤ªà¤°à¤¿à¤§à¤¾à¤¨", service5:"à¤«à¥à¤°à¥à¤, à¤¬à¤à¥à¤à¥à¤ à¤à¥ à¤à¤ªà¤¡à¤¼à¥ à¤à¤° à¤¸à¤²à¤µà¤¾à¤° à¤¸à¤¿à¤²à¤¾à¤", service6:"à¤¸à¤¾à¤¡à¤¼à¥ à¤à¥à¤¸à¤² à¤à¤° à¤«à¤¿à¤¨à¤¿à¤¶à¤¿à¤à¤" }
};

const pcStaticTranslations = [
  [".hero-copy .eyebrow","heroEyebrow"],[".hero-copy h1","heroTitle"],[".hero-description","heroDescription"],[".hero-copy .button-dark span:first-child","explore"],[".hero-note","heroNote"],
  [".collection .section-topline .eyebrow","collectionEyebrow"],[".collection .section-heading-row h2","collectionTitle"],[".collection .section-heading-row > p","collectionDescription"],[".photo-disclaimer","photoDisclaimer"],
  [".craft-copy .eyebrow","craftEyebrow"],[".craft-copy h2","craftTitle"],[".craft-copy > p:not(.eyebrow)","craftDescription"],
  [".services .section-topline .eyebrow","servicesEyebrow"],[".services-heading h2","servicesTitle"],[".services-heading > p","servicesDescription"],
  [".contact-band .eyebrow","contactEyebrow"],[".contact-band h2","contactTitle"],[".contact-band > p:not(.eyebrow)","contactDescription"],[".contact-band .button span:first-child","whatsapp"],
  [".site-footer > p","footerStory"],[".service-list > div:nth-child(1) h3","service1"],[".service-list > div:nth-child(2) h3","service2"],[".service-list > div:nth-child(3) h3","service3"],[".service-list > div:nth-child(4) h3","service4"],[".service-list > div:nth-child(5) h3","service5"],[".service-list > div:nth-child(6) h3","service6"]
];

window.changeLanguage = function (language) {
  if (!Object.prototype.hasOwnProperty.call(pcTranslations, language)) language = "en";
  const t = pcTranslations[language];
  try { localStorage.setItem("parvathiLanguage", language); } catch (error) {}
  const welcome = document.getElementById("languageWelcome");
  if (welcome) welcome.hidden = true;
  document.documentElement.lang = language;
  document.documentElement.setAttribute("data-language", language);
  const selector = document.getElementById("languageSelect");
  if (selector && selector.value !== language) selector.value = language;

  document.querySelectorAll("[data-en]").forEach(function (element) {
    const translated = element.getAttribute("data-" + language);
    const fallback = element.getAttribute("data-en");
    if (translated !== null) element.innerHTML = translated;
    else if (fallback !== null) element.innerHTML = fallback;
  });

  const navKeys = ["home", "collection", "craft", "services", "contact"];
  document.querySelectorAll(".main-nav a").forEach(function (element, index) {
    if (navKeys[index]) element.textContent = t[navKeys[index]];
  });
  const enquire = document.querySelector(".header-cta");
  if (enquire) enquire.innerHTML = t.enquire + " <span>â</span>";

  pcStaticTranslations.forEach(function (pair) {
    const element = document.querySelector(pair[0]);
    if (element && t[pair[1]]) {
      if (pair[1] === "heroNote") {
        const star = element.querySelector(".tiny-star");
        element.textContent = t[pair[1]];
        if (star) element.prepend(star);
      } else if (pair[1] === "craftTitle" || pair[1] === "servicesTitle" || pair[1] === "contactTitle") {
        element.textContent = t[pair[1]];
      } else {
        const child = element.querySelector("span");
        if (child && ["explore","craftCta","whatsapp"].includes(pair[1])) child.textContent = t[pair[1]];
        else element.textContent = t[pair[1]];
      }
    }
  });

  const contactWhatsApp = document.querySelector(".contact-band .button-light");
  if (contactWhatsApp) {
    const messages = {
      en: "Hello Parvathi Creations, I'd like to enquire about a custom order.",
      te: "à°¨à°®à°¸à±à°à°¾à°°à° à°ªà°¾à°°à±à°µà°¤à°¿ à°à±à°°à°¿à°¯à±à°·à°¨à±à°¸à±, à°à°¸à±à°à°®à± à°à°°à±à°¡à°°à± à°à±à°°à°¿à°à°à°¿ à°µà°¿à°µà°°à°¾à°²à± à°à°¾à°µà°¾à°²à°¿.",
      hi: "à¤¨à¤®à¤¸à¥à¤¤à¥ à¤ªà¤¾à¤°à¥à¤µà¤¤à¥ à¤à¥à¤°à¤¿à¤à¤¶à¤¨à¥à¤¸, à¤®à¥à¤ à¤à¤¸à¥à¤à¤® à¤à¤°à¥à¤¡à¤° à¤à¥ à¤¬à¤¾à¤°à¥ à¤®à¥à¤ à¤ªà¥à¤à¤¤à¤¾à¤ à¤à¤°à¤¨à¤¾ à¤à¤¾à¤¹à¤¤à¤¾/à¤à¤¾à¤¹à¤¤à¥ à¤¹à¥à¤à¥¤"
    };
    contactWhatsApp.href = "https://wa.me/919550766784?text=" + encodeURIComponent(messages[language] || messages.en);
  }

  const label = document.querySelector('label[for="languageSelect"]');
  if (label) label.textContent = t.language;
  const footerLinks = document.querySelectorAll(".footer-links a");
  const footerKeys = ["footerCollection","footerServices","footerContact","instagram","owner"];
  footerLinks.forEach(function (element,index) { if (t[footerKeys[index]]) element.textContent = t[footerKeys[index]] + (index === 3 ? " â" : ""); });

  const categoryLabels = {all:t.all,maggam:t.maggam,computer:t.computer,blouse:t.blouse,"designer-blouses":t.designerBlouses,designer:t.designer,frocks:t.frocks,lehenga:t.lehenga,bridal:t.bridal,kids:t.kids,saree:t.saree,custom:t.custom};
  document.querySelectorAll(".gallery-filters button[data-filter]").forEach(function (button) {
    const key = button.dataset.filter;
    if (categoryLabels[key]) button.textContent = categoryLabels[key];
  });
  const search = document.getElementById("gallerySearch");
  if (search) { search.placeholder = t.search; search.setAttribute("aria-label", t.search); }
  const sort = document.getElementById("gallerySort");
  if (sort && sort.options.length >= 3) {
    sort.options[0].textContent = t.sortNewest;
    sort.options[1].textContent = t.sortOldest;
    sort.options[2].textContent = t.sortName;
  }
  const featured = document.getElementById("galleryFeatured");
  if (featured) featured.textContent = t.featured;
  document.dispatchEvent(new Event("parvathi-language-changed"));
};

function applySavedLanguageOrAsk() {
  let saved = null;
  try { saved = localStorage.getItem("parvathiLanguage"); } catch (error) {}
  if (saved && Object.prototype.hasOwnProperty.call(pcTranslations, saved)) {
    window.changeLanguage(saved);
  } else {
    const welcome = document.getElementById("languageWelcome");
    if (welcome) {
      welcome.hidden = false;
      const firstChoice = welcome.querySelector("button");
      if (firstChoice) firstChoice.focus();
    }
  }
}

window.addEventListener("pageshow", applySavedLanguageOrAsk);

function initSavedLanguage() { applySavedLanguageOrAsk(); }

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initSavedLanguage, { once: true });
} else {
  initSavedLanguage();
}

})();
