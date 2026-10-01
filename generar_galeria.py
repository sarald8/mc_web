#!/usr/bin/env python3
"""Sube las fotos de `fotos_para_subir/` a Cloudflare R2 y actualiza `js/galeria.js`.

Uso:
    python generar_galeria.py                       # todas las carpetas
    python generar_galeria.py --solo-carpeta X      # solo la carpeta X
    python generar_galeria.py --no-subir            # no sube nada, solo reescribe el js
    python generar_galeria.py --html                # ademas genera/actualiza los apartados

Que hace exactamente:
  1. Lee las carpetas de `fotos_para_subir/` y las fotos que hay en cada una.
  2. Compara con lo que ya hay en R2 -> solo sube lo que falte.
  3. Hace merge con el array `fiestas` que ya existe en `js/galeria.js` (conserva los
     `nombre` y `lugar` editados a mano, no reordena las fotos previas).
  4. Reescribe SOLO el bloque `const fiestas = [...]`, dejando intacta la logica que va
     despues (grid, visor, filtro por data-carpeta).
  5. [--html] Genera paginas/galeria_apartadoN.html para las fiestas que no la tengan y
     actualiza las tarjetas de paginas/galeria.html.

IMPORTANTE: el paso 3 (escribir el js) se hace SIEMPRE, aunque falle alguna subida.
Si tres fotos no suben, las otras 197 quedan en R2 y el js se actualiza igual; las que
fallaron se avisan al final y solo se anuncian en la galeria las que SI subieron.
"""

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
from datetime import date

CARPETA_FOTOS = "fotos_para_subir"
ARCHIVO_JS = "js/galeria.js"
CARPETA_PAGINAS = "paginas"
ARCHIVO_GALERIA_HTML = os.path.join(CARPETA_PAGINAS, "galeria.html")
ARCHIVO_SITEMAP = "sitemap.xml"
BUCKET_R2 = "monocromatics-fotos"
RUTA_R2 = "imagenes/fiestas"
EXTENSIONES = (".jpg", ".jpeg", ".png", ".webp")

# Nombres que el sistema operativo y el editor dejan sueltos y que NO deben
# acabar en R2. Se ven en el explorador de Windows (sobre todo Thumbs.db, que
# se genera solo al abrir la carpeta) y no son fotos de ninguna fiesta.
ARCHIVOS_IGNORADOS = {"thumbs.db", "desktop.ini", ".ds_store"}


def es_foto(ruta_completa):
    '''True si el archivo es una foto que queremos subir.

    Ademas de la extension, descarta basura de sistema que si no se subiria a R2
    y quedaria ahi para siempre (el script no borra objetos de R2).
    '''
    if not ruta_completa.lower().endswith(EXTENSIONES):
        return False
    return os.path.basename(ruta_completa).lower() not in ARCHIVOS_IGNORADOS


# URL publica del bucket R2 (dashboard -> R2 -> monocromatics-fotos -> Public access)
R2_PUBLIC_URL = "https://pub-196ffc8ef6544a1a83073be29e5a331f.r2.dev"

# En Windows npx es npx.cmd; shutil.which resuelve la ruta real dentro del PATH
# para poder invocarlo con shell=False (lista de argumentos).
NPX = shutil.which("npx") or "npx"


# ==========================================================
# LECTURA DEL ESTADO ACTUAL
# ==========================================================

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


def leer_fotos_en_r2(carpeta_r2):
    '''Pregunta a R2 que archivos hay ya en `carpeta_r2`.

    Devuelve un set con los nombres de archivo. Si la consulta falla (sin red,
    sin sesion de wrangler, bucket vacio) devuelve un set vacio, y entonces el
    programa sube todo como antes: nunca se queda peor que la version previa.
    '''
    destino = f"{BUCKET_R2}/{carpeta_r2}"
    prefijo = f"{carpeta_r2}/"

    comando = [NPX, "wrangler", "r2", "object", "get", destino, "--remote"]

    # `wrangler r2 object get` sobre un prefijo (sin --file) LISTA el prefijo en
    # lugar de descargar. Con check=False, un fallo no rompe el script.
    resultado = subprocess.run(
        comando,
        check=False,
        shell=False,
        capture_output=True,
        text=True,
    )

    if resultado.returncode != 0:
        return set()

    nombres = set()
    for linea in (resultado.stdout or "").splitlines():
        linea = linea.strip()
        if prefijo not in linea:
            continue
        candidato = linea.rsplit("/", 1)[-1].strip()
        if candidato and "." in candidato:
            nombres.add(candidato)

    return nombres


# ==========================================================
# SUBIDA A R2
# ==========================================================

