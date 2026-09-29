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

        /* ==========================================================
           aria-current EN EL MENÚ
           Marca el enlace de la sección visible (en el móvil, donde el menú
           no se ve mientras se navega, lo anuncia el lector de pantalla).
           Solo cuenta los enlaces internos (#id): Contacto es otra página.
        ========================================================== */

        const enlacesSeccion = Array.from(mobileNav.querySelectorAll('a[href^="#"]'))
            .map(link => ({ link, seccion: document.getElementById(link.getAttribute("href").slice(1)) }))
            .filter(par => par.seccion);

        if (enlacesSeccion.length > 0 && "IntersectionObserver" in window) {
            const marcar = (link) => {
                enlacesSeccion.forEach(par => {
                    if (par.link === link) {
                        par.link.setAttribute("aria-current", "true");
                    } else {
                        par.link.removeAttribute("aria-current");
                    }
                });
            };

            const visibles = new Map();

            const observador = new IntersectionObserver(entries => {
                entries.forEach(entry => visibles.set(entry.target, entry.isIntersecting ? entry.intersectionRatio : 0));

                const mejor = enlacesSeccion
                    .map(par => par.seccion)
                    .filter(seccion => (visibles.get(seccion) || 0) > 0)
                    .sort((a, b) => (visibles.get(b) || 0) - (visibles.get(a) || 0))[0];

                if (mejor) {
                    marcar(enlacesSeccion.find(par => par.seccion === mejor).link);
                }
            }, { threshold: [0.25, 0.5, 0.75] });

            enlacesSeccion.forEach(par => observador.observe(par.seccion));
        }
    }

    /* ==========================================================
       CARGAR UBICACIONES
       main.js se carga también en páginas internas (contacto, legales,
       gracias) que no tienen #ubicaciones-container: sin el contenedor no hay
       nada que hacer aquí. Antes se hacía un `return`, que cortaba el script
       entero para lo que viniera después; ahora todo el bloque vive dentro
       del if, así que se puede seguir añadiendo código abajo sin sorpresas.
    ========================================================== */

    const container = document.getElementById("ubicaciones-container");

    if (container) {
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
    }

});