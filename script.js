
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
/* =================================
   SUPABASE GALLERY
================================= */

const SUPABASE_URL = "https://ydhqjkyzbbooolaugydk.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";

async function loadGallery() {
    const gallery = document.getElementById("gallery");

    if (!gallery) {
        console.log("Gallery element not found.");
        return;
    }

    try {
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/designs?select=*&order=created_at.desc`,
            {
                headers: {
                    "apikey": SUPABASE_ANON_KEY,
                    "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
                }
            }
        );

        if (!response.ok) {
            throw new Error("Could not load designs from Supabase.");
        }

        const designs = await response.json();

        gallery.innerHTML = "";

        if (!designs.length) {
            gallery.innerHTML =
                "<p>No designs available yet.</p>";
            return;
        }

        designs.forEach((design) => {

            const card = document.createElement("div");
            card.className = "gallery-item";

            card.innerHTML = `
                <img 
                    src="${design.image_url}" 
                    alt="${design.name || "Parvathi Creations design"}"
                    loading="lazy"
                >

                <div class="gallery-info">
                    <h3>${design.name || ""}</h3>

                    <p>
                        ${design.description || ""}
                    </p>

                    <button
                        onclick="showDesignDetails(
                            '${(design.name || "").replace(/'/g, "\\'")}',
                            '${(design.description || "").replace(/'/g, "\\'")}'
                        )"
                    >
                        ♡ I Like This
                    </button>
                </div>
            `;

            gallery.appendChild(card);
        });

    } catch (error) {

        console.error("Gallery error:", error);

        gallery.innerHTML =
            "<p>Unable to load designs right now.</p>";
    }
}

document.addEventListener("DOMContentLoaded", loadGallery);