def subir_a_r2(carpeta_local, carpeta_r2, fotos, ya_en_r2):
    '''Sube a R2 solo las fotos que falten.

    Devuelve dos listas: las fotos que SI acabaron en R2 y las que fallaron.
    Ya no llama a sys.exit: un fallo se acumula y el programa sigue, porque
    escribir el js es responsabilidad suya y no debe depender de esto.
    '''
    subidas = []
    fallos = []
    saltadas = 0

    for foto in fotos:
        if foto in ya_en_r2:
            saltadas += 1
            subidas.append(foto)
            continue

        origen = os.path.join(carpeta_local, foto)
        destino = f"{BUCKET_R2}/{carpeta_r2}/{foto}"
        print(f"  Subiendo: {origen} -> {destino}")

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
            print(f"  ERROR: no se pudo subir {foto} a R2.")
            fallos.append(foto)
        else:
            subidas.append(foto)

    if saltadas:
        print(f"  ({saltadas} fotos ya estaban en R2, no se han vuelto a subir)")

    return subidas, fallos


# ==========================================================
# GENERACION DEL HTML (--html)
# ==========================================================

PLANTILLA_APARTADO = '''<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Galeria · {nombre} · Monocromatics</title>
    <meta name="description" content="{descripcion}">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="Monocromatics">
    <meta property="og:locale" content="es_ES">
    <meta property="og:title" content="Galeria · {nombre} · Monocromatics">
    <meta property="og:description" content="{descripcion}">
    <meta property="og:image" content="{r2}/imagenes/logos/logo_blanco.png">
    <meta property="og:image:width" content="714">
    <meta property="og:image:height" content="680">
    <meta property="og:image:alt" content="Logo de Monocromatics">
    <meta name="twitter:card" content="summary_large_image">

    <!-- Canonical relativo (ver comentario en /paginas/aviso-legal.html) -->
    <link rel="canonical" href="/paginas/galeria_apartado{n}.html">
    <link rel="preconnect" href="{r2}" crossorigin>
    <link rel="stylesheet" href="../css/base.css">
    <link rel="stylesheet" href="../css/header.css">
    <link rel="stylesheet" href="../css/footer.css">
    <link rel="stylesheet" href="../css/galeria.css">
    <link rel="stylesheet" href="../css/responsive.css">
    <link rel="icon" type="image/png" href="{r2}/imagenes/logos/logo_blanco.png">
    <link rel="apple-touch-icon" href="{r2}/imagenes/logos/logo_morado_oscuro.jpg">
    <link rel="manifest" href="../manifest.webmanifest">
    <meta name="theme-color" content="#0b0710">
</head>

<body>

    <header class="header-simple">
        <a href="galeria.html" class="button">VOLVER</a>
        <h1>GALERIA</h1>
    </header>

    <main>
        <!-- El valor de data-carpeta es la CARPETA de la fiesta (el identificador
             estable de galeria.js), no el nombre visible. -->
        <div id="fiestas-galeria" data-carpeta="{carpeta}"></div>
    </main>

    <footer>
        <div class="footer-logo">
            <img src="../imagenes/logos/logo_morado_oscuro.jpg" alt="Monocromatics" width="65" height="65" loading="lazy" decoding="async">
        </div>

        <div class="footer-links">
            <a href="https://x.com/monocromatics1" target="_blank" rel="noopener noreferrer">X / Twitter</a>
            <a href="https://www.instagram.com/monocromatics1/" target="_blank" rel="noopener noreferrer">Instagram</a>
            <a href="https://www.tiktok.com/@monocromatics1" target="_blank" rel="noopener noreferrer">TikTok</a>
        </div>

        <div class="footer-legal">
            <a href="aviso-legal.html">Aviso legal</a>
            <a href="politica-privacidad.html">Politica de privacidad</a>
            <a href="aviso-cookies.html">Aviso de cookies</a>
        </div>

        <p>GALICIA UNDER ZONE</p>
        <p>© 2026 MONOCROMATICS</p>
    </footer>

    <script src="../js/galeria.js"></script>
</body>
</html>
'''


# Bloques del HTML de la galeria. Trabajamos con la cadena literal inicial y final
# en vez de una regex, porque el interior (indentacion, lineas en blanco) no es
# constante y una regex acababa comiendose o duplicando saltos de linea.
APERTURA_MENU = '<div class="galeria-menu">\n'
CIERRE_MENU = '\n            </div>'


