const fiestas = [
    {
        nombre: "BLINBLIN",
        lugar: "Santiago de Compostela",
        carpeta: "blinblin",
        apartado: 1,
        fotos: [
            "BLIBLINXMONOCROMO11.JPEG",
            "BLIBLINXMONOCROMO12.JPEG",
            "BLIBLINXMONOCROMO14.JPEG",
            "BLIBLINXMONOCROMO31.JPEG",
            "BLIBLINXMONOCROMO41.JPEG",
            "BLIBLINXMONOCROMO47.JPEG",
            "BLIBLINXMONOCROMO48.JPEG",
            "BLIBLINXMONOCROMO49.JPEG",
            "BLIBLINXMONOCROMO50.JPEG",
            "BLIBLINXMONOCROMO51.JPEG",
            "BLIBLINXMONOCROMO53.JPEG",
            "BLIBLINXMONOCROMO55.JPEG",
            "BLIBLINXMONOCROMO56.JPEG",
            "BLIBLINXMONOCROMO57.JPEG",
            "BLIBLINXMONOCROMO61.JPEG",
            "BLIBLINXMONOCROMO63.JPEG",
            "BLIBLINXMONOCROMO64.JPEG",
            "BLIBLINXMONOCROMO65.JPEG",
            "BLIBLINXMONOCROMO67.JPEG",
            "BLIBLINXMONOCROMO68.JPEG",
            "BLIBLINXMONOCROMO7.JPEG",
            "BLIBLINXMONOCROMO72.JPEG",
            "BLIBLINXMONOCROMO73.JPEG",
            "BLIBLINXMONOCROMO74.JPEG",
            "BLIBLINXMONOCROMO75.JPEG",
            "BLIBLINXMONOCROMO80.JPEG",
            "BLIBLINXMONOCROMO81.JPEG",
            "BLIBLINXMONOCROMO82.JPEG",
            "BLIBLINXMONOCROMO84.JPEG",
            "BLIBLINXMONOCROMO86.JPEG",
            "BLIBLINXMONOCROMO87.JPEG",
            "BLIBLINXMONOCROMO88.JPEG",
            "BLIBLINXMONOCROMO92.JPEG",
            "BLIBLINXMONOCROMO99.JPEG"
        ]
    },
    {
        nombre: "VARIADAS",
        lugar: "Vigo",
        carpeta: "variadas",
        apartado: 2,
        fotos: [
            "IMG_0335.jpg",
            "IMG_0337.jpg",
            "IMG_0339.jpg",
            "IMG_0340.jpg",
            "IMG_0349.jpg",
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
            "IMG_1403.jpg",
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
            "IMG_5629.jpg",
            "a616304b-99dd-4bf1-b6cd-1336bff6b1e8.JPG",
            "c473c008-c89f-4a9d-9977-7b8607c9762d.JPG"
        ]
    }
];

const contenedor = document.getElementById("fiestas-galeria");

const pagina = window.location.pathname;

let apartado = null;

if (pagina.includes("galeria_apartado1")) {
    apartado = 1;
} else if (pagina.includes("galeria_apartado2")) {
    apartado = 2;
} else if (pagina.includes("galeria_apartado3")) {
    apartado = 3;
}

const fiestasMostrar = fiestas.filter(fiesta => fiesta.apartado === apartado);

fiestasMostrar.forEach(fiesta => {
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
        img.src = `../imagenes/fiestas/${fiesta.carpeta}/${foto}`;
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
        if (e.key === "Escape") cerrarVisor();
    }

    document.addEventListener("keydown", cerrarConEscape);

    visor.querySelector(".cerrar-visor").addEventListener("click", cerrarVisor);

    visor.addEventListener("click", e => {
        if (e.target === visor) cerrarVisor();
    });
}