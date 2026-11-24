const $ = (s) => document.querySelector(s);
const sidebar = $("#sidebar"), overlay = $("#overlay"), menuBtn = $("#menuBtn");
const links = document.querySelectorAll(".sidebar nav a");

function toggleMenu(open) {
  sidebar.classList.toggle("open", open);
  overlay.classList.toggle("show", open);
  menuBtn.setAttribute("aria-expanded", open);
}
menuBtn.onclick = () => toggleMenu(!sidebar.classList.contains("open"));
overlay.onclick = () => toggleMenu(false);
document.addEventListener("keydown", (e) => e.key === "Escape" && toggleMenu(false));
links.forEach((a) => a.addEventListener("click", () => toggleMenu(false)));

// الوضع الليلي/النهاري (يُحفظ إن أمكن)
const root = document.documentElement;
try { const t = localStorage.getItem("theme"); if (t) root.dataset.theme = t; } catch (e) {}
$("#themeBtn").onclick = () => {
  root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
  try { localStorage.setItem("theme", root.dataset.theme); } catch (e) {}
};

// كتابة متحركة للمسميات
const roles = ["مبرمج مواقع", "فاحص مواقع", "مطوّر بوتات تيليجرام"];
const typed = $("#typed");
let r = 0, c = 0, del = false;
(function type() {
  const w = roles[r];
  typed.textContent = w.slice(0, c);
  if (!del && c === w.length) { del = true; return setTimeout(type, 1400); }
  if (del && c === 0) { del = false; r = (r + 1) % roles.length; }
  c += del ? -1 : 1;
  setTimeout(type, del ? 40 : 90);
})();

// ظهور الأقسام + عدّاد الأرقام + أشرطة المهارات
const count = (el) => {
  const n = +el.dataset.n; let i = 0;
  const t = setInterval(() => { i += Math.ceil(n / 40); if (i >= n) { i = n; clearInterval(t); } el.textContent = i; }, 35);
};
const io = new IntersectionObserver((es) => es.forEach((e) => {
  if (!e.isIntersecting) return;
  e.target.classList.add("in");
  e.target.querySelectorAll(".meter").forEach((m) => (m.firstElementChild.style.width = m.dataset.v + "%"));
  e.target.querySelectorAll("[data-n]").forEach(count);
  io.unobserve(e.target);
}), { threshold: 0.15 });
document.querySelectorAll(".reveal").forEach((s) => io.observe(s));

// تمييز القسم الحالي
const so = new IntersectionObserver((es) => es.forEach((e) => {
  if (e.isIntersecting) links.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + e.target.id));
}), { rootMargin: "-40% 0px -55% 0px" });
document.querySelectorAll("main section").forEach((s) => so.observe(s));

// شريط التقدم وزر الأعلى
const top = $("#topBtn");
addEventListener("scroll", () => {
  const h = document.documentElement;
  $("#progress").style.width = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100 + "%";
  top.classList.toggle("show", h.scrollTop > 500);
});
top.onclick = () => scrollTo({ top: 0, behavior: "smooth" });
$("#year").textContent = new Date().getFullYear();