def descripcion_por_defecto(nombre, lugar):
    '''Texto de <meta description> para un apartado generado automaticamente.'''
    if lugar:
        return (f"Fotos de la fiesta {nombre} de Monocromatics: musica urbana underground "
                f"en {lugar}. Entra y revívela en nuestra galeria.")
    return (f"Fotos de la fiesta {nombre} de Monocromatics: musica urbana underground "
            f"en Galicia. Entra y revívela en nuestra galeria.")


def apartados_en_disco():
    '''Devuelve {numero: data-carpeta} leyendo los galeria_apartadoN.html existentes.

    El numero solo decide el nombre del archivo. Lo que de verdad ata un apartado a
    su fiesta es el `data-carpeta`, y ese valor se compara en galeria.js contra la
    CARPETA y contra el NOMBRE de cada fiesta: da igual cual de los dos se haya
    escrito, asi que cambiar el nombre visible de una fiesta no rompe su apartado.

    Se usa sobre todo para AYUDAR: si una fiesta tiene apartado pero le falta la
    tarjeta, se recupera su numero de aqui.
    '''
    resultado = {}

    if not os.path.isdir(CARPETA_PAGINAS):
        return resultado

    for nombre in os.listdir(CARPETA_PAGINAS):
        coincidencia = re.fullmatch(r"galeria_apartado(\d+)\.html", nombre)
        if not coincidencia:
            continue

        ruta = os.path.join(CARPETA_PAGINAS, nombre)
        with open(ruta, "r", encoding="utf-8") as archivo:
            contenido = archivo.read()

        campo = re.search(r'id="fiestas-galeria"\s+data-carpeta="([^"]*)"', contenido)
        if campo:
            resultado[int(coincidencia.group(1))] = campo.group(1)

    return resultado


def tarjetas_actuales():
    '''Lee de paginas/galeria.html la lista [(nombre, target), ...] EN SU ORDEN ACTUAL.

    Es lo que fija el orden de las tarjetas y del array `fiestas`. Se lee del
    propio HTML a proposito: asi el script nunca reordena nada por su cuenta y
    la web no cambia de aspecto cada vez que se ejecuta.
    '''
    if not os.path.isfile(ARCHIVO_GALERIA_HTML):
        return []

    with open(ARCHIVO_GALERIA_HTML, "r", encoding="utf-8") as archivo:
        contenido = archivo.read()

    inicio = contenido.find(APERTURA_MENU)
    fin = contenido.find(CIERRE_MENU, inicio)

    if inicio == -1 or fin == -1:
        return []

    interior = contenido[inicio + len(APERTURA_MENU):fin]

    tarjetas = []
    patron = re.compile(
        r'<a\s+href="([^"]+)"[^>]*>\s*<h3>(.*?)</h3>', re.DOTALL
    )

    for objetivo, nombre in patron.findall(interior):
        tarjetas.append((nombre.strip(), objetivo.strip()))

    return tarjetas


def ordenar_fiestas(fiestas_merge, tarjetas_previas, apartados_previos):
    '''Ordena `fiestas_merge` segun el orden de las tarjetas de galeria.html.

    Las fiestas ya listadas se quedan donde estaban (y si les falta el apartado,
    se les asigna el numero que ya apunta su tarjeta). Las nuevas desaparecidas
    del HTML van al principio, que es donde tiene sentido una fiesta recien
    subida, y su tarjeta pasa a ser la marcada con data-activo="true".

    Devuelve (fiestas_ordenadas, {carpeta: numero_apartado}, carpetas_nuevas).
    '''
    por_nombre = {fiesta["nombre"]: fiesta for fiesta in fiestas_merge}

    ordenadas = []
    asignados_previos = {}
    usados = set()

    for nombre, objetivo in tarjetas_previas:
        fiesta = por_nombre.get(nombre)
        if not fiesta or fiesta in ordenadas:
            continue

        ordenadas.append(fiesta)

        numero = re.fullmatch(r"galeria_apartado(\d+)\.html", objetivo)
        if numero:
            asignados_previos[fiesta["carpeta"]] = int(numero.group(1))
            usados.add(int(numero.group(1)))

    nuevas = [f for f in fiestas_merge if f not in ordenadas]
    faltantes = {f["carpeta"] for f in nuevas}
    ordenadas = nuevas + ordenadas

    # Una fiesta puede tener apartado pero no tarjeta (le falta solo la tarjeta).
    # Se lo recuperamos por data-carpeta en lugar de darle un numero nuevo, para
    # no dejar apartados huerfanos por ahi.
    for fiesta in ordenadas:
        if fiesta["carpeta"] in asignados_previos:
            continue
        for numero, data_carpeta in apartados_previos.items():
            if data_carpeta == fiesta["nombre"] and numero not in usados:
                asignados_previos[fiesta["carpeta"]] = numero
                usados.add(numero)
                break

    # Numero para las que no tenian ni tarjeta ni apartado: el primer hueco libre.
    siguiente = 1
    for fiesta in ordenadas:
        if fiesta["carpeta"] in asignados_previos:
            continue
        while siguiente in usados:
            siguiente += 1
        asignados_previos[fiesta["carpeta"]] = siguiente
        usados.add(siguiente)

    return ordenadas, asignados_previos, faltantes


