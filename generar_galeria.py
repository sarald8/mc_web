import os

CARPETA_FIESTAS = "imagenes/fiestas"
ARCHIVO_JS = "js/galeria.js"
EXTENSIONES = (".jpg", ".jpeg", ".png", ".webp")

fiestas = []

for carpeta in sorted(os.listdir(CARPETA_FIESTAS)):
    ruta = os.path.join(CARPETA_FIESTAS, carpeta)

    if not os.path.isdir(ruta):
        continue

    fotos = sorted(
        archivo for archivo in os.listdir(ruta)
        if archivo.lower().endswith(EXTENSIONES)
    )

    if not fotos:
        continue

    nombre = carpeta.replace("-", " ").upper()

    fiesta = {
        "nombre": nombre,
        "lugar": "",
        "carpeta": carpeta,
        "fotos": fotos
    }

    fiestas.append(fiesta)

contenido = """const fiestas = [
"""

for fiesta in fiestas:
    contenido += "    {\n"
    contenido += f'        nombre: "{fiesta["nombre"]}",\n'
    contenido += f'        lugar: "{fiesta["lugar"]}",\n'
    contenido += f'        carpeta: "{fiesta["carpeta"]}",\n'
    contenido += "        fotos: [\n"

    for foto in fiesta["fotos"]:
        contenido += f'            "{foto}",\n'

    contenido += "        ]\n"
    contenido += "    },\n"

contenido += """];

const contenedor = document.getElementById("fiestas-galeria");

fiestas.forEach(fiesta => {
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
"""

with open(ARCHIVO_JS, "w", encoding="utf-8") as archivo:
    archivo.write(contenido)

print(f"Galería generada correctamente: {len(fiestas)} fiestas encontradas.")

for fiesta in fiestas:
    print(f'- {fiesta["carpeta"]}: {len(fiesta["fotos"])} fotos')