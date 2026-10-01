// ==========================================================
// npm run check  (segunda parte)
// Comprueba que las paginas HTML completas tienen los datos minimos
// de SEO/compartibilidad que se pueden verificar sin dominio:
//   - <h1>          (titulo visible del contenido)
//   - canonical     (rel="canonical", relativo a proposito: ver aviso-legal.html)
//   - og:title      (titulo al compartir)
//   - og:image      (imagen al compartir)
//
// NO comprueba og:url a proposito: 404.html y gracias.html lo omiten por
// diseno (se sirven en cualquier ruta / no deben difundirse). Ademas hoy es
// un placeholder a la espera del dominio (ver estructuraweb.md).
//
// Solo mira paginas COMPLETAS: los archivos que empiezan por <!DOCTYPE.
// paginas/ubicaciones.html es un FRAGMENTO que se incrusta en index.html
// (no lleva <head> ni <h1>), asi que se salta solo, sin lista aparte.
//
// Uso:  node scripts/check-html.mjs
// Sale con codigo 1 si a alguna pagina le falta algo.
// ==========================================================

import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

const RAIZ = process.cwd();

const IGNORAR = new Set([
    ".git",
    ".wrangler",
    "node_modules",
    ".vscode",
    "scripts",
    "fotos_para_subir"
]);

// Paginas que NO deben indexarse/compartirse: se exime de canonical y og:*.
// - 404.html (se sirve en cualquier ruta) y paginas/gracias.html (solo confirma
//   un envio) llevan <meta name="robots" content="noindex"> y lo omiten a proposito.
// - error-r2.html no es del sitio de Pages: es la pagina de error del bucket R2.
const NO_INDEXABLES = [
    /^404\.html$/,
    /^error-r2\.html$/,
    /^paginas[\\/]gracias\.html$/
];

function listar(carpeta, salida = []) {
    for (const entrada of readdirSync(carpeta, { withFileTypes: true })) {
        if (IGNORAR.has(entrada.name)) continue;
        const ruta = join(carpeta, entrada.name);
        if (entrada.isDirectory()) {
            listar(ruta, salida);
        } else if (/\.html$/i.test(entrada.name)) {
            salida.push(ruta);
        }
    }
    return salida;
}

const esNoIndexable = (rel) => NO_INDEXABLES.some((re) => re.test(rel));

const problemas = [];
let revisadas = 0;
let saltadas = 0;

for (const archivo of listar(RAIZ)) {
    const rel = relative(RAIZ, archivo).replace(/\\/g, "/");
    const contenido = readFileSync(archivo, "utf8");

    // Fragmentos incrustados (no empiezan por <!DOCTYPE): no son paginas.
    if (!/^\s*<!DOCTYPE/i.test(contenido)) {
        saltadas++;
        continue;
    }

    revisadas++;
    const exenta = esNoIndexable(rel);
    const faltan = [];

    if (!/<h1[\s>]/i.test(contenido)) faltan.push("<h1>");

    if (!exenta) {
        if (!/<link[^>]*rel=["']canonical["']/i.test(contenido)) faltan.push("canonical");
        if (!/<meta[^>]*property=["']og:title["']/i.test(contenido)) faltan.push("og:title");
        if (!/<meta[^>]*property=["']og:image["']/i.test(contenido)) faltan.push("og:image");
    }

    if (faltan.length) problemas.push({ rel, faltan });
}

console.log(`\nHTML: ${revisadas} pagina(s) completa(s) revisada(s), ${saltadas} fragmento(s) saltado(s).\n`);

if (problemas.length) {
    console.log("FALTAN DATOS:");
    for (const { rel, faltan } of problemas) {
        console.log(`  - ${rel}  ->  falta: ${faltan.join(", ")}`);
    }
    console.log(`\n${problemas.length} pagina(s) con datos incompletos.\n`);
    process.exit(1);
}

console.log("Todo OK: todas las paginas tienen <h1>, canonical, og:title y og:image.\n");
