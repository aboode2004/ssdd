
document.addEventListener("DOMContentLoaded", function () {

    const menuToggle = document.getElementById("menuToggle");
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("overlay");
    const themeToggle = document.getElementById("themeToggle");
    const backToTop = document.getElementById("backToTop");
    const pageLoader = document.getElementById("pageLoader");

    // إخفاء شاشة التحميل
    window.addEventListener("load", function () {
        pageLoader.classList.add("hidden");
    });

    // القائمة الجانبية
    function closeMenu() {
        sidebar.classList.remove("active");
        overlay.classList.remove("active");
    }

    menuToggle.addEventListener("click", function () {
        sidebar.classList.toggle("active");
        overlay.classList.toggle("active");
    });

    overlay.addEventListener("click", closeMenu);

    // إغلاق القائمة عند اختيار قسم
    document.querySelectorAll(".navigation a").forEach(function (link) {
        link.addEventListener("click", closeMenu);
    });

    // الوضع الليلي والنهاري
    const savedTheme = localStorage.getItem("website-theme");

    if (savedTheme === "dark") {
        document.body.classList.add("dark-mode");
        themeToggle.textContent = "☀";
    }

    themeToggle.addEventListener("click", function () {
        document.body.classList.toggle("dark-mode");

        const isDark = document.body.classList.contains("dark-mode");

        themeToggle.textContent = isDark ? "☀" : "☾";

        localStorage.setItem(
            "website-theme",
            isDark ? "dark" : "light"
        );
    });

    // زر العودة إلى الأعلى
    window.addEventListener("scroll", function () {

        if (window.scrollY > 350) {
            backToTop.classList.add("visible");
        } else {
            backToTop.classList.remove("visible");
        }

    });

    backToTop.addEventListener("click", function () {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });

    // تأثير ظهور العناصر
    const revealElements = document.querySelectorAll(".reveal");

    if ("IntersectionObserver" in window) {

        const revealObserver = new IntersectionObserver(function (entries) {

            entries.forEach(function (entry) {

                if (entry.isIntersecting) {
                    entry.target.classList.add("show");
                    revealObserver.unobserve(entry.target);
                }

            });

        }, {
            threshold: 0.12
        });

        revealElements.forEach(function (element) {
            revealObserver.observe(element);
        });

    } else {
        revealElements.forEach(function (element) {
            element.classList.add("show");
        });
    }

    // تحديد القسم الحالي في القائمة
    const sections = document.querySelectorAll("main section[id]");
    const navigationLinks = document.querySelectorAll(".navigation a");

    if ("IntersectionObserver" in window) {

        const sectionObserver = new IntersectionObserver(function (entries) {

            entries.forEach(function (entry) {

                if (entry.isIntersecting) {

                    const currentId = entry.target.getAttribute("id");

                    navigationLinks.forEach(function (link) {

                        link.classList.remove("active");

                        if (link.getAttribute("href") === "#" + currentId) {
                            link.classList.add("active");
                        }

                    });

                }

            });

        }, {
            rootMargin: "-25% 0px -60% 0px"
        });

        sections.forEach(function (section) {
            sectionObserver.observe(section);
        });
    }

    // السنة الحالية تلقائياً
    document.getElementById("year").textContent =
        new Date().getFullYear();

});
