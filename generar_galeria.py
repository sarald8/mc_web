import json
import os
import re
import shutil
import subprocess
import sys

CARPETA_FOTOS = "fotos_para_subir"
ARCHIVO_JS = "js/galeria.js"
BUCKET_R2 = "monocromatics-fotos"
RUTA_R2 = "imagenes/fiestas"
EXTENSIONES = (".jpg", ".jpeg", ".png", ".webp")

# URL pública del bucket R2 (dashboard -> R2 -> monocromatics-fotos -> Public access)
R2_PUBLIC_URL = "https://pub-196ffc8ef6544a1a83073be29e5a331f.r2.dev"

# En Windows npx es npx.cmd; shutil.which resuelve la ruta real dentro del PATH
# para poder invocarlo con shell=False (lista de argumentos).
NPX = shutil.which("npx") or "npx"


def leer_fiestas_existentes(ruta_js):
    '''Extrae el array `fiestas` actual de js/galeria.js como lista de dicts.

    Devuelve una lista vacia si el archivo no existe o no se puede parsear.
    Sirve para hacer merge: respetar lo ya editado a mano (nombre, lugar) y no
    perder nada de lo que ya estaba en el archivo.
    '''
    if not os.path.isfile(ruta_js):
        return []

    with open(ruta_js, "r", encoding="utf-8") as archivo:
        contenido = archivo.read()

    # Delimitamos el array `const fiestas = [ ... ];`
    coincidencia = re.search(
        r"const\s+fiestas\s*=\s*\[(.*?)\n\];",
        contenido,
        re.DOTALL,
    )
    if not coincidencia:
        return []

    cuerpo = coincidencia.group(1)
    existentes = []

    # Cada fiesta es un objeto { ... } dentro del array. Los valores son strings
    # simples (no contienen llaves), asi que separar por llaves de objeto es
    # fiable aqui.
    for objeto in re.findall(r"\{(.*?)\}", cuerpo, re.DOTALL):
        campo_nombre = re.search(r"nombre\s*:\s*(\"(?:\\.|[^\"])*\")", objeto)
        campo_lugar = re.search(r"lugar\s*:\s*(\"(?:\\.|[^\"])*\")", objeto)
        campo_carpeta = re.search(r"carpeta\s*:\s*(\"(?:\\.|[^\"])*\")", objeto)
        campo_fotos = re.search(r"fotos\s*:\s*\[(.*?)\]", objeto, re.DOTALL)

        if not campo_carpeta:
            continue

        fiesta = {
            "nombre": json.loads(campo_nombre.group(1)) if campo_nombre else "",
            "lugar": json.loads(campo_lugar.group(1)) if campo_lugar else "",
            "carpeta": json.loads(campo_carpeta.group(1)),
            "fotos": [],
        }

        if campo_fotos:
            fiesta["fotos"] = [
                json.loads(cadena)
                for cadena in re.findall(
                    r"\"(?:\\.|[^\"])*\"", campo_fotos.group(1)
                )
            ]

        existentes.append(fiesta)

    return existentes


def subir_a_r2(carpeta_local, carpeta_r2, fotos):
    """Sube cada foto individualmente a R2 usando wrangler (no rclone)."""
    for foto in fotos:
        origen = os.path.join(carpeta_local, foto)
        destino = f"{BUCKET_R2}/{carpeta_r2}/{foto}"
        print(f"Subiendo: {origen} -> {destino}")

        # Lista de argumentos con shell=False: evita que nombres de archivo
        # con caracteres especiales se interpreten como comandos del shell.
        comando = [
            NPX, "wrangler", "r2", "object", "put",
            destino,
            f"--file={origen}",
            "--remote"
        ]

        resultado = subprocess.run(
            comando,
            check=False,
            shell=False
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


# --- Merge: no perder lo ya editado a mano en galeria.js -----------------
# Leemos las fiestas que ya estan en el archivo (con sus nombre/lugar editados)
# y las indexamos por carpeta para poder conservarlas.
existentes = leer_fiestas_existentes(ARCHIVO_JS)
por_carpeta = {f["carpeta"]: f for f in existentes}

fiestas_merge = []

for fiesta in fiestas:
    previa = por_carpeta.get(fiesta["carpeta"])

    if previa:
        # Conservamos nombre y lugar ya editados a mano; actualizamos fotos
        # (las del disco, que pueden traer nuevas) sin perder el orden previo.
        fiesta["nombre"] = previa["nombre"] or fiesta["nombre"]
        fiesta["lugar"] = previa["lugar"]

        fotos_previas = previa.get("fotos", [])
        fotos_nuevas = [f for f in fiesta["fotos"] if f not in fotos_previas]
        fiesta["fotos"] = fotos_previas + fotos_nuevas

    fiestas_merge.append(fiesta)

# Conservamos tambien fiestas que ya estaban en el archivo pero cuya carpeta ya
# no esta en disco (no las borramos por si sus fotos siguen subidas en R2).
carpetas_actuales = {f["carpeta"] for f in fiestas}
for previa in existentes:
    if previa["carpeta"] not in carpetas_actuales:
        fiestas_merge.append(previa)


# --- Construimos SOLO el bloque del array `fiestas` ---------------------
bloque = "const fiestas = [\n\n"

for fiesta in fiestas_merge:
    bloque += "    {\n"
    bloque += f'        nombre: {json.dumps(fiesta["nombre"], ensure_ascii=False)},\n'
    bloque += f'        lugar: {json.dumps(fiesta["lugar"], ensure_ascii=False)},\n'
    bloque += f'        carpeta: {json.dumps(fiesta["carpeta"], ensure_ascii=False)},\n'
    bloque += "        fotos: [\n"

    for foto in fiesta["fotos"]:
        bloque += f'            {json.dumps(foto, ensure_ascii=False)},\n'

    bloque += "        ]\n"
    bloque += "    },\n"

bloque += "];"


# --- Reemplazamos solo ese bloque, conservando TODA la logica -------------
if os.path.isfile(ARCHIVO_JS):
    with open(ARCHIVO_JS, "r", encoding="utf-8") as archivo:
        original = archivo.read()
else:
    original = f'const R2_PUBLIC_URL = "{R2_PUBLIC_URL}";\n'

patron_array = re.compile(r"const\s+fiestas\s*=\s*\[.*?\n\];", re.DOTALL)

if patron_array.search(original):
    contenido = patron_array.sub(lambda _: bloque, original, count=1)
else:
    # No habia array: lo insertamos despues de R2_PUBLIC_URL o al principio.
    if "const R2_PUBLIC_URL" in original:
        contenido = original.replace(
            "const R2_PUBLIC_URL", bloque + "\n\nconst R2_PUBLIC_URL", 1
        )
    else:
        contenido = bloque + "\n\n" + original

with open(ARCHIVO_JS, "w", encoding="utf-8") as archivo:
    archivo.write(contenido)

print()
print(f"Galería generada correctamente: {len(fiestas_merge)} fiestas encontradas.")

for fiesta in fiestas_merge:
    print(f'- {fiesta["carpeta"]}: {len(fiesta["fotos"])} fotos')
