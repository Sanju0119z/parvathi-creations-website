
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

    const whatsappNumber = "YOUR_WHATSAPP_NUMBER";

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
