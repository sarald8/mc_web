// ==========================================================
// npm run check
// Revisa que todos los src/href LOCALES del sitio existan en disco.
// (Punto 50 de estructuraweb.md)
//
// Uso:  npm run check
// Sale con codigo 1 si encuentra algo roto, para poder usarlo en CI.
// ==========================================================

import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, dirname, resolve, relative, isAbsolute } from "node:path";

const RAIZ = process.cwd();

// Carpetas que no forman parte del sitio publicado.
const IGNORAR = new Set([
    ".git",
    ".wrangler",
    "node_modules",
    ".vscode",
    "scripts",
    "fotos_para_subir"
]);

// Esquemas/protocolos que NO son rutas locales.
const EXTERNO = /^(https?:|mailto:|tel:|data:|javascript:|#|\/\/)/i;

// Solo comprobamos estas extensiones como "archivo".
// El resto (sin extension) se trata como posible ruta de Cloudflare Pages.
const CON_EXTENSION = /\.[a-z0-9]{2,5}$/i;

function listar(archivo, salida = []) {
    for (const entrada of readdirSync(archivo, { withFileTypes: true })) {
        if (IGNORAR.has(entrada.name)) continue;

        const ruta = join(archivo, entrada.name);

        if (entrada.isDirectory()) {
            listar(ruta, salida);
        } else {
            salida.push(ruta);
        }
    }
    return salida;
}

// Los atributos se leen con un solo regex: src=, href= y poster=.
const ATRIBUTOS = /\b(?:src|href|poster)\s*=\s*["']([^"']+)["']/gi;

const problemas = [];
const advertidos = [];
let comprobados = 0;

const archivos = listar(RAIZ).filter((f) => /\.(html|css|js)$/i.test(f));

for (const archivo of archivos) {
    const contenido = readFileSync(archivo, "utf8");
    const carpeta = dirname(archivo);

    for (const [, valor] of contenido.matchAll(ATRIBUTOS)) {
        const limpio = valor.trim();

        if (!limpio || EXTERNO.test(limpio)) continue;

        // Quitamos hash, query y restos de plantilla de JS.
        const sinQuery = limpio.split("#")[0].split("?")[0];
        if (!sinQuery || sinQuery.includes("${") || sinQuery.includes("+")) continue;

        // Las rutas que empiezan por "/" son absolutas desde la raiz del sitio,
        // no desde el archivo. Es el caso de los <link rel="canonical">, que a
        // proposito se escriben asi para no depender del dominio.
        const destino = sinQuery.startsWith("/")
            ? resolve(RAIZ, sinQuery.slice(1))
            : resolve(carpeta, sinQuery);
        comprobados++;

        if (existsSync(destino)) continue;

        // Caso especial: 404.html se sirve desde CUALQUIER ruta, asi que una
        // ruta relativa puede no existir segun donde caiga la URL. Solo se avisa.
        const es404 = relative(RAIZ, archivo).replace(/\\/g, "/") === "404.html";

        if (!CON_EXTENSION.test(sinQuery) && !es404) {
            // Sin extension: puede ser una ruta bonita de Cloudflare Pages
            // resuelta por _redirects. Lo resolvemos a mano.
            const candidatos = [
                join(RAIZ, sinQuery, "index.html"),
                join(RAIZ, sinQuery + ".html"),
                join(carpeta, sinQuery, "index.html"),
                join(carpeta, sinQuery + ".html")
            ];
            if (candidatos.some((c) => existsSync(c))) continue;
            advertidos.push({ archivo, valor: limpio });
            continue;
        }

        const registro = { archivo, valor: limpio };
        if (es404) {
            advertidos.push(registro);
        } else {
            problemas.push(registro);
        }
    }
}

console.log(`\nComprobados ${comprobados} enlaces/recursos locales en ${archivos.length} archivos.\n`);
if (advertidos.length) {
    console.log("AVISOS (rutas relativas sin extension; revisar si son intencionadas):");
    for (const { archivo, valor } of advertidos) {
        console.log(`  - ${relative(RAIZ, archivo)}  ->  ${valor}`);
    }
    console.log();
}

if (problemas.length) {
    console.log("ROTOS:");
    for (const { archivo, valor } of problemas) {
        console.log(`  - ${relative(RAIZ, archivo)}  ->  ${valor}`);
    }
    console.log(`\n${problemas.length} enlace(s) roto(s).\n`);
    process.exit(1);
}

console.log("Todo OK: no hay enlaces locales rotos.\n");