const fiestasAnteriores = [
    {
        fecha: "JULIO 2026",
        ciudad: "VIGO",
        artista: "ARTISTA X",
        descripcion: "descripción",
        imagen: "imagenes/fiestas/variadas/IMG_0470.jpg",
        enlace: "#"
    },
    {
        fecha: "AGOSTO 2026",
        ciudad: "CORUÑA",
        artista: "ARTISTA X",
        descripcion: "descripción",
        imagen: "imagenes/fiestas/variadas/IMG_0470.jpg",
        enlace: "#"
    },
    {
        fecha: "SEPTIEMBRE 2026",
        ciudad: "SANTIAGO",
        artista: "ARTISTA X",
        descripcion: "descripción",
        imagen: "imagenes/fiestas/blinblin/BLIBLINXMONOCROMO86.JPEG",
        enlace: "#"
    }
];

const pastPartiesList = document.getElementById("past-parties-list");

fiestasAnteriores.forEach(fiesta => {
    pastPartiesList.innerHTML += `
        <article class="party-card">
            <div class="party-image">
                <img src="${fiesta.imagen}" alt="Monocromatics ${fiesta.fecha.toLowerCase()} · ${fiesta.ciudad.toLowerCase()}">
            </div>
            <div class="party-card-content">
                <p class="party-date">${fiesta.fecha} · ${fiesta.ciudad}</p>
                <h3>${fiesta.artista}</h3>
                <p>${fiesta.descripcion}</p>
                <a href="${fiesta.enlace}" class="text-link">VER FIESTA →</a>
            </div>
        </article>
    `;
});

const partyGrid = document.getElementById("past-parties-list");
const prevButton = document.querySelector(".carousel-prev");
const nextButton = document.querySelector(".carousel-next");

function desplazarCarrusel(direccion) {
    if (!partyGrid) return;

    partyGrid.scrollBy({
        left: partyGrid.clientWidth * 0.55 * direccion,
        behavior: "smooth"
    });
}

if (prevButton && partyGrid) {
    prevButton.addEventListener("click", () => desplazarCarrusel(-1));
}

if (nextButton && partyGrid) {
    nextButton.addEventListener("click", () => desplazarCarrusel(1));
}