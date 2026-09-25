const artistas = [
    {
        nombre: "SUPERRESERVAO",
        imagen: "imagenes/artistas/superreservao.png"
    },
    {
        nombre: "ICY VEDO",
        imagen: "imagenes/artistas/icyvedo.jpeg"
    },
    {
        nombre: "GLORYSIXVAIN",
        imagen: "imagenes/artistas/glorysixvain.webp"
    },
    {
        nombre: "DSM",
        imagen: "imagenes/artistas/dsm.jpg"
    },
    {
        nombre: "YUNG BRANDY",
        imagen: "imagenes/artistas/yungbrandy.jpeg"
    },
    {
        nombre: "MAIN COSTA",
        imagen: "imagenes/artistas/maincosta2.jpg"
    },
    {
        nombre: "AMORYODIO",
        imagen: "imagenes/artistas/amoryodio.jpg"
    },
    {
        nombre: "PEDRO LADROGA",
        imagen: "imagenes/artistas/pedroladroga.avif"
    }
];

const artistasContainer = document.getElementById("past-artists-list");

if (artistasContainer) {
    artistas.forEach(artista => {
        const tarjeta = document.createElement("article");
        tarjeta.className = "artist-card";

        const imageWrap = document.createElement("div");
        imageWrap.className = "artist-image";

        const img = document.createElement("img");
        img.src = artista.imagen;
        img.alt = `${artista.nombre} - Monocromatics`;

        imageWrap.appendChild(img);

        const contentWrap = document.createElement("div");
        contentWrap.className = "artist-card-content";

        const titulo = document.createElement("h3");
        titulo.textContent = artista.nombre;

        contentWrap.appendChild(titulo);

        tarjeta.appendChild(imageWrap);
        tarjeta.appendChild(contentWrap);

        artistasContainer.appendChild(tarjeta);
    });
}

const prevBtn = document.querySelector(".past-artists .carousel-prev");
const nextBtn = document.querySelector(".past-artists .carousel-next");

if (prevBtn && nextBtn && artistasContainer) {
    // Devuelve el índice de la card visible más cercana al borde izquierdo.
    const currentIndex = () => {
        const cards = Array.from(artistasContainer.querySelectorAll(".artist-card"));
        const scrollLeft = artistasContainer.scrollLeft;
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
    const scrollToIndex = (index) => {
        const cards = artistasContainer.querySelectorAll(".artist-card");
        const clamped = Math.max(0, Math.min(index, cards.length - 1));
        const card = cards[clamped];
        if (card) {
            artistasContainer.scrollTo({ left: card.offsetLeft, behavior: "smooth" });
        }
    };

    prevBtn.addEventListener("click", () => {
        scrollToIndex(currentIndex() - 1);
    });

    nextBtn.addEventListener("click", () => {
        scrollToIndex(currentIndex() + 1);
    });
}