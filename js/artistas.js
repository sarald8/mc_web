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

artistas.forEach(artista => {
    const tarjeta = document.createElement("article");
    tarjeta.className = "artist-card";

    tarjeta.innerHTML = `
        <div class="artist-image">
            <img src="${artista.imagen}" alt="${artista.nombre} - Monocromatics">
        </div>
        <div class="artist-card-content">
            <h3>${artista.nombre}</h3>
        </div>
    `;

    artistasContainer.appendChild(tarjeta);
});