const R2_PUBLIC_URL = "https://pub-196ffc8ef6544a1a83073be29e5a331f.r2.dev";

const fiestas = [

    {
        nombre: "BLINBLIN",
        lugar: "Santiago",
        carpeta: "blinblin",
        fotos: [
            "BLIBLINXMONOCROMO73.JPEG",
            "BLIBLINXMONOCROMO82.JPEG",
            "BLIBLINXMONOCROMO86.JPEG",
        ]
    },
    {
        nombre: "VARIADAS",
        lugar: "Vigo",
        carpeta: "variadas",
        fotos: [
            "IMG_0470.jpg",
            "IMG_0968.PNG",
            "IMG_1304.jpg",
            "IMG_1307.jpg",
            "IMG_1309.jpg",
            "IMG_1310.jpg",
            "IMG_1311.jpg",
            "IMG_1312.jpg",
            "IMG_1313.jpg",
            "IMG_1314.jpg",
            "IMG_1315.jpg",
            "IMG_1316.jpg",
            "IMG_1317.jpg",
            "IMG_1318.jpg",
            "IMG_1319.jpg",
            "IMG_1320.jpg",
            "IMG_1321.jpg",
            "IMG_1322.jpg",
            "IMG_1323.jpg",
            "IMG_1324.jpg",
            "IMG_1325.jpg",
            "IMG_1326.jpg",
            "IMG_1415.jpg",
            "IMG_1661.jpg",
            "IMG_1662.jpg",
            "IMG_1663.jpg",
            "IMG_1664.jpg",
            "IMG_1665.jpg",
            "IMG_1666.jpg",
            "IMG_1667.jpg",
            "IMG_1668.jpg",
            "IMG_1669.jpg",
            "IMG_1670.jpg",
            "IMG_1672.jpg",
            "IMG_1673.jpg",
            "IMG_5627.jpg",
            "IMG_5628.jpg",
        ]
    },
];

const contenedor = document.getElementById("fiestas-galeria");
const carpetaObjetivo = contenedor.dataset.carpeta;

const fiestasAMostrar = carpetaObjetivo
    ? fiestas.filter(f => f.carpeta === carpetaObjetivo)
    : fiestas;

fiestasAMostrar.forEach(fiesta => {
    const seccion = document.createElement("section");
    seccion.className = "galeria-fiesta";

    const titulo = document.createElement("h2");
    titulo.textContent = fiesta.nombre;

    const lugar = document.createElement("p");
    lugar.textContent = fiesta.lugar;

    const grid = document.createElement("div");
    grid.className = "gallery-grid";

    fiesta.fotos.forEach(foto => {
        const img = document.createElement("img");

        img.src = `${R2_PUBLIC_URL}/imagenes/fiestas/${fiesta.carpeta}/${foto}`;
        img.alt = `Monocromatics ${fiesta.nombre}`;
        img.loading = "lazy";

        img.addEventListener("click", () => abrirFoto(img.src));

        grid.appendChild(img);
    });

    seccion.appendChild(titulo);
    seccion.appendChild(lugar);
    seccion.appendChild(grid);
    contenedor.appendChild(seccion);
});

function abrirFoto(src) {
    const visor = document.createElement("div");
    visor.className = "visor-foto";

    visor.innerHTML = `
        <button type="button" class="cerrar-visor">×</button>
        <img src="${src}" alt="Foto Monocromatics">
        <a href="${src}" download class="descargar-foto">DESCARGAR</a>
    `;

    document.body.appendChild(visor);

    function cerrarVisor() {
        visor.remove();
        document.removeEventListener("keydown", cerrarConEscape);
    }

    function cerrarConEscape(e) {
        if (e.key === "Escape") {
            cerrarVisor();
        }
    }

    document.addEventListener("keydown", cerrarConEscape);

    visor.querySelector(".cerrar-visor").addEventListener("click", cerrarVisor);

    visor.addEventListener("click", e => {
        if (e.target === visor) {
            cerrarVisor();
        }
    });
}