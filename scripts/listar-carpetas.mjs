// ==========================================================
// npm run carpetas
// Lista las fiestas que YA existen en js/galeria.js y a que apartado
// (galeria_apartadoN.html) apunta cada una segun las tarjetas de
// galeria.html.
//
// Sirve para saber que numero de apartado toca al crear una fiesta
// nueva. OJO: el numero del apartado lo manda la tarjeta de galeria.html,
// NO la posicion de la fiesta en el array de galeria.js (que es el orden
// de subida de fotos y puede no coincidir).
// ==========================================================

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const RAIZ = process.cwd();
const JS_GALERIA = join(RAIZ, "js", "galeria.js");
const PAGINAS = join(RAIZ, "paginas");

if (!existsSync(JS_GALERIA)) {
    console.error("No existe js/galeria.js");
    process.exit(1);
}

const contenido = readFileSync(JS_GALERIA, "utf8");

// Extrae los objetos { nombre, lugar, carpeta } del array `fiestas`.
const bloque = contenido.match(/const\s+fiestas\s*=\s*\[([\s\S]*?)\n\];/);
const fiestas = [];

if (bloque) {
    for (const objeto of bloque[1].matchAll(/\{([\s\S]*?)\}/g)) {
        const nombre = objeto[1].match(/nombre\s*:\s*"((?:\\.|[^"\\])*)"/);
        const carpeta = objeto[1].match(/carpeta\s*:\s*"((?:\\.|[^"\\])*)"/);
        if (carpeta) {
            fiestas.push({
                nombre: nombre ? nombre[1] : "(sin nombre)",
                carpeta: carpeta[1]
            });
        }
    }
}

const apartados = existsSync(PAGINAS)
    ? readdirSync(PAGINAS).filter((f) => /^galeria_apartado\d+\.html$/.test(f))
    : [];

const numeros = apartados
    .map((f) => Number(f.match(/(\d+)\.html$/)[1]))
    .sort((a, b) => a - b);

// De cada tarjeta de galeria.html saca a que apartado apunta y con que titulo.
// Es el vinculo real fiesta -> apartado (lo mismo que usa el visitante al hacer clic).
const GALERIA_HTML = join(PAGINAS, "galeria.html");
const tarjetas = [];

if (existsSync(GALERIA_HTML)) {
    const html = readFileSync(GALERIA_HTML, "utf8");
    // Solo las tarjetas activas (las comentadas son fiestas no publicadas).
    for (const m of html.matchAll(/<a\s+href="(galeria_apartado\d+\.html)"[\s\S]*?<h3>([\s\S]*?)<\/h3>/g)) {
        tarjetas.push({ archivo: m[1], titulo: m[2].trim() });
    }
}

const apartadoDe = (fiesta) => {
    const porTitulo = tarjetas.find((t) => t.titulo.toLowerCase() === fiesta.nombre.toLowerCase());
    if (porTitulo) return { archivo: porTitulo.archivo, via: "tarjeta" };
    const numero = fiesta.carpeta.match(/apartado(\d+)/i);
    return numero
        ? { archivo: `galeria_apartado${numero[1]}.html`, via: "carpeta" }
        : { archivo: null, via: "-" };
};

console.log(`\nFiestas en js/galeria.js: ${fiestas.length}`);
console.log(`Tarjetas en paginas/galeria.html: ${tarjetas.length}`);
console.log(`Apartados HTML existentes: ${apartados.length}\n`);

const usados = new Set();

fiestas.forEach((fiesta, i) => {
    const { archivo, via } = apartadoDe(fiesta);

    if (!archivo) {
        console.log(`  ${String(i + 1).padStart(2, " ")}. ${fiesta.nombre.padEnd(20, " ")} ${fiesta.carpeta.padEnd(40, " ")} (sin apartado: no hay tarjeta en galeria.html)`);
        return;
    }

    usados.add(archivo);
    const existe = existsSync(join(PAGINAS, archivo));
    // La carpeta del apartado se lee del propio HTML (data-carpeta), que es el
    // dato que compara galeria.js: si no coincide, la tarjeta abre una página vacia.
    const ruta = join(PAGINAS, archivo);
    const dataCarpeta = existe
        ? (readFileSync(ruta, "utf8").match(/data-carpeta="([^"]*)"/) || [])[1]
        : undefined;
    // galeria.js admite en data-carpeta tanto la CARPETA como el NOMBRE visible,
    // asi que solo es un problema si el valor no es ninguno de los dos.
    const esperado = fiesta.carpeta.trim().toLowerCase();
    const aviso =
        !existe
            ? "FALTA el HTML"
            : dataCarpeta &&
                dataCarpeta.trim().toLowerCase() !== esperado &&
                dataCarpeta.trim().toLowerCase() !== fiesta.nombre.trim().toLowerCase()
                ? `REVISAR: data-carpeta="${dataCarpeta}" no coincide con la carpeta (${fiesta.carpeta})`
                : "OK";

    console.log(`  ${String(i + 1).padStart(2, " ")}. ${fiesta.nombre.padEnd(20, " ")} ${fiesta.carpeta.padEnd(40, " ")} ${archivo.padEnd(26, " ")} ${aviso} (${via})`);
});

const huerfanos = tarjetas.filter((t) => !usados.has(t.archivo));

if (huerfanos.length) {
    console.log("\n  Tarjetas en galeria.html sin fiesta en galeria.js:");
    huerfanos.forEach((t) => console.log(`    ${t.archivo} -> ${t.titulo}`));
}

const siguiente = numeros.length ? Math.max(...numeros) + 1 : 1;

console.log(`
Pasos al anadir una fiesta nueva:
  1. Meter las fotos en fotos_para_subir/<carpeta-de-la-fiesta>/
  2. Ejecutar:  python generar_galeria.py --solo-carpeta <carpeta-de-la-fiesta> --html
  3. Revisar el nombre y el lugar de la fiesta en js/galeria.js y en galeria.html
     (el nombre del <h3> de la tarjeta debe coincidir con el de galeria.js)

  El paso --html crea el galeria_apartadoN.html que falte y reescribe las
  tarjetas de galeria.html. Los apartados que YA existen no se tocan nunca.

  El sitemap.xml NO hay que tocarlo a mano: generar_galeria.py --html recalcula
  el bloque de apartados (y avisa si apunta a uno que ya no existe).

  Siguiente numero de apartado libre: apartado${siguiente}
`);