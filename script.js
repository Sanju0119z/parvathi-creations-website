(() => {
  "use strict";
  const SUPABASE_URL = "https://ydhqjkyzbbooolaugydk.supabase.co";
  const SUPABASE_KEY = "sb_publishable_uAy9Zv6zXK_cVFFGJfOxKQ_I1aRhJMs";
  const categoryMap = [
    {key:"saree", words:["saree", "tassel"]},
    {key:"blouse", words:["blouse"]},
    {key:"maggam", words:["maggam", "thread work"]},
    {key:"bridal", words:["bridal", "wedding"]},
    {key:"frocks", words:["frock"]},
    {key:"kids", words:["kids wear", "kid wear", "children wear", "kids", "children"]},
    {key:"lehenga", words:["lehenga"]},
    {key:"computer", words:["computer", "embroidery"]},
    {key:"custom", words:["custom", "tailoring"]}
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

  function createUploadedCard(design) {
    if (!design.image_url) return null;
    const category = normalizeCategory(design.category);
    const card = document.createElement("a");
    card.className = "collection-card uploaded-design";
    card.dataset.category = category;
    card.href = "#contact";
    card.setAttribute("aria-label", (design.name || design.category || "Design") + " â ask about this design");

    const img = document.createElement("img");
    img.src = design.image_url;
    img.alt = design.name || (design.category || "Parvathi Creations") + " design";
    img.loading = "lazy";
    img.decoding = "async";
    img.onerror = () => { card.remove(); applyFilter(activeCategory, activeButton); };

    const number = document.createElement("span");
    number.className = "card-number";
    number.textContent = "NEW";

    const label = document.createElement("div");
    label.className = "card-label";
    const heading = document.createElement("h3");
    heading.textContent = design.name || design.category || "New Design";
    const arrow = document.createElement("span");
    arrow.textContent = "â";
    label.append(heading, arrow);
    card.append(img, number, label);
    return card;
  }

  async function loadUploadedDesigns() {
    const grid = document.querySelector(".collection-grid");
    if (!grid || !window.supabase) return;
    try {
      const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
      const { data, error } = await client.from("designs").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      (data || []).filter(design => design.hidden !== true).forEach(design => {
        const card = createUploadedCard(design);
        if (card) grid.prepend(card);
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
    loadUploadedDesigns();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();