def generar_apartados_html(fiestas_ordenadas, asignados, carpetas_nuevas):
    '''Crea paginas/galeria_apartadoN.html para las fiestas que no tengan una.

    NUNCA sobrescribe un apartado que ya exista: si lo has editado a mano, se
    respeta (los apartados manuales llevan acentos y textos mejores).
    Devuelve la lista de archivos creados.
    '''
    if not os.path.isdir(CARPETA_PAGINAS):
        print(f"  AVISO: no existe {CARPETA_PAGINAS}/, no genero apartados.")
        return []

    creados = []

    for fiesta in fiestas_ordenadas:
        numero = asignados[fiesta["carpeta"]]
        archivo = f"galeria_apartado{numero}.html"
        destino = os.path.join(CARPETA_PAGINAS, archivo)

        if os.path.isfile(destino):
            continue

        contenido = PLANTILLA_APARTADO.format(
            n=numero,
            nombre=fiesta["nombre"],
            carpeta=fiesta["carpeta"],
            descripcion=descripcion_por_defecto(fiesta["nombre"], fiesta.get("lugar", "")),
            r2=R2_PUBLIC_URL,
        )

        with open(destino, "w", encoding="utf-8") as archivo_html:
            archivo_html.write(contenido)

        # Si la fiesta es nueva y le falta el apartado, se crea aqui mismo ya
        # sale un nombre y una descripcion decentes. Si es una fiesta antigua a
        # la que le faltaba el apartado, mejor crearla a mano con texto propio.
        aviso = (
            "  <-- es una fiesta ya existente: revisa el texto"
            if fiesta["carpeta"] not in carpetas_nuevas
            else ""
        )

        print(f"  Creado paginas/{archivo} ({fiesta['nombre']}){aviso}")
        creados.append(archivo)

    if not creados:
        print("  Todos los apartados ya existian, no hay nada que crear.")

    return creados


def reparar_apartados(fiestas_ordenadas, asignados):
    '''Corrige el `data-carpeta` de los apartados que apunten a una fiesta inexistente.

    Solo reescribe ese atributo, sin tocar nada mas del archivo. Es la red de
    seguridad contra el fallo que hubo: los `data-carpeta` se quedaron con valores
    viejos mientras las tarjetas se renumeraban, y cada tarjeta acababa abriendo
    las fotos de otra fiesta.

    Devuelve la lista de archivos corregidos.
    '''
    # Todo valor por el que una fiesta puede ser encontrada, en minusculas.
    validos = set()
    for fiesta in fiestas_ordenadas:
        validos.add(fiesta["carpeta"].strip().lower())
        if fiesta["nombre"]:
            validos.add(fiesta["nombre"].strip().lower())

    corregidos = []

    for fiesta in fiestas_ordenadas:
        numero = asignados[fiesta["carpeta"]]
        destino = os.path.join(CARPETA_PAGINAS, f"galeria_apartado{numero}.html")

        if not os.path.isfile(destino):
            continue

        with open(destino, "r", encoding="utf-8") as archivo:
            contenido = archivo.read()

        campo = re.search(
            r'(id="fiestas-galeria"\s+data-carpeta=")[^"]*(")', contenido
        )
        if not campo:
            print(f"  AVISO: {destino} no tiene data-carpeta, no lo toco.")
            continue

        actual = campo.group(0)
        actual = re.search(r'data-carpeta="([^"]*)"', actual).group(1)

        if actual.strip().lower() in validos:
            continue

        contenido = (
            contenido[:campo.start()]
            + f'{campo.group(1)}{fiesta["carpeta"]}{campo.group(2)}'
            + contenido[campo.end():]
        )

        with open(destino, "w", encoding="utf-8") as archivo:
            archivo.write(contenido)

        print(
            f"  Corregido data-carpeta de {os.path.basename(destino)}: "
            f"'{actual}' -> '{fiesta['carpeta']}'"
        )
        corregidos.append(destino)

    if not corregidos:
        print("  Ningun apartado tenia el data-carpeta mal, no hay nada que corregir.")

    return corregidos


