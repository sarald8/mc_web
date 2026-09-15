import os
import subprocess
import sys

CARPETA_FOTOS = "fotos_para_subir"
ARCHIVO_JS = "js/galeria.js"
BUCKET_R2 = "monocromatics-fotos"
RUTA_R2 = "imagenes/fiestas"
EXTENSIONES = (".jpg", ".jpeg", ".png", ".webp")

# URL pública del bucket R2 (dashboard -> R2 -> monocromatics-fotos -> Public access)
R2_PUBLIC_URL = "https://pub-196ffc8ef6544a1a83073be29e5a331f.r2.dev"


def subir_a_r2(carpeta_local, carpeta_r2, fotos):
    """Sube cada foto individualmente a R2 usando wrangler (no rclone)."""
    for foto in fotos:
        origen = os.path.join(carpeta_local, foto)
        destino = f"{BUCKET_R2}/{carpeta_r2}/{foto}"
        print(f"Subiendo: {origen} -> {destino}")

        comando = f'npx wrangler r2 object put "{destino}" --file="{origen}" --remote'

        resultado = subprocess.run(
            comando,
            check=False,
            shell=True  # en Windows, shell=True necesita un string, no una lista
        )

        if resultado.returncode != 0:
            print(f"ERROR: no se pudo subir {foto} a R2.")
            sys.exit(1)


fiestas = []

if not os.path.isdir(CARPETA_FOTOS):
    print(f"No existe la carpeta: {CARPETA_FOTOS}")
    sys.exit(1)

for carpeta in sorted(os.listdir(CARPETA_FOTOS)):
    ruta = os.path.join(CARPETA_FOTOS, carpeta)

    if not os.path.isdir(ruta):
        continue

    fotos = sorted(
        archivo for archivo in os.listdir(ruta)
        if archivo.lower().endswith(EXTENSIONES)
    )

    if not fotos:
        continue

    nombre = carpeta.replace("-", " ").upper()
    ruta_r2 = f"{RUTA_R2}/{carpeta}"

    subir_a_r2(ruta, ruta_r2, fotos)

    fiesta = {
        "nombre": nombre,
        "lugar": "",
        "carpeta": carpeta,
        "fotos": fotos
    }

    fiestas.append(fiesta)

contenido = f"""const R2_PUBLIC_URL = "{R2_PUBLIC_URL}";

const fiestas = [

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

"""

with open(ARCHIVO_JS, "w", encoding="utf-8") as archivo:
    archivo.write(contenido)

print()
print(f"Galería generada correctamente: {len(fiestas)} fiestas encontradas.")

for fiesta in fiestas:
    print(f'- {fiesta["carpeta"]}: {len(fiesta["fotos"])} fotos')