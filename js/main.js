document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // MENÚ MÓVIL
    // ==========================================

    const menuToggle = document.querySelector(".menu-toggle");
    const mobileNav = document.querySelector(".mobile-nav");

    if (!menuToggle || !mobileNav) return;

    menuToggle.addEventListener("click", () => {
        const abierto = menuToggle.classList.toggle("active");
        mobileNav.classList.toggle("active", abierto);
        menuToggle.setAttribute("aria-expanded", String(abierto));
        menuToggle.setAttribute("aria-label", abierto ? "Cerrar menú" : "Abrir menú");
    });

    mobileNav.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", () => {
            menuToggle.classList.remove("active");
            mobileNav.classList.remove("active");
            menuToggle.setAttribute("aria-expanded", "false");
            menuToggle.setAttribute("aria-label", "Abrir menú");
        });
    });
});