def actualizar_tarjetas_galeria(fiestas_ordenadas, asignados, carpetas_nuevas):
    '''Reescribe el bloque de tarjetas de paginas/galeria.html.

    Solo toca lo que hay DENTRO de <div class="galeria-menu"> ... </div>: el
    resto de la pagina (header, footer, resto del contenido) se deja tal cual.
    Como el orden lo dicta el propio HTML (ver `tarjetas_actuales`), las tarjetas
    ya existentes se quedan exactamente donde estaban.
    Devuelve True si se pudo actualizar.
    '''
    if not os.path.isfile(ARCHIVO_GALERIA_HTML):
        print(f"  AVISO: no existe {ARCHIVO_GALERIA_HTML}, no toco las tarjetas.")
        return False

    with open(ARCHIVO_GALERIA_HTML, "r", encoding="utf-8") as archivo:
        original = archivo.read()

    inicio = original.find(APERTURA_MENU)
    fin = original.find(CIERRE_MENU, inicio)

    if inicio == -1 or fin == -1:
        print('  AVISO: no encuentro <div class="galeria-menu">, no toco las tarjetas.')
        return False

    # El bloque se reescribe entero pero con formato fijo: el interior queda con
    # una linea por tarjeta y sin espacios sueltos, asi ejecutar dos veces seguidas
    # da exactamente el mismo archivo.
    lineas = []
    for indice, fiesta in enumerate(fiestas_ordenadas):
        numero = asignados[fiesta["carpeta"]]
        # Solo la PRIMERA fiesta no listada antes se marca como la mas reciente:
        # si marcasemos todas las nuevas, saldrian varias tarjetas destacadas.
        es_nueva_destacada = indice == 0 and fiesta["carpeta"] in carpetas_nuevas
        marca = ' data-activo="true"' if es_nueva_destacada else ""
        lineas.append(
            f'                <a href="galeria_apartado{numero}.html" '
            f'class="galeria-card"{marca}>\n'
            f'                    <h3>{fiesta["nombre"]}</h3>\n'
            f'                    <!--<p>Fotos de Monocromatics</p>-->\n'
            f'                </a>\n'
        )

    contenido = (
        original[:inicio + len(APERTURA_MENU)]
        + "".join(lineas)
        + "\n"
        + original[fin + 1:]
    )

    with open(ARCHIVO_GALERIA_HTML, "w", encoding="utf-8") as archivo:
        archivo.write(contenido)

    print(f"  Reescritas {len(fiestas_ordenadas)} tarjetas en {ARCHIVO_GALERIA_HTML}")
    return True


def fecha_carpeta(carpeta):
    '''Fecha de ultima modificacion de la carpeta de la fiesta, en formato ISO.

    Es lo que se escribe como <lastmod> en el sitemap: no es perfecto (la marca
    la pone el sistema de archivos, no la fecha del evento), pero es una senal
    real y estable de "esto se ha tocado". Si la carpeta no existiera, se usa
    la fecha de hoy para no dejar el campo vacio.
    '''
    ruta = os.path.join(CARPETA_FOTOS, carpeta)
    try:
        return date.fromtimestamp(os.path.getmtime(ruta)).isoformat()
    except OSError:
        return date.today().isoformat()


