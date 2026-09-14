
// Smooth reveal animation

const reveals = document.querySelectorAll(".reveal");

function revealOnScroll() {
  reveals.forEach((item) => {
    const windowHeight = window.innerHeight;
    const elementTop = item.getBoundingClientRect().top;

    if (elementTop < windowHeight - 100) {
      item.classList.add("active");
    }
  });
}

window.addEventListener("scroll", revealOnScroll);

revealOnScroll();
// Smooth scrolling for navigation links

document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener("click", function (e) {
    e.preventDefault();

    const target = document.querySelector(this.getAttribute("href"));

    if (target) {
      target.scrollIntoView({
        behavior: "smooth"
      });
    }
  });
});
// Highlight active navigation link while scrolling

const sections = document.querySelectorAll("section");
const navLinks = document.querySelectorAll(".nav-links a");

window.addEventListener("scroll", () => {
  let current = "";

  sections.forEach((section) => {
    const sectionTop = section.offsetTop - 120;

    if (window.scrollY >= sectionTop) {
      current = section.getAttribute("id");
    }
  });

  navLinks.forEach((link) => {
    link.classList.remove("active");

    if (link.getAttribute("href") === "#" + current) {
      link.classList.add("active");
    }
  });
});
/* =================================
   FEATURED DESIGNS JAVASCRIPT
================================= */

let selectedDesign = "";


/* LIKE BUTTON */

function likeDesign(button) {

    button.classList.toggle("liked");

    if (button.classList.contains("liked")) {

        button.innerHTML = "♥ Liked";

    } else {

        button.innerHTML = "♡ I Like This";

    }

}


/* OPEN DESIGN DETAILS */

function showDesignDetails(title, description) {

    selectedDesign = title;

    document.getElementById("modalDesignTitle")
        .textContent = title;

    document.getElementById("modalDesignDescription")
        .textContent = description;

    document.getElementById("designModal")
        .classList.add("active");

}


/* CLOSE MODAL */

function closeDesignDetails() {

    document.getElementById("designModal")
        .classList.remove("active");

}


/* ENQUIRY */

function sendDesignEnquiry() {

    const message =
        "Hello Parvathi Creations! " +
        "I am interested in the design: " +
        selectedDesign +
        ". Please share more details.";

    const whatsappNumber = "919550766784";

    const url =
        "https://wa.me/" +
        whatsappNumber +
        "?text=" +
        encodeURIComponent(message);

    window.open(url, "_blank");

}


/* CLOSE WHEN CLICKING OUTSIDE */

document.addEventListener(
    "click",
    function(event) {

        const modal =
            document.getElementById("designModal");

        if (
            event.target === modal
        ) {
            closeDesignDetails();
        }

    }
);

/* =========================================
   SUPABASE GALLERY
========================================= */

async function loadGalleryDesigns() {

    const gallery = document.getElementById("gallery-grid");
    const loading = document.getElementById("gallery-loading");
    const empty = document.getElementById("gallery-empty");

    if (!gallery) {
        console.log("Gallery grid not found.");
        return;
    }

    try {

        const { data, error } = await supabaseClient
            .from("designs")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Supabase gallery error:", error);

            if (loading) {
                loading.textContent =
                    "Unable to load latest designs.";
            }

            return;
        }

        if (loading) {
            loading.style.display = "none";
        }

        if (!data || data.length === 0) {

            if (empty) {
                empty.style.display = "block";
            }

            return;
        }

        gallery.innerHTML = "";

        data.forEach(function(design) {

            const item = document.createElement("div");

            item.className =
                "gallery-item uploaded-design";

            item.dataset.category =
                String(design.category || "all")
                    .toLowerCase()
                    .trim();

            const image =
                document.createElement("img");

            image.src = design.image_url;

            image.alt =
                design.name ||
                "Parvathi Creations Design";

            image.loading = "lazy";

            const overlay =
                document.createElement("div");

            overlay.className =
                "gallery-overlay";

            const title =
                document.createElement("h3");

            title.textContent =
                design.name ||
                "Parvathi Creations Design";

            const category =
                document.createElement("p");

            category.textContent =
                design.category || "";

            const button =
                document.createElement("button");

            button.textContent =
                "View Details";

            button.addEventListener(
                "click",
                function() {

                    showDesignDetails(
                        design.name ||
                        "Parvathi Creations Design",

                        design.description ||
                        "Beautiful Parvathi Creations design."
                    );

                }
            );

            overlay.appendChild(title);
            overlay.appendChild(category);
            overlay.appendChild(button);

            item.appendChild(image);
            item.appendChild(overlay);

            gallery.appendChild(item);

        });

    } catch (error) {

        console.error(
            "Gallery loading error:",
            error
        );

        if (loading) {
            loading.textContent =
                "Unable to load gallery.";
        }

    }
}


/* =========================================
   START GALLERY
========================================= */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        loadGalleryDesigns();

    }
);
