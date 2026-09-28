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
       main.js se carga también en páginas internas (contacto, legales,
       gracias) que no tienen #ubicaciones-container: allí no hay nada
       que hacer aquí, así que salimos sin abortar lo que venga después.
    ========================================================== */

    const container = document.getElementById("ubicaciones-container");

    if (!container) {
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
            // <template> es inerte: su contenido NO se renderiza ni ejecuta nada
            // al parsearse. Solo clonamos después el <section> esperado, así que
            // aunque el archivo llegase manipulado (o se sirviera desde fuera)
            // no se inyecta HTML arbitrario con innerHTML.
            const template = document.createElement("template");
            template.innerHTML = html;

            const fragmento = template.content.querySelector("section.ubicaciones");

            if (!fragmento) {
                console.error("El fragmento de ubicaciones no contiene un <section class=\"ubicaciones\">.");
                return;
            }

            container.appendChild(fragmento);

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