def actualizar_sitemap(fiestas_ordenadas, asignados):
    '''Apunta el sitemap a los apartados que existen de verdad.

    Un sitemap puede apuntar a TODAS las URLs del sitio. Si una entra y devuelve
    404, Search Console la marca como error en lugar de ignorarla, asi que aqui
    sobra: al anadir o quitar fiestas, este bloque de URLs se recalcula solo.

    Respeta el dominio que ya hubiera escrito (`https://.../paginas/x.html`) y
    solo cambia la parte final; el dia que se compre el dominio, un buscar y
    reemplazar en sitemap.xml y listo. No toca las URLs que no son de apartados
    (home, contacto, legales...).

    Devuelve la lista de apartados que estan en el sitemap y ya no existen.
    '''
    if not os.path.isfile(ARCHIVO_SITEMAP):
        print(f"  AVISO: no existe {ARCHIVO_SITEMAP}, no lo toco.")
        return []

    with open(ARCHIVO_SITEMAP, "r", encoding="utf-8") as archivo:
        contenido = archivo.read()

    # Los que el sitemap menciona y no corresponden a ninguna fiesta actual.
    presentes = {int(m) for m in re.findall(r"galeria_apartado(\d+)\.html", contenido)}
    validos = {asignados[fiesta["carpeta"]] for fiesta in fiestas_ordenadas}
    huerfanos = sorted(presentes - validos)

    # El dominio se lee de una URL de apartado ya escrita, para no tenerlo
    # duplicado en dos sitios del proyecto. Sin dominio no podemos reconstruir
    # las URLs, asi que se avisa y no se toca nada.
    previa = re.search(r"<loc>(https?://[^<]*?)galeria_apartado\d+\.html</loc>", contenido)
    if previa:
        # Se corta en "/paginas" para quedarnos solo con el dominio: la carpeta
        # forma parte de la ruta que escribimos despues.
        dominio = re.sub(r"/[^/]*$", "", previa.group(1).rstrip("/"))
    else:
        otra = re.search(r"<loc>(https?://[^<]+)</loc>", contenido)
        dominio = otra.group(1).rstrip("/") if otra else ""

    if not dominio:
        print(f"  AVISO: no encuentro ninguna URL en {ARCHIVO_SITEMAP}, no lo toco.")
        return huerfanos

    bloques = []
    for fiesta in fiestas_ordenadas:
        numero = asignados[fiesta["carpeta"]]
        bloques.append(
            "  <url>\n"
            f"    <loc>{dominio}/paginas/galeria_apartado{numero}.html</loc>\n"
            f"    <lastmod>{fecha_carpeta(fiesta['carpeta'])}</lastmod>\n"
            "    <changefreq>yearly</changefreq>\n"
            "    <priority>0.5</priority>\n"
            "  </url>"
        )
    bloque_nuevo = "\n".join(bloques)

    # Cada <url> ocupa varias lineas, asi que hay que aceptar saltos de linea
    # DENTRO del bloque: de ahi el non-greedy con DOTALL. El (\s*) de delante se
    # come la linea en blanco o la indentacion que quede tras la eliminacion.
    patron = re.compile(
        r"\s*<url>\s*<loc>[^<]*?galeria_apartado\d+\.html</loc>.*?</url>",
        re.DOTALL,
    )

    if patron.search(contenido):
        contenido_nuevo = patron.sub(lambda _: "", contenido).replace(
            "\n</urlset>", "\n" + bloque_nuevo + "\n</urlset>", 1
        )
    else:
        # No hay ni un apartado en el sitemap: se anaden todos antes de </urlset>.
        contenido_nuevo = contenido.replace(
            "</urlset>", bloque_nuevo + "\n</urlset>", 1
        )

    if contenido_nuevo == contenido:
        print(
            f"  {ARCHIVO_SITEMAP} ya estaba correcto ({len(validos)} apartados), no lo toco."
        )
        return huerfanos

    with open(ARCHIVO_SITEMAP, "w", encoding="utf-8") as archivo:
        archivo.write(contenido_nuevo)

    print(
        f"  {ARCHIVO_SITEMAP}: {len(validos)} apartados enlazados "
        f"(dominio {dominio})."
    )
    return huerfanos


# ==========================================================
# PROGRAMA PRINCIPAL
# ==========================================================

