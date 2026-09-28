// ==========================================================
// npm run carpetas
// Lista las fiestas que YA existen en js/galeria.js y si hay un
// galeria_apartadoN.html para cada una.
//
// Sirve para saber que numero de apartado toca al crear una fiesta
// nueva (punto 35 de estructuraweb.md): el script de Python no
// escribe HTML, solo JS.
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

console.log(`\nFiestas en js/galeria.js: ${fiestas.length}`);
console.log(`Apartados HTML existentes: ${apartados.length}\n`);

fiestas.forEach((fiesta, i) => {
    const archivo = `galeria_apartado${i + 1}.html`;
    const estado = existsSync(join(PAGINAS, archivo)) ? "OK" : "FALTA";
    console.log(`  ${String(i + 1).padStart(2, " ")}. ${fiesta.nombre.padEnd(20, " ")} ${fiesta.carpeta.padEnd(40, " ")} ${archivo.padEnd(26, " ")} ${estado}`);
});

const siguiente = numeros.length ? Math.max(...numeros) + 1 : 1;

console.log(`
Pasos al anadir una fiesta nueva (punto 35 de estructuraweb.md):
  1. Meter las fotos en fotos_para_subir/<carpeta-de-la-fiesta>/
  2. Ejecutar:  python generar_galeria.py
  3. Editar el nombre y el lugar de la fiesta nueva en js/galeria.js
  4. Crear a mano el HTML:  paginas/galeria_apartado${siguiente}.html
     (copiar uno existente y cambiar titulo, meta description y data-carpeta)
  5. Anadir la tarjeta a mano en paginas/galeria.html y en sitemap.xml
`);