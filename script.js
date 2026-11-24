
const menuToggle = document.getElementById("menuToggle");
const sidebar = document.getElementById("sidebar");

menuToggle.addEventListener("click", function () {
    sidebar.classList.toggle("active");
});

const navigationLinks = document.querySelectorAll(".navigation a");

navigationLinks.forEach(function (link) {
    link.addEventListener("click", function () {
        sidebar.classList.remove("active");
    });
});

const sections = document.querySelectorAll("main section");
const links = document.querySelectorAll(".navigation a");

window.addEventListener("scroll", function () {
    let currentSection = "";

    sections.forEach(function (section) {
        const sectionTop = section.offsetTop - 150;

        if (window.scrollY >= sectionTop) {
            currentSection = section.getAttribute("id");
        }
    });

    links.forEach(function (link) {
        link.classList.remove("active");

        if (link.getAttribute("href") === "#" + currentSection) {
            link.classList.add("active");
        }
    });
});