def main():
    parser = argparse.ArgumentParser(
        description="Sube fotos a R2 y actualiza js/galeria.js (y opcionalmente el HTML).",
    )
    parser.add_argument(
        "--solo-carpeta",
        metavar="NOMBRE",
        help="Procesa unicamente esa carpeta de fotos_para_subir/ (no toca las demas).",
    )
    parser.add_argument(
        "--no-subir",
        action="store_true",
        help="No sube nada a R2: solo lee las carpetas y reescribe el js/HTML.",
    )
    parser.add_argument(
        "--html",
        action="store_true",
        help="Ademas, crea los galeria_apartadoN.html que falten y las tarjetas de galeria.html.",
    )
    args = parser.parse_args()

    # El error mas habitual con diferencia: ejecutar el script desde otra carpeta
    # (por ejemplo desde C:\Users\Usuario). Todo son rutas relativas, asi que hay
    # que decir claramente DONDE se esta buscando y como arreglarlo.
    if not os.path.isdir(CARPETA_FOTOS):
        print(f"ERROR: no encuentro '{CARPETA_FOTOS}/'.")
        print(f"Ahora mismo estoy buscando en: {os.getcwd()}")
        print()
        print("Suele pasar por ejecutar el script desde otra carpeta. Situeate primero")
        print("en la raiz del proyecto:")
        print()
        print("    cd E:\\0monocromatics")
        print("    python generar_galeria.py --solo-carpeta NOMBRE --html")
        return 1

    # --- 1. Que carpetas hay que procesar ---------------------------------
    carpetas = sorted(
        nombre for nombre in os.listdir(CARPETA_FOTOS)
        if os.path.isdir(os.path.join(CARPETA_FOTOS, nombre))
    )

    if args.solo_carpeta:
        pedida = args.solo_carpeta

        # Si han pasado una RUTA en vez de un nombre, nos quedamos con el ultimo
        # trozo. Es un error facil de cometer y no hay motivo para no ser amable.
        # (Pero no se admite acabar en '\\', que en Windows no distingue entre
        # 'carpeta' y 'carpeta\', asi que hay que limpiarlo antes.)
        ruta_limpia = os.path.normpath(pedida)
        if os.sep in ruta_limpia or pedida != os.path.basename(pedida):
            posible = os.path.basename(ruta_limpia)
            if posible in carpetas:
                print(f"NOTA: has pasado una ruta; uso el nombre '{posible}'.")
                print(f"      La proxima vez basta con: --solo-carpeta {posible}")
                print()
                pedida = posible

        if pedida not in carpetas:
            print(f"ERROR: '{pedida}' no esta en {CARPETA_FOTOS}/.")
            print(f"Ahora mismo estoy buscando en: {os.getcwd()}")
            print()
            if carpetas:
                print("Carpetas disponibles (hay que copiar el nombre EXACTO):")
                for nombre in carpetas:
                    print(f"  - {nombre}")
            else:
                print(f"'{CARPETA_FOTOS}/' esta vacia: no hay ninguna carpeta dentro.")
            return 1

        carpetas = [pedida]

    if not carpetas:
        print(f"No hay ninguna carpeta dentro de {CARPETA_FOTOS}/.")
        return 1

    print(f"Carpetas a procesar: {len(carpetas)}")
    for nombre in carpetas:
        print(f"  - {nombre}")
    print()

    # --- 2. Leer fotos de disco -------------------------------------------
    fiestas = []
    for carpeta in carpetas:
        ruta = os.path.join(CARPETA_FOTOS, carpeta)

        fotos = sorted(
            archivo for archivo in os.listdir(ruta)
            if es_foto(os.path.join(ruta, archivo))
        )

        if not fotos:
            print(f"AVISO: {carpeta}/ no tiene fotos con extension valida, se salta.")
            continue

        fiestas.append({
            "nombre": carpeta.replace("-", " ").upper(),
            "lugar": "",
            "carpeta": carpeta,
            "fotos": fotos,
        })

    if not fiestas:
        print("No hay fotos que procesar.")
        return 1

    # --- 3. Subir a R2 (solo lo que falte) --------------------------------
    subidas_por_carpeta = {}
    fallos_por_carpeta = {}

    for fiesta in fiestas:
        carpeta = fiesta["carpeta"]
        ruta_r2 = f"{RUTA_R2}/{carpeta}"

        print(f"[{carpeta}] {len(fiesta['fotos'])} fotos en disco")

        if args.no_subir:
            print("  --no-subir: se omite la subida.")
            subidas_por_carpeta[carpeta] = list(fiesta["fotos"])
            fallos_por_carpeta[carpeta] = []
            continue

        ya_en_r2 = leer_fotos_en_r2(ruta_r2)
        if ya_en_r2:
            print(f"  R2 ya tiene {len(ya_en_r2)} archivos en {ruta_r2}/")
        else:
            print(f"  No se pudo listar {ruta_r2}/ (o esta vacia): se intenta subir todo.")

        subidas, fallos = subir_a_r2(
            os.path.join(CARPETA_FOTOS, carpeta),
            ruta_r2,
            fiesta["fotos"],
            ya_en_r2,
        )

        subidas_por_carpeta[carpeta] = subidas
        fallos_por_carpeta[carpeta] = fallos
        print()

    # --- 4. Merge con lo que ya hay en galeria.js -------------------------
    existentes = leer_fiestas_existentes(ARCHIVO_JS)
    por_carpeta = {f["carpeta"]: f for f in existentes}

    fiestas_actualizadas = []

    for fiesta in fiestas:
        previa = por_carpeta.get(fiesta["carpeta"])
        # Solo anunciamos en la galeria las fotos que estan de verdad en R2:
        # asi una subida fallida no deja imagenes rotas en la web.
        fotos_ok = subidas_por_carpeta.get(fiesta["carpeta"], [])

        if previa:
            # Conservamos nombre y lugar ya editados a mano; actualizamos fotos
            # (las del disco, que pueden traer nuevas) sin perder el orden previo.
            fiesta["nombre"] = previa["nombre"] or fiesta["nombre"]
            fiesta["lugar"] = previa["lugar"]

            fotos_previas = list(previa.get("fotos", []))
            fotos_nuevas = [f for f in fotos_ok if f not in fotos_previas]
            fiesta["fotos"] = fotos_previas + fotos_nuevas
        else:
            fiesta["fotos"] = fotos_ok

        fiestas_actualizadas.append(fiesta)

    # Conservamos tambien fiestas que ya estaban en el archivo pero cuya carpeta
    # no se esta procesando ahora (no las borramos por si sus fotos siguen en R2).
    carpetas_procesadas = {f["carpeta"] for f in fiestas}
    for previa in existentes:
        if previa["carpeta"] not in carpetas_procesadas:
            fiestas_actualizadas.append(previa)

    # AVISO IMPORTANTE cuando se usa --solo-carpeta. Las fiestas que no se estan
    # procesando se conservan leyendolas de `galeria.js`, y `galeria.js` solo las
    # tiene si en su dia se ejecuto el script SIN --solo-carpeta. Si alguien anadio
    # una fiesta (o un apartado) a mano y luego ejecuta el script con --solo-carpeta,
    # su tarjeta puede desaparecer de galeria.html. Se avisa antes de tocar nada.
    if args.solo_carpeta:
        huerfanos = [
            previa for previa in existentes
            if previa["carpeta"] not in carpetas_procesadas
            and previa["nombre"] not in {f["nombre"] for f in fiestas_actualizadas}
        ]
        if huerfanos:
            print("AVISO: con --solo-carpeta, estas fiestas de galeria.js no se estan")
            print("       procesando y por tanto NO se reescriben sus tarjetas:")
            for fiesta in huerfanos:
                print(f"         - {fiesta['nombre']} ({fiesta['carpeta']})")
            print("       Si desaparece alguna tarjeta, ejecuta SIN --solo-carpeta.")
            print()

    # --- 4b. Orden: lo dicta paginas/galeria.html -------------------------
    # Sin esto, ejecutar con --solo-carpeta reordenaria el array y las tarjetas
    # de la web saltarian de sitio (lo detectamos probandolo). El orden se lee
    # del HTML, que es la fuente de verdad, y el script solo anade lo nuevo
    # al principio.
    tarjetas_previas = tarjetas_actuales()
    fiestas_merge, asignados, carpetas_nuevas = ordenar_fiestas(
        fiestas_actualizadas, tarjetas_previas, apartados_en_disco()
    )

    if args.html and tarjetas_previas:
        # Una fiesta que tenga apartado pero no estuviera en las tarjetas significa
        # que falta la tarjeta, no el apartado: se avisa para que se vea claro.
        anteriormente_listadas = {nombre for nombre, _ in tarjetas_previas}
        for fiesta in fiestas_merge:
            if fiesta["nombre"] in anteriormente_listadas:
                continue
            if os.path.isfile(os.path.join(
                CARPETA_PAGINAS, f"galeria_apartado{asignados[fiesta['carpeta']]}.html"
            )):
                print(
                    f"  NOTA: '{fiesta['nombre']}' tenia apartado pero le faltaba la "
                    f"tarjeta en galeria.html; se recupera."
                )

    # --- 5. Escribir el array `fiestas` -----------------------------------
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

    # --- 6. HTML (opcional) ------------------------------------------------
    if args.html:
        print()
        print("--- HTML ---")
        # Reparar ANTES de nada: si un apartado apunta a una fiesta que no existe
        # (o que ya no se llama asi), corregirlo primero evita que el resto de
        # comprobaciones tomen decisiones basadas en datos malos.
        reparar_apartados(fiestas_merge, asignados)
        generar_apartados_html(fiestas_merge, asignados, carpetas_nuevas)
        actualizar_tarjetas_galeria(fiestas_merge, asignados, carpetas_nuevas)
        huerfanos = actualizar_sitemap(fiestas_merge, asignados)
        for numero in huerfanos:
            print(
                f"  OJO: el sitemap apuntaba a paginas/galeria_apartado{numero}.html,\n"
                f"       que ya no corresponde a ninguna fiesta. Quitala de la web si\n"
                f"       sigue existiendo (este script no borra archivos)."
            )

    # --- 7. Resumen --------------------------------------------------------
    print()
    print(f"js/galeria.js actualizado: {len(fiestas_merge)} fiestas en total.")
    for fiesta in fiestas_merge:
        fallos = fallos_por_carpeta.get(fiesta["carpeta"], [])
        aviso = f"  <-- {len(fallos)} FOTOS FALLIDAS" if fallos else ""
        print(f'- {fiesta["carpeta"]}: {len(fiesta["fotos"])} fotos{aviso}')

    if any(fallos_por_carpeta.values()):
        print()
        print("FOTOS QUE NO SE PUDIERON SUBIR (vuelve a ejecutar el script):")
        for carpeta, fallos in fallos_por_carpeta.items():
            for foto in fallos:
                print(f"  - {carpeta}/{foto}")
        return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())