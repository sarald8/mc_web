document.addEventListener("DOMContentLoaded", () => {

    /* ==========================================================
       MENÚ MÓVIL
    ========================================================== */

    const menuToggle = document.querySelector(".menu-toggle");
    const mobileNav = document.querySelector(".mobile-nav");

    if (menuToggle && mobileNav) {
        menuToggle.addEventListener("click", () => {
            const abierto = menuToggle.classList.toggle("active");

            mobileNav.classList.toggle("active", abierto);
            menuToggle.setAttribute("aria-expanded", String(abierto));
            menuToggle.setAttribute(
                "aria-label",
                abierto ? "Cerrar menú" : "Abrir menú"
            );
        });

        mobileNav.querySelectorAll("a").forEach(link => {
            link.addEventListener("click", () => {
                menuToggle.classList.remove("active");
                mobileNav.classList.remove("active");

                menuToggle.setAttribute("aria-expanded", "false");
                menuToggle.setAttribute("aria-label", "Abrir menú");
            });
        });
    }

    /* ==========================================================
       CARGAR UBICACIONES
    ========================================================== */

    const container = document.getElementById("ubicaciones-container");

    if (!container) {
        console.warn("No se encontró #ubicaciones-container.");
        return;
    }

    fetch("paginas/ubicaciones.html")
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            return response.text();
        })
        .then(html => {
            container.innerHTML = html;

            if (typeof inicializarUbicaciones === "function") {
                inicializarUbicaciones();
            } else {
                console.error(
                    "No se encontró la función inicializarUbicaciones()."
                );
            }
        })
        .catch(error => {
            console.error("Error cargando ubicaciones:", error);
        });

});