# Claves y cuentas externas

> **Fuente de verdad:** la lista de trabajo y el detalle de cada pendiente viven en
> `estructuraweb.md` (local, en `.gitignore`). Este archivo es solo el recordatorio
> versionado de los sitios y pasos **externos** (paneles, claves, dominio), para que
> no se pierdan si no se tiene `estructuraweb.md` a mano. **Ninguna clave real aquí.**
>
> Si algo se contradice, manda `estructuraweb.md`. Al cerrar un punto allí, actualiza
> también aquí si toca.

## 1. Web3Forms (formulario de contacto) — PENDIENTE, importante

Estado actual: la `access_key` viaja en el HTML de `paginas/contacto.html`, así que
es pública. Cualquiera puede hacer POST a `api.web3forms.com/submit` con ella y
gastar las 250 peticiones gratuitas o llenar el correo de spam.

No se arregla ocultándola: en front-end siempre es visible.

Pasos, por orden:

1. Entrar en <https://web3forms.com> y **rotar la clave** (crear una nueva y
   borrar la vieja). Esto ya reduce el daño: la que está en el repositorio y en el
   historial de Git deja de servir.
2. En el panel de Web3Forms, activar la **restricción por dominio**. Ojo: pide el
   dominio final, así que este paso espera a tener dominio propio. Mientras tanto,
   la rotación sigue siendo lo más útil que se puede hacer hoy.
3. Sustituir el valor en `paginas/contacto.html`:
   <input type="hidden" name="access_key" value="LA_CLAVE_NUEVA">

4. (Más adelante) mover el envío a una Cloudflare Function que guarde la
   clave en una variable de entorno, para que no vuelva a estar en el HTML.

## 2. CARTO (mapa de salas) — PENDIENTE, depende del dominio

El mapa de `js/ubicaciones.js` usa las teselas de CARTO con una clave visible en
el JS (`cb1_3m00_1_1b3962c3a82510e00ca19739`). Riesgo menor (es una clave de
basemap público), pero conviene restringirla a vuestro dominio desde el panel de
CARTO en cuanto exista ese dominio. No hay nada que rotar hoy.

Se probó a sustituirla por las teselas públicas de OpenStreetMap, que no piden
clave, pero el mapa dejó de verse, así que se revirtió a CARTO.

## 3. Cloudflare R2 (fotos) — PENDIENTE, depende del dominio

El bucket `monocromatics-fotos` se sirve hoy por su URL de desarrollo
(`pub-*.r2.dev`), que Cloudflare puede limitar o cerrar. Cuando exista dominio:

1. Conectarlo al bucket:
   npx wrangler r2 bucket domain add monocromatics-fotos --domain media.TUDOMINIO

   Comprobado que hoy no hay ningún dominio conectado:
   npx wrangler r2 bucket domain list monocromatics-fotos

2. Cambiar la URL en **un solo sitio** y regenerar el resto:
   - `generar_galeria.py`, constante `R2_PUBLIC_URL` (línea ~42): al reescribir
     `js/galeria.js` y los apartados nuevos, propaga el valor.
   - Buscar y reemplazar en los HTML: `og:image`, `favicon`,
     `apple-touch-icon`, `preconnect` y las fotos sueltas de `index.html`.
   - `_headers`, dentro de `Content-Security-Policy` (`img-src`).
   - `manifest.webmanifest`, los dos iconos.

   Para encontrar todo de una vez: buscar `r2.dev` en el proyecto.

3. La página de error del bucket (si no, R2 devuelve XML). Ya está subida como
   `403.html`; para volver a subirla tras un cambio:
   npx wrangler r2 object put monocromatics-fotos/403.html --file=error-r2.html --remote --content-type="text/html; charset=utf-8"

## 4. Buscadores — PENDIENTE, depende del dominio

Cuando el sitio tenga dominio definitivo:

1. **Google Search Console** y **Cloudflare Web Analytics**: dar de alta el dominio
   y verificar la propiedad.
2. En `sitemap.xml` y `robots.txt`, sustituir el dominio. El bloque de URLs de los
   apartados lo repasa solo el script (`--html`) respetando el dominio que ya esté
   escrito; el resto de URLs hay que cambiarlo a mano con un buscar y reemplazar, y
   después enviar el sitemap desde Search Console.
3. `og:url` de cada página y el JSON-LD de `index.html`: cambiar el dominio cuando
   se sepa. Hoy es un placeholder.
4. Forzar HTTPS: se activa en Cloudflare al conectar el dominio.
5. Ficha de Google (Google Business Profile): opcional, para búsquedas locales.