(() => {
  "use strict";

  /* ---------- Configuration ---------- */
  const SUPABASE_URL = "https://ydhqjkyzbbooolaugydk.supabase.co";
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
    en: {loading:"Loading designs…",errorTitle:"We couldn't load the designs right now.",errorHelp:"Please check your connection and try again.",retry:"Try again",emptyTitle:"Our design gallery is being updated.",emptyHelp:"New designs will appear here soon. In the meantime, message us on WhatsApp to see our latest work.",noMatchTitle:"No designs match your choices.",noMatchHelp:"Try another category or search, or clear the filters.",clearFilters:"Clear filters",photoUnavailable:"Photo unavailable",showing:(n,total)=>"Showing "+n+" of "+total+" design"+(total===1?"":"s"),featured:"★ Featured",featuredOnly:"★ Featured only",searchLabel:"Search designs",searchPlaceholder:"Search designs…",sortLabel:"Sort designs",sortNewest:"Newest first",sortOldest:"Oldest first",sortName:"Name A–Z",like:"♡ I Like This Design",liked:"♥ Liked",enquire:"Enquire on WhatsApp",contactUnavailable:"The WhatsApp contact number is not available right now."},
    te: {loading:"డిజైన్లు లోడ్ అవుతున్నాయి…",errorTitle:"ప్రస్తుతం డిజైన్లను లోడ్ చేయలేకపోయాం.",errorHelp:"ఇంటర్నెట్ కనెక్షన్‌ను తనిఖీ చేసి మళ్లీ ప్రయత్నించండి.",retry:"మళ్లీ ప్రయత్నించండి",emptyTitle:"మా డిజైన్ గ్యాలరీ నవీకరించబడుతోంది.",emptyHelp:"కొత్త డిజైన్లు త్వరలో కనిపిస్తాయి. అప్పటివరకు మా తాజా పనిని చూడటానికి వాట్సాప్‌లో సందేశం పంపండి.",noMatchTitle:"మీ ఎంపికలకు సరిపోయే డిజైన్లు లేవు.",noMatchHelp:"మరొక వర్గం లేదా శోధనను ప్రయత్నించండి, లేదా ఫిల్టర్లను తొలగించండి.",clearFilters:"ఫిల్టర్లను తొలగించండి",photoUnavailable:"ఫోటో అందుబాటులో లేదు",showing:(n,total)=>total+" డిజైన్లలో "+n+" చూపిస్తున్నాం",featured:"★ ప్రత్యేక డిజైన్",featuredOnly:"★ ప్రత్యేక డిజైన్లు మాత్రమే",searchLabel:"డిజైన్లను వెతకండి",searchPlaceholder:"డిజైన్లను వెతకండి…",sortLabel:"డిజైన్లను క్రమబద్ధీకరించండి",sortNewest:"కొత్తవి ముందు",sortOldest:"పాతవి ముందు",sortName:"పేరు ప్రకారం",like:"♡ ఈ డిజైన్ నాకు నచ్చింది",liked:"♥ నచ్చింది",enquire:"వాట్సాప్‌లో వివరాలు అడగండి",contactUnavailable:"ప్రస్తుతం వాట్సాప్ నంబర్ అందుబాటులో లేదు."},
    hi: {loading:"डिज़ाइन लोड हो रहे हैं…",errorTitle:"अभी डिज़ाइन लोड नहीं हो सके।",errorHelp:"अपना इंटरनेट कनेक्शन जाँचें और फिर कोशिश करें।",retry:"फिर कोशिश करें",emptyTitle:"हमारी डिज़ाइन गैलरी अपडेट हो रही है।",emptyHelp:"नए डिज़ाइन जल्द दिखाई देंगे। तब तक हमारा नया काम देखने के लिए WhatsApp पर संदेश भेजें।",noMatchTitle:"आपकी पसंद से मेल खाने वाले डिज़ाइन नहीं मिले।",noMatchHelp:"दूसरी श्रेणी या खोज आज़माएँ, या फ़िल्टर हटाएँ।",clearFilters:"फ़िल्टर हटाएँ",photoUnavailable:"फ़ोटो उपलब्ध नहीं है",showing:(n,total)=>total+" डिज़ाइन में से "+n+" दिखाए जा रहे हैं",featured:"★ खास डिज़ाइन",featuredOnly:"★ केवल खास डिज़ाइन",searchLabel:"डिज़ाइन खोजें",searchPlaceholder:"डिज़ाइन खोजें…",sortLabel:"डिज़ाइन क्रमबद्ध करें",sortNewest:"नए पहले",sortOldest:"पुराने पहले",sortName:"नाम के अनुसार",like:"♡ मुझे यह डिज़ाइन पसंद है",liked:"♥ पसंद आया",enquire:"WhatsApp पर पूछताछ करें",contactUnavailable:"अभी WhatsApp नंबर उपलब्ध नहीं है।"}
  };

  function applyGalleryLanguage(language) {
    const translated = galleryTextByLanguage[language] || galleryTextByLanguage.en;
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
    const normalizeText = value => String(value == null ? "" : value).toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
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
  let heroSlides = [];
  const el = {};

  /* ---------- Data preparation ---------- */
  function cleanText(value) { return typeof value === "string" ? value.trim() : ""; }

  /* The database stores "featured" as text ("true"/"false"), so accept both a real boolean and that text. */
  function isFeatured(value) {
    return value === true || (typeof value === "string" && value.trim().toLowerCase() === "true");
  }

  function polishGalleryCopy(value, kind) {
    const text = cleanText(value);
    const normalised = text.replace(/[\u200B-\u200D\uFEFF]/g, "").replace(/\s+/g, " ").trim();
    if (kind === "name" && /^Lehanga$/i.test(normalised)) return "Lehenga";
    const corrections = {
      "This elegantly stiched frock is perfectly fit for parties is gives you of an amazing look it has puff seleves with the knee length frock": "This elegantly stitched knee-length frock is perfect for parties. Its puff sleeves give it a lovely, stylish look.",
      "Can be stiched according to respective customer": "Can be stitched to each customer's measurements and preferences.",
      "#Stiching only Lavender Pearl Blouse Details✨ 💜Sleeve:Sheer puff organza style with scattered floral embroidery and wide embroidered cuffs. 💜Back:Deep U-cut,pearl border,dori tie-up with fabric latkans,lower button placket.": "#Stitching only. Lavender Pearl Blouse details: Sleeves: Sheer puff organza with scattered floral embroidery and wide embroidered cuffs. Back: Deep U-cut with a pearl border, dori tie-up with fabric latkans, and a lower button placket.",
      "Saree doal silk borrder leavy": "Saree with a dual-silk border and a rich, heavy look."
    };
    return corrections[normalised] || text;
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
    const name = polishGalleryCopy(row && row.name, "name");
    const categoryRaw = cleanText(row && row.category);
    const key = cats.keyFor(categoryRaw);
    return {
      id: row && row.id != null ? String(row.id) : imageUrl,
      name: name,
      categoryRaw: categoryRaw,
      categoryKey: key,
      categoryLabel: /^festival\s*banner$/i.test(categoryRaw) ? "Festival Greeting" : (key === cats.UNCATEGORIZED ? (categoryRaw || "Other") : cats.labelFor(key)),
      isFestivalBanner: /^festival\s*banner$/i.test(categoryRaw),
      description: polishGalleryCopy(row && row.description, "description"),
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

  async function openWhatsApp(design) {
    if (!/^\d{8,15}$/.test(WHATSAPP_NUMBER)) { window.alert(TEXT.contactUnavailable); return; }
    trackInterest("enquiry", design);
    const popup = window.open("about:blank", "_blank");
    if (popup) popup.opener = null;
    const language = pcCurrentLanguage();
    const [translatedName, translatedCategory, translatedDescription] = await Promise.all([
      pcTranslateDesignTextAsync(design.name || design.categoryLabel, language, "name"),
      pcTranslateDesignTextAsync(design.categoryLabel, language, "category"),
      design.description ? pcTranslateDesignTextAsync(design.description, language, "description") : Promise.resolve("")
    ]);
    if (pcCurrentLanguage() !== language) { if (popup && !popup.closed) popup.close(); return; }
    const parts = [pcUiText("message") + translatedName + " (" + translatedCategory + ")."];
    if (design.code) parts.push(pcUiText("code") + design.code + ".");
    if (design.price) parts.push(pcUiText("price") + design.price);
    if (translatedDescription) parts.push(pcUiText("description") + translatedDescription);
    parts.push(pcCurrentLanguage() === "te" ? "చిత్రం: " + design.imageUrl : pcCurrentLanguage() === "hi" ? "तस्वीर: " + design.imageUrl : "Image: " + design.imageUrl);
    parts.push(pcUiText("details"));
    const whatsappUrl = "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(parts.join(" "));
    if (popup && !popup.closed) popup.location.href = whatsappUrl;
    else window.location.href = whatsappUrl;
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
    dialog.setAttribute("aria-label", pcTranslateDesignText(design.name || design.categoryLabel, pcCurrentLanguage(), "name") + (pcCurrentLanguage() === "te" ? " వివరాలు" : pcCurrentLanguage() === "hi" ? " विवरण" : " details"));

    const close = document.createElement("button");
    close.type = "button";
    close.className = "design-details-close";
    close.textContent = "×";
    close.setAttribute("aria-label", pcCurrentLanguage() === "te" ? "డిజైన్ వివరాలను మూసివేయండి" : pcCurrentLanguage() === "hi" ? "डिज़ाइन विवरण बंद करें" : "Close design details");
    const closeDialog = () => {
      overlay.remove();
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("parvathi-language-changed", onLanguageChanged);
    };
    const onKeyDown = event => { if (event.key === "Escape") closeDialog(); };
    const onLanguageChanged = () => { closeDialog(); openDesignDetails(design); };
    document.addEventListener("parvathi-language-changed", onLanguageChanged);
    close.addEventListener("click", closeDialog);

    const media = document.createElement("div");
    media.className = "design-details-media";
    const photo = document.createElement("img");
    photo.className = "design-details-photo";
    photo.src = design.imageUrl;
    photo.alt = pcTranslateDesignText(design.name || design.categoryLabel, pcCurrentLanguage(), "name") + (pcCurrentLanguage() === "te" ? " డిజైన్" : pcCurrentLanguage() === "hi" ? " डिज़ाइन" : " design");
    media.append(photo);
    const galleryImages = Array.isArray(design.galleryImages) ? design.galleryImages : [design.imageUrl];
    if (galleryImages.length > 1) {
      const thumbnails = document.createElement("div");
      thumbnails.className = "design-details-thumbnails";
      galleryImages.slice(0, 6).forEach((url, index) => {
        const thumb = document.createElement("button");
        thumb.type = "button";
        thumb.className = "design-details-thumbnail" + (url === design.imageUrl ? " is-active" : "");
        thumb.setAttribute("aria-label", pcCurrentLanguage() === "te" ? (index === 0 ? "ప్రధాన ఫోటో" : "ఫోటో " + (index + 1)) : pcCurrentLanguage() === "hi" ? (index === 0 ? "मुख्य फ़ोटो" : "फ़ोटो " + (index + 1)) : (index === 0 ? "Cover photo" : "Photo " + (index + 1)));
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
    price.textContent = design.price ? "₹" + design.price : (pcCurrentLanguage() === "te" ? "ధర కోసం సంప్రదించండి" : pcCurrentLanguage() === "hi" ? "कीमत जानने के लिए संपर्क करें" : "Price available on enquiry");
    const descriptionLabel = document.createElement("h3");
    descriptionLabel.textContent = pcCurrentLanguage() === "te" ? "వివరణ" : pcCurrentLanguage() === "hi" ? "विवरण" : "Description";
    const description = document.createElement("p");
    description.className = "design-details-description";
    description.textContent = design.description ? pcTranslateDesignText(design.description, pcCurrentLanguage(), "description") : (pcCurrentLanguage() === "te" ? "ఈ డిజైన్ వివరాల కోసం దయచేసి మమ్మల్ని సంప్రదించండి." : pcCurrentLanguage() === "hi" ? "इस डिज़ाइन की अधिक जानकारी के लिए कृपया संपर्क करें." : "Please contact us for more details about this design.");
    info.append(category, heading, price);
    if (design.code) {
      const code = document.createElement("p");
      code.className = "design-details-code";
      code.textContent = (pcCurrentLanguage() === "te" ? "డిజైన్ కోడ్: " : pcCurrentLanguage() === "hi" ? "डिज़ाइन कोड: " : "Design code: ") + design.code;
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
    const detailsLanguage = pcCurrentLanguage();
    Promise.all([
      pcTranslateDesignTextAsync(design.name || design.categoryLabel, detailsLanguage, "name"),
      pcTranslateDesignTextAsync(design.categoryLabel, detailsLanguage, "category"),
      design.description ? pcTranslateDesignTextAsync(design.description, detailsLanguage, "description") : Promise.resolve(description.textContent)
    ]).then(([translatedName, translatedCategory, translatedDescription]) => {
      if (!overlay.isConnected || pcCurrentLanguage() !== detailsLanguage) return;
      dialog.setAttribute("aria-label", translatedName + (detailsLanguage === "te" ? " వివరాలు" : detailsLanguage === "hi" ? " विवरण" : " details"));
      photo.alt = translatedName + (detailsLanguage === "te" ? " డిజైన్" : detailsLanguage === "hi" ? " डिज़ైన్" : " design");
      heading.textContent = translatedName;
      category.textContent = translatedCategory;
      description.textContent = translatedDescription;
    });
  }

  /* ---------- Rendering ---------- */
  /* Translate uploaded design labels without changing the saved Supabase values. */
  function pcTranslateDesignText(value, language, kind) {
    const original = typeof value === "string" ? value.trim() : "";
    if (!original || language === "en") return original;
    // Exact translations for the designs currently published in the gallery.
    // Normalisation removes invisible zero-width characters and formatting differences from database text.
    const normalisedOriginal = original.replace(/[\u200B-\u200D\uFEFF]/g, "").replace(/\s+/g, " ").trim();
    const publishedDesignTranslations = {
      te: {
        "Long frock":"పొడవాటి ఫ్రాక్",
        "Knee length frock":"మోకాలి పొడవు ఫ్రాక్",
        "White long Dress":"తెల్లని పొడవాటి డ్రెస్",
        "Happy dasara":"దసరా శుభాకాంక్షలు",
        "Lehenga":"లెహంగా",
        "Maggam":"మగ్గం వర్క్",
        "Sweetheart Blouse":"హార్ట్ నెక్ బ్లౌజ్",
        "Cutwork scallop blouse":"కట్‌వర్క్ స్కాలోప్ బ్లౌజ్",
        "Multicolour saree":"బహుళ రంగుల చీర",
        "This silhouette is an Anarkali-style Gown Suit, a traditional South Asian attire known for its flared, floor-length umbrella cut paired with a simple neck line and matching dupatta. Style & Model Breakdown Neckline & Bodice: Features a clean scoop neck (wide U-shaped neckline) paired with a fitted chest region. Sleeve Design: Long, full-length fitted sleeves that create a streamlined aesthetic. Cut & Flare: High-waisted waistline featuring tight gathering that transitions into a wide, floor-length A-line flare (Umbrella cut). Fabric & Details: Crafted with a subtle, all-over tonal floral embroidery pattern, paired with a lightweight sheer dupatta wrapped neatly around the neck.":"ఈ డిజైన్ అనార్కలి శైలి గౌన్ సూట్. దక్షిణాసియా సంప్రదాయ దుస్తులైన ఇందులో, నేలవరకు వచ్చే గొడుగు ఆకారపు ఫ్లేర్‌తో పాటు సరళమైన మెడ డిజైన్ మరియు మ్యాచింగ్ దుపట్టా ఉంటాయి. డిజైన్ వివరాలు: మెడ మరియు పైభాగం: వెడల్పైన U ఆకారపు స్కూప్ నెక్‌తో పాటు శరీరానికి సరిపోయే ఫిట్. చేతుల డిజైన్: చక్కని ఆకృతిని ఇచ్చే పూర్తి పొడవైన ఫిట్ స్లీవ్స్. కట్ మరియు ఫ్లేర్: నడుము వద్ద గ్యాదరింగ్‌తో మొదలై, కిందికి విస్తరించే వెడల్పైన A-లైన్ గొడుగు కట్. వస్త్రం మరియు వివరాలు: మొత్తం మీద సున్నితమైన ఒకే టోన్ పూల ఎంబ్రాయిడరీ, మెడ చుట్టూ చక్కగా చుట్టిన తేలికపాటి పారదర్శక దుపట్టా.",
        "This elegantly stitched knee-length frock is perfect for parties. Its puff sleeves give it a lovely, stylish look.":"పార్టీలకు చక్కగా సరిపోయే అందమైన మోకాలి పొడవు ఫ్రాక్ ఇది. పఫ్ స్లీవ్స్ ఈ ఫ్రాక్‌కు మరింత ఆకర్షణీయమైన రూపాన్ని ఇస్తాయి.",
        "Can be stitched to each customer's measurements and preferences.":"ప్రతి కస్టమర్ అభిరుచి మరియు కొలతలకు అనుగుణంగా కుట్టించవచ్చు.",
        "Seasonal homepage greeting":"పండుగ సందర్భంగా హోమ్‌పేజీలో చూపించే శుభాకాంక్షల సందేశం.",
        "#Stitching only. Lavender Pearl Blouse details: Sleeves: Sheer puff organza with scattered floral embroidery and wide embroidered cuffs. Back: Deep U-cut with a pearl border, dori tie-up with fabric latkans, and a lower button placket.":"కుట్టు మాత్రమే. లావెండర్ పెర్ల్ బ్లౌజ్ వివరాలు: చేతులు: అక్కడక్కడా పూల ఎంబ్రాయిడరీతో పారదర్శక ఆర్గన్జా పఫ్ స్లీవ్స్, వెడల్పైన ఎంబ్రాయిడరీ కఫ్స్. వెనుక భాగం: లోతైన U-కట్, ముత్యాల అంచు, దోరీ టై-అప్‌తో పాటు ఫాబ్రిక్ లట్కన్స్, కింద బటన్ల పట్టీ.",
        "Customized according to measurements Design: Pastel yellow designer blouse with colorful floral embroidery. Neckline: Square neck with a scalloped border in the front, and a deep cut with gold dori and beaded tassels in the back. Finishing: Neat scalloped borders on the neckline, back, and sleeves. Sleeves: Elbow-length sleeves with matching floral threadwork and scalloped hems.":"కొలతలకు అనుగుణంగా కస్టమైజ్ చేయవచ్చు. డిజైన్: రంగురంగుల పూల ఎంబ్రాయిడరీతో పాస్టెల్ పసుపు రంగు డిజైనర్ బ్లౌజ్. మెడ డిజైన్: ముందు భాగంలో స్కాలోప్ అంచుతో చతురస్రాకార మెడ; వెనుక భాగంలో లోతైన కట్‌తో బంగారు దోరీ మరియు పూసల టాసెల్స్. ఫినిషింగ్: మెడ, వెనుక భాగం మరియు చేతుల వద్ద చక్కని స్కాలోప్ అంచులు. చేతులు: మ్యాచింగ్ పూల దారపు పనితో మోచేతి వరకు ఉండే స్లీవ్స్, స్కాలోప్ అంచులతో.",
        "Saree with a dual-silk border and a rich, heavy look.":"డ్యూయల్ సిల్క్ బోర్డర్‌తో, హెవీ లుక్ కలిగిన చీర."
      },
      hi: {
        "Long frock":"लंबी फ्रॉक",
        "Knee length frock":"घुटने तक की फ्रॉक",
        "White long Dress":"सफेद लंबी ड्रेस",
        "Happy dasara":"दशहरा की शुभकामनाएँ",
        "Lehenga":"लहंगा",
        "Maggam":"मग्गम वर्क",
        "Sweetheart Blouse":"हार्ट-नेक ब्लाउज़",
        "Cutwork scallop blouse":"कटवर्क स्कैलप ब्लाउज़",
        "Multicolour saree":"बहुरंगी साड़ी",
        "This silhouette is an Anarkali-style Gown Suit, a traditional South Asian attire known for its flared, floor-length umbrella cut paired with a simple neck line and matching dupatta. Style & Model Breakdown Neckline & Bodice: Features a clean scoop neck (wide U-shaped neckline) paired with a fitted chest region. Sleeve Design: Long, full-length fitted sleeves that create a streamlined aesthetic. Cut & Flare: High-waisted waistline featuring tight gathering that transitions into a wide, floor-length A-line flare (Umbrella cut). Fabric & Details: Crafted with a subtle, all-over tonal floral embroidery pattern, paired with a lightweight sheer dupatta wrapped neatly around the neck.":"यह अनारकली शैली का गाउन सूट है। इस पारंपरिक दक्षिण एशियाई परिधान में फर्श तक फैला छतरी जैसा घेर, साधारण नेकलाइन और मैचिंग दुपट्टा है। डिज़ाइन का विवरण: गला और ऊपरी हिस्सा: चौड़ी U-आकार की स्कूप नेकलाइन और शरीर के अनुरूप फिटिंग। आस्तीन: साफ़-सुथरा लुक देने वाली पूरी लंबाई की फिटेड आस्तीन। कट और घेर: कमर पर बारीक चुन्नटों से शुरू होकर नीचे तक फैलता हुआ A-लाइन छतरी कट। कपड़ा और बारीकियाँ: पूरे कपड़े पर हल्की टोनल फूलों की कढ़ाई और गले के चारों ओर करीने से लपेटा गया हल्का पारदर्शी दुपट्टा।",
        "This elegantly stitched knee-length frock is perfect for parties. Its puff sleeves give it a lovely, stylish look.":"यह सुंदर घुटने तक की फ्रॉक पार्टियों के लिए बहुत अच्छी है। इसकी पफ आस्तीन इसे आकर्षक लुक देती हैं।",
        "Can be stitched to each customer's measurements and preferences.":"हर ग्राहक की पसंद और नाप के अनुसार सिलाई की जा सकती है।",
        "Seasonal homepage greeting":"त्योहार के अवसर पर होमपेज पर दिखाया जाने वाला शुभकामना संदेश।",
        "#Stitching only. Lavender Pearl Blouse details: Sleeves: Sheer puff organza with scattered floral embroidery and wide embroidered cuffs. Back: Deep U-cut with a pearl border, dori tie-up with fabric latkans, and a lower button placket.":"केवल सिलाई। लैवेंडर पर्ल ब्लाउज़ का विवरण: आस्तीन: जगह-जगह फूलों की कढ़ाई वाला पारदर्शी ऑर्गेंज़ा पफ स्टाइल और चौड़े कढ़ाईदार कफ। पीछे: गहरी U-कट नेकलाइन, मोतियों की बॉर्डर, डोरी टाई-अप के साथ कपड़े की लटकन और नीचे बटनों की पट्टी।",
        "Customized according to measurements Design: Pastel yellow designer blouse with colorful floral embroidery. Neckline: Square neck with a scalloped border in the front, and a deep cut with gold dori and beaded tassels in the back. Finishing: Neat scalloped borders on the neckline, back, and sleeves. Sleeves: Elbow-length sleeves with matching floral threadwork and scalloped hems.":"नाप के अनुसार कस्टमाइज़ किया जा सकता है। डिज़ाइन: रंगीन फूलों की कढ़ाई वाला हल्का पेस्टल पीला डिज़ाइनर ब्लाउज़। गला: सामने स्कैलप बॉर्डर वाला चौकोर गला और पीछे गहरी कट डिज़ाइन के साथ सुनहरी डोरी व मोतियों की लटकन। फिनिशिंग: गले, पीछे और आस्तीन पर साफ़ स्कैलप बॉर्डर। आस्तीन: मैचिंग फूलों की धागे वाली कढ़ाई और स्कैलप किनारों के साथ कोहनी तक की आस्तीन।",
        "Saree with a dual-silk border and a rich, heavy look.":"डुअल सिल्क बॉर्डर वाली साड़ी, हैवी लुक के साथ।"
      }
    };
    if (publishedDesignTranslations[language] && publishedDesignTranslations[language][normalisedOriginal]) return publishedDesignTranslations[language][normalisedOriginal];
    const phraseMaps = {
      te: {
        "Computer Embroidery":"కంప్యూటర్ ఎంబ్రాయిడరీ", "Computer Work":"కంప్యూటర్ వర్క్", "Computerized Embroidery":"కంప్యూటర్ ఎంబ్రాయిడరీ", "Designer Lehengas":"డిజైనర్ లెహంగాలు", "Designer Wear":"డిజైనర్ దుస్తులు", "Designer Blouses":"డిజైనర్ బ్లౌజులు", "Designer Blouse":"డిజైనర్ బ్లౌజ్", "Blouse Designs":"బ్లౌజ్ డిజైన్లు", "Blouse Design":"బ్లౌజ్ డిజైన్", "Wedding Dresses":"పెళ్లి దుస్తులు", "Wedding Wear":"పెళ్లి దుస్తులు", "Bridal Wear":"వధువు దుస్తులు", "Kids Wear":"పిల్లల దుస్తులు", "Sarees & Tassels":"చీరలు మరియు టాసెల్స్", "Saree Tassels":"చీర టాసెల్స్", "Custom Designs":"కస్టమ్ డిజైన్లు", "Custom Design":"కస్టమ్ డిజైన్", "Maggam Work":"మగ్గం వర్క్", "Sarees & Tassels":"చీరలు మరియు టాసెల్స్", "Other Designs":"ఇతర డిజైన్లు", "Festival Banner":"పండుగ బ్యానర్", "Frocks":"ఫ్రాక్స్", "Frock":"ఫ్రాక్", "Lehengas":"లెహంగాలు", "Lehenga":"లెహంగా", "Sarees":"చీరలు", "Saree":"చీర", "Tassels":"టాసెల్స్", "Embroidery":"ఎంబ్రాయిడరీ", "Tailoring":"దుస్తుల కుట్టు", "Traditional":"సంప్రదాయ", "Handwork":"చేతిపని", "Hand Work":"చేతిపని", "Silk":"పట్టు", "Cotton":"కాటన్", "Party Wear":"పార్టీ వేర్", "Bridal":"పెళ్లి", "Beautiful":"అందమైన", "New Design":"కొత్త డిజైన్", "Description":"వివరణ", "Price available on enquiry":"ధర కోసం సంప్రదించండి", "Please contact us for more details about this design.":"ఈ డిజైన్ వివరాల కోసం దయచేసి మమ్మల్ని సంప్రదించండి."
      },
      hi: {
        "Computer Embroidery":"कंप्यूटर कढ़ाई", "Computer Work":"कंप्यूटर वर्क", "Computerized Embroidery":"कंप्यूटर कढ़ाई", "Designer Lehengas":"डिज़ाइनर लहंगे", "Designer Wear":"डिज़ाइनर कपड़े", "Designer Blouses":"डिज़ाइनर ब्लाउज़", "Designer Blouse":"डिज़ाइनर ब्लाउज़", "Blouse Designs":"ब्लाउज़ डिज़ाइन", "Blouse Design":"ब्लाउज़ डिज़ाइन", "Wedding Dresses":"शादी के कपड़े", "Wedding Wear":"शादी के कपड़े", "Bridal Wear":"दुल्हन के कपड़े", "Kids Wear":"बच्चों के कपड़े", "Sarees & Tassels":"साड़ी और लटकन", "Saree Tassels":"साड़ी टैसल", "Custom Designs":"कस्टम डिज़ाइन", "Custom Design":"कस्टम डिज़ाइन", "Maggam Work":"मग्गम वर्क", "Sarees & Tassels":"साड़ी और लटकन", "Other Designs":"अन्य डिज़ाइन", "Festival Banner":"त्योहार का बैनर", "Frocks":"फ्रॉक", "Frock":"फ्रॉक", "Lehengas":"लहंगे", "Lehenga":"लहंगा", "Sarees":"साड़ियाँ", "Saree":"साड़ी", "Tassels":"लटकन", "Embroidery":"कढ़ाई", "Tailoring":"सिलाई", "Traditional":"पारंपरिक", "Handwork":"हाथ का काम", "Hand Work":"हाथ का काम", "Silk":"रेशम", "Cotton":"सूती", "Party Wear":"पार्टी वियर", "Bridal":"दुल्हन", "Beautiful":"सुंदर", "New Design":"नया डिज़ाइन", "Description":"विवरण", "Price available on enquiry":"कीमत जानने के लिए संपर्क करें", "Please contact us for more details about this design.":"इस डिज़ाइन की अधिक जानकारी के लिए कृपया संपर्क करें."
      }
    };
    Object.assign(phraseMaps.te, {
      "Other":"ఇతర డిజైన్లు", "Festival Greeting":"పండుగ శుభాకాంక్షలు", "Featured Saree Design":"ప్రత్యేక చీర డిజైన్", "Every stitch tells a story":"ప్రతి కుట్టులో ఒక కథ ఉంటుంది", "Made with care":"శ్రద్ధతో తయారు చేసినది", "Made with care. Finished with love.":"శ్రద్ధతో తయారు చేసి, ప్రేమతో పూర్తి చేసినది", "Thoughtfully Made, Beautifully Yours":"మీ కోసం శ్రద్ధగా రూపొందించిన అందమైన డిజైన్లు", "Custom stitching & occasionwear":"కస్టమ్ కుట్టు మరియు ప్రత్యేక సందర్భాల దుస్తులు", "Price available on enquiry":"ధర కోసం సంప్రదించండి", "Please share details":"దయచేసి వివరాలు పంపండి", "Parvathi Creations":"పార్వతి క్రియేషన్స్", "custom blouse":"కస్టమ్ బ్లౌజ్", "blouse stitching":"బ్లౌజ్ కుట్టు", "hand embroidery":"చేతి ఎంబ్రాయిడరీ", "maggam work":"మగ్గం వర్క్", "computer embroidery":"కంప్యూటర్ ఎంబ్రాయిడరీ", "bridal wear":"పెళ్లి దుస్తులు", "wedding wear":"పెళ్లి దుస్తులు", "kids wear":"పిల్లల దుస్తులు", "designer blouse":"డిజైనర్ బ్లౌజ్", "designer wear":"డిజైనర్ దుస్తులు", "saree tassels":"చీర టాసెల్స్", "new collection":"కొత్త కలెక్షన్", "available on request":"అడిగినప్పుడు అందుబాటులో ఉంటుంది", "made to order":"ఆర్డర్‌పై తయారు చేస్తాం", "customised design":"మీ అభిరుచికి అనుగుణంగా రూపొందించిన డిజైన్", "customized design":"మీ అభిరుచికి అనుగుణంగా రూపొందించిన డిజైన్", "beautiful design":"అందమైన డిజైన్", "latest design":"తాజా డిజైన్", "traditional design":"సంప్రదాయ డిజైన్", "neck design":"మెడ డిజైన్", "sleeve design":"చేతి డిజైన్", "back design":"వెనుక భాగం డిజైన్", "front design":"ముందు భాగం డిజైన్", "work blouse":"వర్క్ బ్లౌజ్", "silk saree":"పట్టు చీర", "cotton saree":"కాటన్ చీర", "please contact us":"దయచేసి మమ్మల్ని సంప్రదించండి", "for more details":"మరిన్ని వివరాల కోసం", "price":"ధర", "description":"వివరణ", "design":"డిజైన్", "blouse":"బ్లౌజ్", "saree":"చీర", "frock":"ఫ్రాక్", "lehenga":"లెహంగా", "sleeves":"చేతులు", "neck":"మెడ", "front":"ముందు", "back":"వెనుక", "work":"పని", "handmade":"చేతితో తయారు చేసిన"
    });
    Object.assign(phraseMaps.hi, {
      "Other":"अन्य डिज़ाइन", "Festival Greeting":"त्योहार की शुभकामनाएँ", "Featured Saree Design":"खास साड़ी डिज़ाइन", "Every stitch tells a story":"हर सिलाई एक कहानी कहती है", "Made with care":"सावधानी से बनाया गया", "Made with care. Finished with love.":"सावधानी से बनाया, प्यार से पूरा किया", "Thoughtfully Made, Beautifully Yours":"आपके लिए प्यार से तैयार सुंदर डिज़ाइन", "Custom stitching & occasionwear":"कस्टम सिलाई और खास अवसरों के परिधान", "Price available on enquiry":"कीमत जानने के लिए संपर्क करें", "Please share details":"कृपया जानकारी साझा करें", "Parvathi Creations":"पार्वती क्रिएशन्स", "custom blouse":"कस्टम ब्लाउज़", "blouse stitching":"ब्लाउज़ सिलाई", "hand embroidery":"हाथ की कढ़ाई", "maggam work":"मग्गम वर्क", "computer embroidery":"कंप्यूटर कढ़ाई", "bridal wear":"दुल्हन के कपड़े", "wedding wear":"शादी के कपड़े", "kids wear":"बच्चों के कपड़े", "designer blouse":"डिज़ाइनर ब्लाउज़", "designer wear":"डिज़ाइनर परिधान", "saree tassels":"साड़ी की लटकन", "new collection":"नया कलेक्शन", "available on request":"अनुरोध पर उपलब्ध", "made to order":"ऑर्डर मिलने पर तैयार किया जाएगा", "customised design":"आपकी पसंद के अनुसार तैयार डिज़ाइन", "customized design":"आपकी पसंद के अनुसार तैयार डिज़ाइन", "beautiful design":"सुंदर डिज़ाइन", "latest design":"नया डिज़ाइन", "traditional design":"पारंपरिक डिज़ाइन", "neck design":"गले का डिज़ाइन", "sleeve design":"आस्तीन का डिज़ाइन", "back design":"पीछे का डिज़ाइन", "front design":"सामने का डिज़ाइन", "work blouse":"वर्क ब्लाउज़", "silk saree":"रेशमी साड़ी", "cotton saree":"सूती साड़ी", "please contact us":"कृपया हमसे संपर्क करें", "for more details":"अधिक जानकारी के लिए", "price":"कीमत", "description":"विवरण", "design":"डिज़ाइन", "blouse":"ब्लाउज़", "saree":"साड़ी", "frock":"फ्रॉक", "lehenga":"लहंगा", "sleeves":"आस्तीन", "neck":"गला", "front":"सामने", "back":"पीछे", "work":"काम", "handmade":"हाथ से बनाया गया"
    });
    let result = original;
    const map = phraseMaps[language] || {};
    Object.keys(map).sort((a,b) => b.length-a.length).forEach(key => {
      result = result.replace(new RegExp("\\b" + key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "gi"), map[key]);
    });
    return result;
  }
  function pcCurrentLanguage() {
    try { return localStorage.getItem("parvathiLanguage") || document.documentElement.lang || "en"; }
    catch (_) { return document.documentElement.lang || "en"; }
  }

  function pcUiText(key) {
    const labels = {
      en: {like:"♡ I Like This Design", liked:"♥ Liked", enquire:"Enquire on WhatsApp", message:"Hello Parvathi Creations! I would like to enquire about this design: ", code:"Design code: ", price:"Price: ₹", description:"Description: ", details:"Please share details."},
      te: {like:"♡ ఈ డిజైన్ నాకు నచ్చింది", liked:"♥ నచ్చింది", enquire:"వాట్సాప్‌లో వివరాలు అడగండి", message:"నమస్కారం పార్వతి క్రియేషన్స్! ఈ డిజైన్ గురించి వివరాలు కావాలి: ", code:"డిజైన్ కోడ్: ", price:"ధర: ₹", description:"వివరణ: ", details:"దయచేసి మరిన్ని వివరాలు పంపండి."},
      hi: {like:"♡ मुझे यह डिज़ाइन पसंद है", liked:"♥ पसंद आया", enquire:"WhatsApp पर पूछताछ करें", message:"नमस्ते पार्वती क्रिएशन्स! मुझे इस डिज़ाइन के बारे में जानकारी चाहिए: ", code:"डिज़ाइन कोड: ", price:"कीमत: ₹", description:"विवरण: ", details:"कृपया और जानकारी साझा करें।"}
    };
    return (labels[pcCurrentLanguage()] || labels.en)[key] || labels.en[key] || "";
  }

  /* Automatic translation for new and edited gallery content. Results are cached per
     language and source text, so future admin uploads need no manual translation. */
  const PC_TRANSLATION_CACHE_KEY = "pcAutoTranslationCacheV1";
  const pcTranslationPending = new Map();
  function pcReadTranslationCache() {
    try { const value = JSON.parse(localStorage.getItem(PC_TRANSLATION_CACHE_KEY) || "{}"); return value && typeof value === "object" ? value : {}; }
    catch (_) { return {}; }
  }
  async function pcTranslateDesignTextAsync(value, language, kind) {
    const original = typeof value === "string" ? value.trim() : "";
    if (!original || language === "en") return original;
    const known = pcTranslateDesignText(original, language, kind);
    if (known && known !== original) return known;
    const cache = pcReadTranslationCache();
    const key = language + "|" + original;
    if (cache[key]) return cache[key];
    if (pcTranslationPending.has(key)) return pcTranslationPending.get(key);
    const task = (async () => {
      try {
        const endpoint = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=" + encodeURIComponent(language) + "&dt=t&q=" + encodeURIComponent(original);
        const controller = new AbortController();
        const timer = window.setTimeout(() => controller.abort(), 15000);
        let response;
        try { response = await fetch(endpoint, { method: "GET", mode: "cors", signal: controller.signal, cache: "no-store" }); }
        finally { window.clearTimeout(timer); }
        if (!response.ok) throw new Error("Translation service returned " + response.status);
        const payload = await response.json();
        const translated = Array.isArray(payload) && Array.isArray(payload[0])
          ? payload[0].map(part => Array.isArray(part) ? part[0] : "").join("").trim() : "";
        if (!translated) throw new Error("Translation service returned empty text");
        cache[key] = translated;
        const keys = Object.keys(cache);
        if (keys.length > 350) keys.slice(0, keys.length - 350).forEach(oldKey => delete cache[oldKey]);
        try { localStorage.setItem(PC_TRANSLATION_CACHE_KEY, JSON.stringify(cache)); } catch (_) {}
        return translated;
      } catch (error) {
        if (window.__PC_TRANSLATION_DEBUG__) console.warn("Automatic gallery translation failed; showing saved text instead.", error);
        return known || original;
      } finally { pcTranslationPending.delete(key); }
    })();
    pcTranslationPending.set(key, task);
    return task;
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
    imageButton.setAttribute("aria-label", (pcCurrentLanguage() === "te" ? "డిజైన్ వివరాలు చూడండి: " : pcCurrentLanguage() === "hi" ? "डिज़ाइन विवरण देखें: " : "View details for ") + pcTranslateDesignText(design.name || design.categoryLabel, pcCurrentLanguage(), "name"));
    imageButton.addEventListener("click", () => {
      rememberRecentDesign(design.id);
      trackInterest("view", design);
      openDesignDetails(design);
    });
    const img = document.createElement("img");
    img.src = design.imageUrl;
    img.alt = pcTranslateDesignText(design.name || design.categoryLabel, pcCurrentLanguage(), "name") + (pcCurrentLanguage() === "te" ? " డిజైన్" : pcCurrentLanguage() === "hi" ? " डिज़ाइन" : " design");
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
    const cardLanguage = pcCurrentLanguage();
    Promise.all([
      pcTranslateDesignTextAsync(design.name || design.categoryLabel, cardLanguage, "name"),
      pcTranslateDesignTextAsync(design.categoryLabel, cardLanguage, "category")
    ]).then(([translatedName, translatedCategory]) => {
      if (!card.isConnected || pcCurrentLanguage() !== cardLanguage) return;
      heading.textContent = translatedName;
      sub.textContent = translatedCategory;
      img.alt = translatedName + (cardLanguage === "te" ? " డిజైన్" : cardLanguage === "hi" ? " डिज़ाइन" : " design");
      imageButton.setAttribute("aria-label", (cardLanguage === "te" ? "డిజైన్ వివరాలు చూడండి: " : cardLanguage === "hi" ? "डिज़ाइन विवरण देखें: " : "View details for ") + translatedName);
    });

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
      const labels = {en:{saved:"♡ Saved designs",recent:"◷ Recently viewed",savedOn:"♥ Showing saved designs",recentOn:"◷ Showing recently viewed"},te:{saved:"♡ సేవ్ చేసిన డిజైన్లు",recent:"◷ ఇటీవల చూసినవి",savedOn:"♥ సేవ్ చేసిన డిజైన్లు",recentOn:"◷ ఇటీవల చూసినవి"},hi:{saved:"♡ सेव किए डिज़ाइन",recent:"◷ हाल ही में देखे",savedOn:"♥ सेव किए डिज़ाइन",recentOn:"◷ हाल ही में देखे"}};
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
      setStatus("error", TEXT.errorTitle, TEXT.errorHelp + (pcCurrentLanguage() === "te" ? " ఆన్‌లైన్ గ్యాలరీ మళ్లీ కనెక్ట్ అయ్యే వరకు నమూనా ఫోటో చూపిస్తున్నాం." : pcCurrentLanguage() === "hi" ? " ऑनलाइन गैलरी दोबारा जुड़ने तक एक नमूना फ़ोटो दिखाई जा रही है।" : " Showing a local sample photo until the online gallery reconnects."), TEXT.retry, loadDesigns);
    } else {
      setStatus(null);
    }
    const list = visibleDesigns();
    el.count.textContent = TEXT.showing(list.length, state.designs.length);
    if (!list.length && state.view === "saved") {
      const lang = pcCurrentLanguage();
      setStatus("empty", lang === "te" ? "ఇంకా సేవ్ చేసిన డిజైన్లు లేవు." : lang === "hi" ? "अभी कोई डिज़ाइन सेव नहीं है।" : "No saved designs yet.",
        lang === "te" ? "మీకు నచ్చిన డిజైన్‌లోని హృదయ గుర్తును నొక్కితే ఇక్కడ కనిపిస్తుంది." : lang === "hi" ? "किसी डिज़ाइन पर दिल के निशान को दबाएँ, वह यहाँ दिखाई देगा।" : "Tap the heart on any design to save it here.",
        lang === "te" ? "అన్ని డిజైన్లు చూడండి" : lang === "hi" ? "सभी डिज़ाइन देखें" : "Browse all designs", () => { state.view = "all"; render(); });
      return;
    }
    if (!list.length && state.view === "recent") {
      const lang = pcCurrentLanguage();
      setStatus("empty", lang === "te" ? "ఇటీవల చూసిన డిజైన్లు ఇంకా లేవు." : lang === "hi" ? "अभी हाल ही में देखे गए डिज़ाइन नहीं हैं।" : "No recently viewed designs yet.",
        lang === "te" ? "ఏదైనా డిజైన్‌ను తెరిస్తే అది ఇక్కడ కనిపిస్తుంది." : lang === "hi" ? "किसी डिज़ाइन को खोलें, वह यहाँ दिखाई देगा।" : "Open a design to see it listed here.",
        lang === "te" ? "అన్ని డిజైన్లు చూడండి" : lang === "hi" ? "सभी डिज़ाइन देखें" : "Browse all designs", () => { state.view = "all"; render(); });
      return;
    }
    if (!list.length) { setStatus("empty", TEXT.noMatchTitle, TEXT.noMatchHelp, TEXT.clearFilters, clearFilters); return; }
    setStatus(null);
    const frag = document.createDocumentFragment();
    list.forEach(d => frag.append(buildCard(d)));
    el.grid.append(frag);
  }


  document.addEventListener("parvathi-language-changed", function () {
    const heroKicker = document.querySelector(".hero-slide-kicker");
    if (heroKicker) {
      const isFestival = /FESTIVAL GREETINGS|పండుగ శుభాకాంక్షలు|त्योहार की शुभकामनाएँ/.test(heroKicker.textContent);
      heroKicker.textContent = isFestival
        ? (pcCurrentLanguage() === "te" ? "పండుగ శుభాకాంక్షలు" : pcCurrentLanguage() === "hi" ? "त्योहार की शुभकामनाएँ" : "FESTIVAL GREETINGS")
        : (pcCurrentLanguage() === "te" ? "శ్రద్ధతో రూపొందించాం" : pcCurrentLanguage() === "hi" ? "सावधानी से बनाया गया" : "MADE WITH CARE");
    }
    applyGalleryLanguage(document.documentElement.lang || "en");
    const lang = pcCurrentLanguage();
    if (el.saved && el.recent) {
      const labels = {
        en: {saved:"♡ Saved designs", recent:"◷ Recently viewed", savedOn:"♥ Showing saved designs", recentOn:"◷ Showing recently viewed"},
        te: {saved:"♡ సేవ్ చేసిన డిజైన్లు", recent:"◷ ఇటీవల చూసినవి", savedOn:"♥ సేవ్ చేసిన డిజైన్లు", recentOn:"◷ ఇటీవల చూసినవి"},
        hi: {saved:"♡ सेव किए डिज़ाइन", recent:"◷ हाल ही में देखे", savedOn:"♥ सेव किए डिज़ाइन", recentOn:"◷ हाल ही में देखे"}
      };
      const t = labels[lang] || labels.en;
      el.saved.textContent = state.view === "saved" ? t.savedOn : t.saved;
      el.recent.textContent = state.view === "recent" ? t.recentOn : t.recent;
    }
    if (state.status !== "loading" && el.grid) render();
    if (heroSlides.length) initHeroSlider(heroSlides);
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
    heroSlides = Array.isArray(designs) ? designs : [];
    const availableSlides = heroSlides.filter(d => d && !d.hidden && /^https?:\/\//i.test(d.imageUrl || ""));
    /* Prefer designs marked Featured in Admin, but fall back to all visible uploaded designs so the hero never disappears just because none are featured. */
    const featuredSlides = availableSlides.filter(d => d.featured);
    const slides = featuredSlides.length ? featuredSlides : availableSlides;
    if (!slides.length) {
      /* Keep the hero visible during an empty gallery or temporary Supabase outage. */
      root.hidden = false;
      root.classList.add("is-single");
      image.src = "sareejpg.jpg";
      image.alt = "Parvathi Creations boutique design";
      const fallbackLanguage = pcCurrentLanguage();
      if (name) name.textContent = fallbackLanguage === "te" ? "మీ కోసం శ్రద్ధగా రూపొందించిన డిజైన్లు" : fallbackLanguage === "hi" ? "आपके लिए प्यार से तैयार डिज़ाइन" : "Thoughtfully Made, Beautifully Yours";
      if (category) category.textContent = fallbackLanguage === "te" ? "కస్టమ్ కుట్టు మరియు ప్రత్యేక దుస్తులు" : fallbackLanguage === "hi" ? "कस्टम सिलाई और खास परिधान" : "Custom stitching & occasionwear";
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
      dot.setAttribute("aria-label", (pcCurrentLanguage() === "te" ? "డిజైన్ చూడండి " : pcCurrentLanguage() === "hi" ? "डिज़ाइन देखें " : "Show design ") + (index + 1) + ": " + pcTranslateDesignText(design.name || design.categoryLabel || "Boutique design", pcCurrentLanguage(), "name"));
      dot.addEventListener("click", () => { heroSlideIndex = index; showSlide(); restartTimer(); });
      dots.append(dot);
    });
    function showSlide() {
      const design = slides[heroSlideIndex];
      const kicker = root.querySelector(".hero-slide-kicker");
      const activeLanguage = pcCurrentLanguage();
      if (kicker) kicker.textContent = design.isFestivalBanner
        ? (activeLanguage === "te" ? "పండుగ శుభాకాంక్షలు" : activeLanguage === "hi" ? "त्योहार की शुभकामनाएँ" : "FESTIVAL GREETINGS")
        : (activeLanguage === "te" ? "శ్రద్ధతో రూపొందించాం" : activeLanguage === "hi" ? "सावधानी से बनाया गया" : "MADE WITH CARE");
      image.src = design.imageUrl;
      image.alt = [pcTranslateDesignText(design.name, activeLanguage, "name"), pcTranslateDesignText(design.categoryLabel, activeLanguage, "category"), activeLanguage === "te" ? "పార్వతి క్రియేషన్స్ డిజైన్" : activeLanguage === "hi" ? "पार्वती क्रिएशन्स डिज़ाइन" : "Parvathi Creations design"].filter(Boolean).join(" — ");
      name.textContent = pcTranslateDesignText(design.name || design.categoryLabel || "A design made with care", activeLanguage, "name");
      category.textContent = pcTranslateDesignText(design.categoryLabel || "Parvathi Creations", activeLanguage, "category");
      const slideIndexAtRequest = heroSlideIndex;
      Promise.all([
        pcTranslateDesignTextAsync(design.name || design.categoryLabel || "A design made with care", activeLanguage, "name"),
        pcTranslateDesignTextAsync(design.categoryLabel || "Parvathi Creations", activeLanguage, "category")
      ]).then(([translatedName, translatedCategory]) => {
        if (pcCurrentLanguage() !== activeLanguage || heroSlideIndex !== slideIndexAtRequest || !root.isConnected) return;
        name.textContent = translatedName;
        category.textContent = translatedCategory;
        image.alt = [translatedName, translatedCategory, activeLanguage === "te" ? "పార్వతి క్రియేషన్స్ డిజైన్" : activeLanguage === "hi" ? "पार्वती क्रिएशन्स डिज़ाइन" : "Parvathi Creations design"].filter(Boolean).join(" — ");
      });
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
  en: { home:"Home", collection:"Collection", craft:"Our Craft", services:"Services", contact:"Contact", enquire:"Enquire", language:"🌐 Language", all:"All Designs", maggam:"Maggam Work", computer:"Computer Embroidery", blouse:"Blouse Designs", designerBlouses:"Designer Blouses", custom:"Custom Designs", designer:"Designer Wear", frocks:"Frocks", lehenga:"Designer Lehengas", bridal:"Wedding Wear", kids:"Kids Wear", saree:"Saree Tassels", search:"Search designs", sortNewest:"Newest first", sortOldest:"Oldest first", sortName:"Name A–Z", featured:"★ Featured only", sectionCollection:"01 — THE COLLECTION", sectionServices:"02 — OUR SERVICES", heroEyebrow:"PARVATHI CREATIONS · TELANGANA", heroTitle:"Tradition, tailored to you.", heroDescription:"Thoughtful stitching, intricate embroidery and occasionwear made with care — for the moments you want to remember.", explore:"Explore the collection", heroNote:"Made with care. Finished with love.", collectionEyebrow:"A LITTLE SOMETHING FOR EVERY OCCASION", collectionTitle:"Find your favourite.", collectionDescription:"From everyday elegance to wedding-day details, explore pieces inspired by your style.", photoDisclaimer:"Each custom order is discussed with you before stitching.", craftEyebrow:"THE BEAUTY IS IN THE DETAILS", craftTitle:"Made by hand. Made for you.", craftDescription:"From delicate threadwork to carefully finished blouses, we bring your ideas to life with patience, skill and a personal touch.", craftCta:"Let's create something together", servicesEyebrow:"WHAT WE DO", servicesTitle:"Every detail, considered.", servicesDescription:"Tell us what you have in mind. We'll help you find the right finish, fit and details for your occasion.", contactEyebrow:"YOUR IDEA, OUR CRAFT", contactTitle:"Have something in mind?", contactDescription:"Share your inspiration with us. Let's talk about your design.", whatsapp:"Chat with us on WhatsApp", footerStory:"Where every stitch tells a story.", instagram:"Instagram", youtube:"YouTube", owner:"Owner login", visitBoutique:"Visit our boutique", welcomeTitle:"Choose your language", welcomeNote:"You can change your language anytime from the top of the page.", footerCollection:"Collection", footerServices:"Services", footerContact:"Contact", service1:"Maggam work & hand embroidery", service2:"Computer embroidery", service3:"Blouse stitching & custom designs", service4:"Bridal wear, lehengas & occasionwear", service5:"Frocks, kids wear & salwar stitching", service6:"Saree tassels & finishing" },
  te: { home:"హోమ్", collection:"కలెక్షన్", craft:"మా కళ", services:"సేవలు", contact:"సంప్రదించండి", enquire:"విచారించండి", language:"🌐 భాష", all:"అన్ని డిజైన్లు", maggam:"మగ్గం వర్క్", computer:"కంప్యూటర్ ఎంబ్రాయిడరీ", blouse:"బ్లౌజ్ డిజైన్లు", designerBlouses:"డిజైనర్ బ్లౌజులు", custom:"కస్టమ్ డిజైన్లు", designer:"డిజైనర్ దుస్తులు", frocks:"ఫ్రాక్స్", lehenga:"డిజైనర్ లెహంగాలు", bridal:"పెళ్లి దుస్తులు", kids:"పిల్లల దుస్తులు", saree:"చీర టాసెల్స్", search:"డిజైన్లను వెతకండి", sortNewest:"కొత్తవి ముందు", sortOldest:"పాతవి ముందు", sortName:"పేరు ప్రకారం", featured:"★ ప్రత్యేక డిజైన్లు మాత్రమే", sectionCollection:"01 — కలెక్షన్", sectionServices:"02 — మా సేవలు", heroEyebrow:"పార్వతి క్రియేషన్స్ · తెలంగాణ", heroTitle:"మీ అభిరుచికి తగ్గ సంప్రదాయ శైలి.", heroDescription:"మీకు గుర్తుండిపోయే సందర్భాల కోసం శ్రద్ధగా కుట్టిన దుస్తులు, అందమైన ఎంబ్రాయిడరీ, ప్రత్యేక వేడుకల దుస్తులు.", explore:"కలెక్షన్ చూడండి", heroNote:"శ్రద్ధతో తయారు చేసి, ప్రేమతో పూర్తి చేస్తాం.", collectionEyebrow:"ప్రతి సందర్భానికీ ప్రత్యేకంగా", collectionTitle:"మీకు నచ్చిన డిజైన్‌ను ఎంచుకోండి.", collectionDescription:"రోజువారీ అందం నుంచి పెళ్లి వేడుకల దుస్తుల వరకు, మీ శైలికి సరిపోయే డిజైన్లను చూడండి.", photoDisclaimer:"కుట్టు ప్రారంభించే ముందు ప్రతి కస్టమ్ ఆర్డర్ గురించి మీతో చర్చిస్తాం.", craftEyebrow:"వివరాల్లోనే అందం", craftTitle:"చేతితో తయారు చేసినవి. మీకోసమే.", craftDescription:"సున్నితమైన దారపు పనుల నుంచి చక్కగా పూర్తి చేసిన బ్లౌజ్‌ల వరకు, మీ ఆలోచనలకు రూపం ఇస్తాం.", craftCta:"మనిద్దరం కలిసి అందమైన డిజైన్ చేద్దాం", servicesEyebrow:"మా సేవలు", servicesTitle:"ప్రతి వివరానికీ ప్రత్యేక శ్రద్ధ.", servicesDescription:"మీకు కావలసిన డిజైన్‌ను చెప్పండి. సరైన ఫిట్, ఫినిషింగ్, వివరాలను ఎంచుకోవడంలో సహాయం చేస్తాం.", contactEyebrow:"మీ ఆలోచన — మా కళ", contactTitle:"మీ మనసులో ఏదైనా డిజైన్ ఉందా?", contactDescription:"మీకు నచ్చిన నమూనాను మాతో పంచుకోండి. మీ డిజైన్ గురించి మాట్లాడుకుందాం.", whatsapp:"వాట్సాప్‌లో మాట్లాడండి", footerStory:"ప్రతి కుట్టులో ఒక కథ ఉంటుంది.", instagram:"ఇన్‌స్టాగ్రామ్", youtube:"యూట్యూబ్", owner:"యజమాని లాగిన్", visitBoutique:"మా బుటిక్‌ను సందర్శించండి", welcomeTitle:"మీ భాషను ఎంచుకోండి", welcomeNote:"పేజీ పైభాగంలో ఎప్పుడైనా భాషను మార్చుకోవచ్చు.", footerCollection:"కలెక్షన్", footerServices:"సేవలు", footerContact:"సంప్రదించండి", service1:"మగ్గం వర్క్ మరియు చేతి ఎంబ్రాయిడరీ", service2:"కంప్యూటర్ ఎంబ్రాయిడరీ", service3:"బ్లౌజ్ కుట్టు మరియు కస్టమ్ డిజైన్లు", service4:"పెళ్లి దుస్తులు, లెహంగాలు మరియు ప్రత్యేక దుస్తులు", service5:"ఫ్రాక్స్, పిల్లల దుస్తులు మరియు సల్వార్ కుట్టు", service6:"చీర టాసెల్స్ మరియు ఫినిషింగ్" },
  hi: { home:"होम", collection:"कलेक्शन", craft:"हमारी कला", services:"सेवाएँ", contact:"संपर्क", enquire:"पूछताछ", language:"🌐 भाषा", all:"सभी डिज़ाइन", maggam:"मग्गम वर्क", computer:"कंप्यूटर कढ़ाई", blouse:"ब्लाउज़ डिज़ाइन", designerBlouses:"डिज़ाइनर ब्लाउज़", custom:"कस्टम डिज़ाइन", designer:"डिज़ाइनर वियर", frocks:"फ्रॉक", lehenga:"डिज़ाइनर लहंगे", bridal:"शादी के कपड़े", kids:"बच्चों के कपड़े", saree:"साड़ी टैसल", search:"डिज़ाइन खोजें", sortNewest:"नए पहले", sortOldest:"पुराने पहले", sortName:"नाम के अनुसार", featured:"★ केवल विशेष डिज़ाइन", sectionCollection:"01 — कलेक्शन", sectionServices:"02 — हमारी सेवाएँ", heroEyebrow:"पार्वती क्रिएशन्स · तेलंगाना", heroTitle:"आपकी पसंद के अनुसार परंपरा।", heroDescription:"यादगार पलों के लिए सावधानी से की गई सिलाई, बारीक कढ़ाई और खास अवसरों के कपड़े।", explore:"कलेक्शन देखें", heroNote:"सावधानी से बनाया, प्यार से पूरा किया।", collectionEyebrow:"हर अवसर के लिए कुछ खास", collectionTitle:"अपना पसंदीदा डिज़ाइन चुनें।", collectionDescription:"रोज़मर्रा की सुंदरता से लेकर शादी के खास कपड़ों तक, अपनी शैली से प्रेरित डिज़ाइन देखें।", photoDisclaimer:"सिलाई शुरू करने से पहले हर कस्टम ऑर्डर पर आपसे चर्चा की जाती है।", craftEyebrow:"खूबसूरती बारीकियों में है", craftTitle:"हाथों से बनाया। आपके लिए।", craftDescription:"नाज़ुक धागे के काम से लेकर अच्छी तरह तैयार ब्लाउज़ तक, हम आपके विचारों को आकार देते हैं।", craftCta:"आइए, मिलकर कुछ खास बनाएँ", servicesEyebrow:"हमारी सेवाएँ", servicesTitle:"हर बारीकी पर ध्यान।", servicesDescription:"अपनी पसंद बताएँ। हम सही फिट, फिनिश और अवसर के अनुसार विवरण चुनने में मदद करेंगे।", contactEyebrow:"आपका विचार, हमारी कला", contactTitle:"क्या आपके मन में कोई डिज़ाइन है?", contactDescription:"अपनी पसंद की तस्वीर या प्रेरणा साझा करें। आइए, आपके डिज़ाइन पर बात करें।", whatsapp:"WhatsApp पर बात करें", footerStory:"हर सिलाई एक कहानी कहती है।", instagram:"इंस्टाग्राम", youtube:"YouTube", owner:"मालिक लॉगिन", visitBoutique:"हमारे बुटीक आएँ", welcomeTitle:"अपनी भाषा चुनें", welcomeNote:"आप पेज के ऊपर से कभी भी भाषा बदल सकते हैं।", footerCollection:"कलेक्शन", footerServices:"सेवाएँ", footerContact:"संपर्क", service1:"मग्गम वर्क और हाथ की कढ़ाई", service2:"कंप्यूटर कढ़ाई", service3:"ब्लाउज़ सिलाई और कस्टम डिज़ाइन", service4:"शादी के कपड़े, लहंगे और खास परिधान", service5:"फ्रॉक, बच्चों के कपड़े और सलवार सिलाई", service6:"साड़ी टैसल और फिनिशिंग" }
};

const pcStaticTranslations = [
  [".hero-copy .eyebrow","heroEyebrow"],[".hero-copy h1","heroTitle"],[".hero-description","heroDescription"],[".hero-copy .button-dark span:first-child","explore"],[".hero-note","heroNote"],
  [".collection .section-topline .eyebrow","collectionEyebrow"],[".collection .section-index","sectionCollection"],[".services .section-index","sectionServices"],[".collection .section-heading-row h2","collectionTitle"],[".collection .section-heading-row > p","collectionDescription"],[".photo-disclaimer","photoDisclaimer"],
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
  if (enquire) enquire.innerHTML = t.enquire + " <span>↗</span>";

  pcStaticTranslations.forEach(function (pair) {
    const element = document.querySelector(pair[0]);
    if (element && t[pair[1]]) {
      if (pair[1] === "heroNote") {
        const star = element.querySelector(".tiny-star");
        element.textContent = t[pair[1]];
        if (star) element.prepend(star);
      } else if (pair[1] === "heroTitle" || pair[1] === "craftTitle" || pair[1] === "servicesTitle" || pair[1] === "contactTitle") {
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
      te: "నమస్కారం పార్వతి క్రియేషన్స్, కస్టమ్ ఆర్డర్ గురించి వివరాలు కావాలి.",
      hi: "नमस्ते पार्वती क्रिएशन्स, मैं कस्टम ऑर्डर के बारे में पूछताछ करना चाहता/चाहती हूँ।"
    };
    contactWhatsApp.href = "https://wa.me/919550766784?text=" + encodeURIComponent(messages[language] || messages.en);
  }

  const heroSlider = document.getElementById("heroSlider");
  if (heroSlider) heroSlider.setAttribute("aria-label", language === "te" ? "పార్వతి క్రియేషన్స్ ప్రత్యేక డిజైన్లు" : language === "hi" ? "पार्वती क्रिएशन्स के खास डिज़ाइन" : "Parvathi Creations featured designs");
  const heroLink = document.querySelector(".hero-slide-link");
  if (heroLink) heroLink.setAttribute("aria-label", language === "te" ? "ఈ డిజైన్‌ను కలెక్షన్‌లో చూడండి" : language === "hi" ? "इस डिज़ाइन को कलेक्शन में देखें" : "Explore this design in the collection");
  const heroPrev = document.getElementById("heroSlidePrev");
  const heroNext = document.getElementById("heroSlideNext");
  const heroDots = document.getElementById("heroSlideDots");
  if (heroPrev) heroPrev.setAttribute("aria-label", language === "te" ? "మునుపటి డిజైన్" : language === "hi" ? "पिछला डिज़ाइन" : "Previous design");
  if (heroNext) heroNext.setAttribute("aria-label", language === "te" ? "తదుపరి డిజైన్" : language === "hi" ? "अगला डिज़ाइन" : "Next design");
  if (heroDots) heroDots.setAttribute("aria-label", language === "te" ? "ప్రత్యేక డిజైన్‌ను ఎంచుకోండి" : language === "hi" ? "खास डिज़ाइन चुनें" : "Choose featured design");
  const logoImages = document.querySelectorAll(".brand img, .footer-brand img");
  logoImages.forEach(function (img) { img.alt = language === "te" ? "పార్వతి క్రియేషన్స్ లోగో" : language === "hi" ? "पार्वती क्रिएशन्स लोगो" : "Parvathi Creations logo"; });
  const heroImage = document.getElementById("heroSlideImage");
  if (heroImage && !heroImage.dataset.designId) heroImage.alt = language === "te" ? "పార్వతి క్రియేషన్స్ బుటిక్ డిజైన్" : language === "hi" ? "पार्वती क्रिएशन्स बुटीक डिज़ाइन" : "Parvathi Creations boutique design";
  const label = document.querySelector('label[for="languageSelect"]');
  if (label) label.textContent = t.language;
  const welcomeTitle = document.getElementById("languageWelcomeTitle");
  if (welcomeTitle) welcomeTitle.textContent = t.welcomeTitle;
  const welcomeNote = document.querySelector(".language-welcome-note");
  if (welcomeNote) welcomeNote.textContent = t.welcomeNote;
  const locationTitle = document.getElementById("footerLocationTitle");
  if (locationTitle) locationTitle.textContent = t.visitBoutique;
  const nav = document.querySelector(".main-nav");
  if (nav) nav.setAttribute("aria-label", language === "te" ? "ప్రధాన నావిగేషన్" : language === "hi" ? "मुख्य नेविगेशन" : "Main navigation");
  const pageTitles = {
    en: "Parvathi Creations | Thoughtfully Made, Beautifully Yours",
    te: "పార్వతి క్రియేషన్స్ | మీ కోసం శ్రద్ధగా రూపొందించిన డిజైన్లు",
    hi: "पार्वती क्रिएशन्स | आपके लिए प्यार से तैयार डिज़ाइन"
  };
  document.title = pageTitles[language] || pageTitles.en;
  const descriptionMeta = document.querySelector('meta[name="description"]');
  if (descriptionMeta) {
    const descriptions = {
      en: "Parvathi Creations in Yamjal, Telangana. Custom blouses, maggam work, embroidery, bridal wear, frocks and thoughtful tailoring.",
      te: "తెలంగాణలోని యంజాల్‌లో పార్వతి క్రియేషన్స్. కస్టమ్ బ్లౌజ్‌లు, మగ్గం వర్క్, ఎంబ్రాయిడరీ, పెళ్లి దుస్తులు మరియు టైలరింగ్.",
      hi: "तेलंगाना के यमजाल में पार्वती क्रिएशन्स। कस्टम ब्लाउज़, मग्गम वर्क, कढ़ाई, शादी के कपड़े और सिलाई।"
    };
    descriptionMeta.setAttribute("content", descriptions[language] || descriptions.en);
  }
  const footerLinks = document.querySelectorAll(".footer-links a");
  const footerKeys = ["footerCollection","footerServices","footerContact","instagram","youtube","owner"];
  footerLinks.forEach(function (element,index) { if (t[footerKeys[index]]) element.textContent = t[footerKeys[index]] + (index === 3 ? " ↗" : ""); });

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
