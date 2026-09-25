const rookies = [
    { nombre: "Adan", imagen: "imagenes/rookies/adan.jpg" },
    { nombre: "Rookah", imagen: "imagenes/rookies/rookah.jpg" },
    { nombre: "Komojo", imagen: "imagenes/rookies/komojo.jpg" },
    { nombre: "Eighteen", imagen: "imagenes/rookies/eighteen.jpeg" },
    { nombre: "Candi", imagen: "imagenes/rookies/candi2.jpg" },
    { nombre: "Rdriguez00", imagen: "imagenes/rookies/Rdriguez00.jpg" },
    { nombre: "1Xenay", imagen: "imagenes/rookies/1xenay.png" },
    { nombre: "Ken2Asga", imagen: "imagenes/rookies/Ken2Asga.jpg" },
    { nombre: "DieYoungBreffo", imagen: "imagenes/rookies/dieyoungbreffo.png" },
    { nombre: "1006ramos", imagen: "imagenes/rookies/1006ramos.jpg" },
    //{ nombre: "8taven", imagen: "imagenes/rookies/8taven.jpg" },
    { nombre: "6glock", imagen: "imagenes/rookies/6glock.png" },
    { nombre: "Lanasa2000", imagen: "imagenes/rookies/lanasa2000.png" },
    { nombre: "Pradda", imagen: "imagenes/rookies/pradda.jpg" },
    { nombre: "Queiru", imagen: "imagenes/rookies/queiru.jpg" },
    { nombre: "Luvive", imagen: "imagenes/rookies/luvive.png" }
];

const rookiesContainer = document.getElementById("rookies-list");

if (rookiesContainer) {
    rookies.forEach(rookie => {
        const tarjeta = document.createElement("article");
        tarjeta.className = "artist-card";

        const imageWrap = document.createElement("div");
        imageWrap.className = "artist-image";

        const img = document.createElement("img");
        img.src = rookie.imagen;
        img.alt = `${rookie.nombre} - Monocromatics`;

        imageWrap.appendChild(img);

        const contentWrap = document.createElement("div");
        contentWrap.className = "artist-card-content";

        const titulo = document.createElement("h3");
        titulo.textContent = rookie.nombre;

        contentWrap.appendChild(titulo);

        tarjeta.appendChild(imageWrap);
        tarjeta.appendChild(contentWrap);

        rookiesContainer.appendChild(tarjeta);
    });
}

const rookiesPrevBtn = document.querySelector(".rookies .carousel-prev");
const rookiesNextBtn = document.querySelector(".rookies .carousel-next");

if (rookiesPrevBtn && rookiesNextBtn && rookiesContainer) {
    // Devuelve el índice de la card visible más cercana al borde izquierdo.
    const rookiesCurrentIndex = () => {
        const cards = Array.from(rookiesContainer.querySelectorAll(".artist-card"));
        const scrollLeft = rookiesContainer.scrollLeft;
        let index = 0;
        let min = Infinity;
        cards.forEach((card, i) => {
            const distance = Math.abs(card.offsetLeft - scrollLeft);
            if (distance < min) {
                min = distance;
                index = i;
            }
        });
        return index;
    };

    // Desplaza a la posición exacta de una card (coincide con el snap).
    const rookiesScrollToIndex = (index) => {
        const cards = rookiesContainer.querySelectorAll(".artist-card");
        const clamped = Math.max(0, Math.min(index, cards.length - 1));
        const card = cards[clamped];
        if (card) {
            rookiesContainer.scrollTo({ left: card.offsetLeft, behavior: "smooth" });
        }
    };

    rookiesPrevBtn.addEventListener("click", () => {
        rookiesScrollToIndex(rookiesCurrentIndex() - 1);
    });

    rookiesNextBtn.addEventListener("click", () => {
        rookiesScrollToIndex(rookiesCurrentIndex() + 1);
    });
}
