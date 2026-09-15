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
        imagen: "imagenes/artistas/maincosta.jpg"
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
    const scrollAmount = () => {
        const card = artistasContainer.querySelector(".artist-card");
        return card ? card.offsetWidth + 25 : 300;
    };

    prevBtn.addEventListener("click", () => {
        artistasContainer.scrollBy({ left: -scrollAmount(), behavior: "smooth" });
    });

    nextBtn.addEventListener("click", () => {
        artistasContainer.scrollBy({ left: scrollAmount(), behavior: "smooth" });
    });
}