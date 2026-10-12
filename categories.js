/* Parvathi Creations - canonical design categories.
   Single source of truth for the public gallery (and, in a later step, the admin form).
   Matching is exact on a normalised alias. There is deliberately NO substring or
   name-based guessing, so a design is never silently moved to another category. */
(function (root) {
  "use strict";

  var CATEGORIES = [
    { key: "maggam",   label: "Maggam Work",         aliases: ["maggam", "maggam work", "maggam works", "thread work", "hand embroidery"] },
    { key: "computer", label: "Computer Embroidery", aliases: ["computer", "computer work", "computer embroidery", "computerized embroidery", "computerised embroidery", "computerized work", "computerised work", "machine embroidery"] },
    { key: "blouse",   label: "Blouse Designs",      aliases: ["blouse", "blouses", "blouse designs"] },
    { key: "designer-blouses", label: "Designer Blouses", aliases: ["designer blouse", "designer blouses", "designer blouse design", "designer blouse designs", "designer blouses design", "designer blouses designs"] },
    { key: "designer", label: "Designer Wear",       aliases: ["designer", "designer wear", "designerwear", "designer outfit", "designer outfits"] },
    { key: "frocks",   label: "Frocks",              aliases: ["frock", "frocks", "frock design", "frock designs", "frocks design", "frocks designs", "kids frock", "kids frocks", "kid frock", "girl frock", "girls frock", "baby frock", "baby frocks", "children frock", "children frocks", "knee length frock", "short frock", "long frock", "frock stitching", "frock work", "frocks wear", "frock wear", "kids frock design", "kids frocks design"] },
    { key: "lehenga",  label: "Designer Lehengas",   aliases: ["lehenga", "lehengas", "designer lehengas"] },
    { key: "bridal",   label: "Wedding Wear",        aliases: ["bridal", "bridal wear", "wedding", "wedding wear", "wedding dresses", "occasionwear", "occasion wear"] },
    { key: "kids",     label: "Kids Wear",           aliases: ["kids", "kid wear", "kids wear", "children", "children wear"] },
    { key: "saree",    label: "Sarees & Tassels",    aliases: ["saree", "sarees", "saree tassels", "sarees and tassels", "tassel", "tassels"] },
    { key: "custom",   label: "Custom Designs",      aliases: ["custom", "custom design", "custom designs", "tailoring", "salwar"] }
  ];

  var UNCATEGORIZED = "uncategorized";

  function normalizeText(value) {
    return String(value == null ? "" : value)
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9 ]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  var aliasToKey = {};
  CATEGORIES.forEach(function (c) {
    aliasToKey[normalizeText(c.key)] = c.key;
    aliasToKey[normalizeText(c.label)] = c.key;
    c.aliases.forEach(function (a) { aliasToKey[normalizeText(a)] = c.key; });
  });

  function keyFor(value) {
    var k = aliasToKey[normalizeText(value)];
    return k || UNCATEGORIZED;
  }

  function labelFor(key) {
    for (var i = 0; i < CATEGORIES.length; i++) if (CATEGORIES[i].key === key) return CATEGORIES[i].label;
    return "Other";
  }

  root.PCCategories = {
    list: CATEGORIES,
    UNCATEGORIZED: UNCATEGORIZED,
    normalizeText: normalizeText,
    keyFor: keyFor,
    labelFor: labelFor,
    isKnownKey: function (key) { return CATEGORIES.some(function (c) { return c.key === key; }); }
  };
})(typeof window !== "undefined" ? window : this);
