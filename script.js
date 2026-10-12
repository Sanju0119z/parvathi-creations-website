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


  let currentLanguage = "en";
  const DESIGN_TRANSLATIONS = {
    "7": {name:{te:"స్వీట్‌హార్ట్ బ్లౌజ్",hi:"स्वीटहार्ट ब्लाउज़"},description:{te:"#కుట్టు మాత్రమే\nలావెండర్ పెర్ల్ బ్లౌజ్ వివరాలు✨\n💜చేతులు: పూల ఎంబ్రాయిడరీతో పారదర్శక పఫ్ ఆర్గంజా చేతులు, వెడల్పైన ఎంబ్రాయిడరీ కఫ్స్.\n💜వెనుక: లోతైన U-కట్, ముత్యాల అంచు, వస్త్ర లట్కన్‌లతో డోరీ కట్టు, కింద బటన్ల పట్టీ.",hi:"#केवल सिलाई\nलैवेंडर पर्ल ब्लाउज़ विवरण✨\n💜आस्तीन: फूलों की कढ़ाई और चौड़े कढ़ाईदार कफ वाली पारदर्शी पफ ऑर्गेंज़ा आस्तीन।\n💜पीछे: गहरा U-कट, मोतियों की बॉर्डर, कपड़े की लटकन वाली डोरी और नीचे बटनों की पट्टी."}},
    "6": {name:{te:"రోజువారీ బ్లౌజ్",hi:"रोज़ाना पहनने वाला ब्लाउज़"},description:{te:"మీ బ్లౌజ్ సైజు లేదా మీరు ఇచ్చే కొలతల ప్రకారం కుట్టి ఇవ్వగలము.",hi:"आपके ब्लाउज़ के साइज़ या दिए गए माप के अनुसार सिलाई की जा सकती है।"}},
    "5": {name:{te:"లెహంగా",hi:"लहंगा"},description:{te:"ప్రతి కస్టమర్ అభిరుచి మరియు కొలతల ప్రకారం కుట్టి ఇవ్వగలము.",hi:"हर ग्राहक की पसंद और माप के अनुसार सिलाई की जा सकती है।"}},
    "4": {name:{te:"లాంగ్ ఫ్రాక్",hi:"लंबी फ्रॉक"},description:{te:"ఇది అనార్కలి శైలి గౌన్ సూట్. వెడల్పైన U-మెడ, పూర్తి పొడవు చేతులు, నడుము మడతలతో నేలవరకు గొడుగు ఆకారపు విస్తరణ, సున్నితమైన పూల ఎంబ్రాయిడరీ, తేలికపాటి దుపట్టా ఉంటాయి.",hi:"यह अनारकली शैली का गाउन सूट है। इसमें चौड़ी U-नेकलाइन, पूरी आस्तीन, कमर से नीचे तक छतरी जैसा घेरा, हल्की फूलों की कढ़ाई और दुपट्टा है."}},
    "3": {name:{te:"మోకాలి పొడవు ఫ్రాక్",hi:"घुटने तक लंबी फ्रॉक"},description:{te:"అందంగా కుట్టిన ఈ మోకాలి పొడవు ఫ్రాక్ పార్టీలకు చక్కగా సరిపోతుంది. పఫ్ చేతులు దీనికి ఆకర్షణీయమైన రూపాన్ని ఇస్తాయి.",hi:"यह खूबसूरती से सिली घुटने तक लंबी फ्रॉक पार्टियों के लिए बेहतरीन है। पफ आस्तीन इसे आकर्षक लुक देती हैं।"}},
    "2": {name:{te:"తెల్లని పొడవాటి డ్రెస్",hi:"सफ़ेद लंबी ड्रेस"}},
    "1": {name:{te:"మగ్గం వర్క్",hi:"मग्गम वर्क"}}
  };
  const CATEGORY_TRANSLATIONS = {
    en:{all:"All Designs",maggam:"Maggam Work",computer:"Computer Embroidery",blouse:"Blouse Designs",designer:"Designer Wear",frocks:"Frocks",lehenga:"Designer Lehengas",bridal:"Wedding Wear",kids:"Kids Wear",saree:"Sarees & Tassels",custom:"Custom Designs"},
    te:{all:"అన్ని డిజైన్లు",maggam:"మగ్గం వర్క్",computer:"కంప్యూటర్ ఎంబ్రాయిడరీ",blouse:"బ్లౌజ్ డిజైన్లు",designer:"డిజైనర్ దుస్తులు",frocks:"ఫ్రాక్స్",lehenga:"డిజైనర్ లెహెంగాలు",bridal:"పెళ్లి దుస్తులు",kids:"పిల్లల దుస్తులు",saree:"చీరలు & టాసెల్స్",custom:"కస్టమ్ డిజైన్లు"},
    hi:{all:"सभी डिज़ाइन",maggam:"मग्गम वर्क",computer:"कंप्यूटर कढ़ाई",blouse:"ब्लाउज़ डिज़ाइन",designer:"डिज़ाइनर परिधान",frocks:"फ्रॉक",lehenga:"डिज़ाइनर लहंगे",bridal:"शादी के परिधान",kids:"बच्चों के कपड़े",saree:"साड़ियाँ और लटकन",custom:"कस्टम डिज़ाइन"}
  };
  function localizedField(design, field) {
    const item = DESIGN_TRANSLATIONS[String(design.id)];
    return currentLanguage !== "en" && item && item[field] && item[field][currentLanguage]
      ? item[field][currentLanguage] : (design[field] || "");
  }
  function localizedCategory(key, fallback) {
    return (CATEGORY_TRANSLATIONS[currentLanguage] && CATEGORY_TRANSLATIONS[currentLanguage][key]) || fallback || "";
  }

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
      categoryLabel: key === cats.UNCATEGORIZED ? (categoryRaw || "Other") : cats.labelFor(key),
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
    const parts = ["Hello Parvathi Creations! I\u2019m interested in this design: " + (localizedField(design, "name") || localizedCategory(design.categoryKey, design.categoryLabel)) + " (" + design.categoryLabel + ")."];
    if (design.code) parts.push("Design code: " + design.code + ".");
    if (design.price) parts.push("Price: ₹" + design.price);
    if (localizedField(design, "description")) parts.push((currentLanguage === "te" ? "వివరణ: " : currentLanguage === "hi" ? "विवरण: " : "Description: ") + localizedField(design, "description"));
    parts.push("Image: " + design.imageUrl);
    parts.push("Please share details.");
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
    dialog.setAttribute("aria-label", (localizedField(design, "name") || localizedCategory(design.categoryKey, design.categoryLabel)) + " details");

    const close = document.createElement("button");
    close.type = "button";
    close.className = "design-details-close";
    close.textContent = "×";
    close.setAttribute("aria-label", "Close design details");
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
    photo.alt = localizedField(design, "name") || localizedCategory(design.categoryKey, design.categoryLabel) + " design";
    media.append(photo);
    const galleryImages = Array.isArray(design.galleryImages) ? design.galleryImages : [design.imageUrl];
    if (galleryImages.length > 1) {
      const thumbnails = document.createElement("div");
      thumbnails.className = "design-details-thumbnails";
      galleryImages.slice(0, 6).forEach((url, index) => {
        const thumb = document.createElement("button");
        thumb.type = "button";
        thumb.className = "design-details-thumbnail" + (url === design.imageUrl ? " is-active" : "");
        thumb.setAttribute("aria-label", (index === 0 ? "Cover photo" : "Photo " + (index + 1)));
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
    category.textContent = localizedCategory(design.categoryKey, design.categoryLabel);
    const heading = document.createElement("h2");
    heading.textContent = localizedField(design, "name") || localizedCategory(design.categoryKey, design.categoryLabel) + " design";
    const price = document.createElement("p");
    price.className = "design-details-price";
    price.textContent = design.price ? "₹" + design.price : "Price available on enquiry";
    const descriptionLabel = document.createElement("h3");
    descriptionLabel.textContent = "Description";
    const description = document.createElement("p");
    description.className = "design-details-description";
    description.textContent = localizedField(design, "description") || (currentLanguage === "te" ? "ఈ డిజైన్ గురించి మరిన్ని వివరాల కోసం మమ్మల్ని సంప్రదించండి." : currentLanguage === "hi" ? "इस डिज़ाइन के बारे में अधिक जानकारी के लिए हमसे संपर्क करें।" : "Please contact us for more details about this design.");
    info.append(category, heading, price);
    if (design.code) {
      const code = document.createElement("p");
      code.className = "design-details-code";
      code.textContent = "Design code: " + design.code;
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
    imageButton.setAttribute("aria-label", "View details for " + (localizedField(design, "name") || localizedCategory(design.categoryKey, design.categoryLabel)));
    imageButton.addEventListener("click", () => openDesignDetails(design));
    const img = document.createElement("img");
    img.src = design.imageUrl;
    img.alt = localizedField(design, "name") || localizedCategory(design.categoryKey, design.categoryLabel) + " design";
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
    heading.textContent = localizedField(design, "name") || localizedCategory(design.categoryKey, design.categoryLabel);
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
      dot.setAttribute("aria-label", "Show design " + (index + 1) + ": " + (localizedField(design, "name") || localizedCategory(design.categoryKey, design.categoryLabel) || "Boutique design"));
      dot.addEventListener("click", () => { heroSlideIndex = index; showSlide(); restartTimer(); });
      dots.append(dot);
    });
    function showSlide() {
      const design = slides[heroSlideIndex];
      image.src = design.imageUrl;
      image.alt = [design.name, design.categoryLabel, "Parvathi Creations design"].filter(Boolean).join(" — ");
      name.textContent = localizedField(design, "name") || localizedCategory(design.categoryKey, design.categoryLabel) || "A design made with care";
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

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();

const pcTranslations = {
  en: { home: "Home", collection: "Collection", craft: "Our Craft", services: "Services", contact: "Contact", enquire: "Enquire" },
  te: { home: "హోమ్", collection: "కలెక్షన్", craft: "మా కళ", services: "సేవలు", contact: "సంప్రదించండి", enquire: "విచారించండి" },
  hi: { home: "होम", collection: "कलेक्शन", craft: "हमारी कला", services: "सेवाएँ", contact: "संपर्क", enquire: "पूछताछ करें" }
};

window.changeLanguage = function (language) {
  currentLanguage = language;
  const translations = pcTranslations[language];
  if (!translations) return;

  try { localStorage.setItem("parvathiLanguage", language); } catch (error) {}
  document.documentElement.lang = language;

  const selector = document.getElementById("languageSelect");
  if (selector) selector.value = language;

  const nav = document.querySelectorAll(".main-nav a");
  const keys = ["home", "collection", "craft", "services", "contact"];
  nav.forEach(function (element, index) {
    if (keys[index]) element.textContent = translations[keys[index]];
  });

  const enquire = document.querySelector(".header-cta");
  if (enquire) {
    const textNode = Array.from(enquire.childNodes).find(
      node => node.nodeType === Node.TEXT_NODE && node.textContent.trim()
    );
    if (textNode) textNode.textContent = " " + translations.enquire + " ";
    else enquire.textContent = translations.enquire;
  }

  document.querySelectorAll("[data-en]").forEach(function (element) {
    const translated = element.getAttribute("data-" + language);
    if (translated !== null) element.innerHTML = translated;
  });
  const labels = CATEGORY_TRANSLATIONS[language] || CATEGORY_TRANSLATIONS.en;
  document.querySelectorAll("#galleryFilters button[data-filter]").forEach(function (button) {
    button.textContent = labels[button.dataset.filter] || button.textContent;
  });
  if (state.status === "ready" && typeof render === "function") render();
};

function initSavedLanguage() {
  let language = "en";
  try {
    const saved = localStorage.getItem("parvathiLanguage");
    if (saved && Object.prototype.hasOwnProperty.call(pcTranslations, saved)) language = saved;
  } catch (error) {}
  window.changeLanguage(language);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initSavedLanguage, { once: true });
} else {
  initSavedLanguage();
}

})();
