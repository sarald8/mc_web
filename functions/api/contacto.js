/* ==========================================================
   POST /api/contacto  —  Cloudflare Pages Function
   ==========================================================

   Por que existe esto:
   ANTES el navegador mandaba el POST directo a api.web3forms.com con la
   `access_key` escrita en el HTML. Eso es publico por definicion: cualquiera
   puede leerla con F12 (o ver el codigo fuente) y usarla para gastar las 250
   peticiones gratis o llenar el correo de spam.

   AHORA el navegador habla con este endpoint (mismo origen) y es la Function
   la que anade la clave y reenvia a Web3Forms. La clave vive en la variable de
   entorno WEB3FORMS_KEY de Cloudflare Pages, no en ningun archivo que el
   navegador descargue.

   Cloudflare Pages convierte cualquier `functions/api/contacto.js` en la ruta
   `/api/contacto` automaticamente. Este archivo NO se sube al navegador.

   Variables de entorno:
   - WEB3FORMS_KEY  (obligatoria)  -> la access_key de Web3Forms.
     Se configura en Pages -> Settings -> Environment variables (como secreto).
   ========================================================= */

const WEB3FORMS_URL = "https://api.web3forms.com/submit";

// Limite defensivo del cuerpo (un formulario de contacto normal no llega ni de
// lejos; esto evita que alguien mande un payload enorme).
const MAX_CUERPO_BYTES = 64 * 1024; // 64 KB

function json(cuerpo, estado) {
    return new Response(JSON.stringify(cuerpo), {
        status: estado,
        headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": "no-store"
        }
    });
}

export async function onRequestPost(context) {
    const { request, env } = context;

    // Sin la variable no se puede firmar la peticion. Mejor un 503 claro que un
    // fallo opaco de Web3Forms: el usuario ve "algo ha fallado" y en los logs
    // de Pages aparece el motivo real.
    if (!env.WEB3FORMS_KEY) {
        console.error("WEB3FORMS_KEY no esta configurada en las variables de entorno de Pages.");
        return json(
            { success: false, message: "El formulario no esta configurado en el servidor." },
            503
        );
    }

    const largo = Number(request.headers.get("content-length") || 0);
    if (largo > MAX_CUERPO_BYTES) {
        return json({ success: false, message: "El mensaje es demasiado largo." }, 413);
    }

    let datos;
    try {
        datos = await request.formData();
    } catch {
        return json({ success: false, message: "Formato de envio no valido." }, 400);
    }

    // Reenviamos SOLO los campos del formulario (allow-list). Nunca hacemos
    // pasar el cuerpo tal cual: asi un cliente no puede colar un access_key
    // falso, otro subject ni campos internos de Web3Forms.
    const permitidos = ["name", "email", "motivo", "mensaje", "subject", "botcheck"];
    const salida = new FormData();

    for (const campo of permitidos) {
        const valor = datos.get(campo);
        if (valor !== null && typeof valor === "string") {
            salida.set(campo, valor);
        }
    }

    // El hCaptcha viaja como h-captcha-response; se reenvia con su nombre.
    const captcha = datos.get("h-captcha-response");
    if (typeof captcha === "string" && captcha) {
        salida.set("h-captcha-response", captcha);
    }

    // La clave la pone el servidor, no el navegador.
    salida.set("access_key", env.WEB3FORMS_KEY);
    salida.set("from_name", "Web Monocromatics");

    let respuesta;
    try {
        respuesta = await fetch(WEB3FORMS_URL, {
            method: "POST",
            body: salida,
            headers: { Accept: "application/json" }
        });
    } catch (err) {
        console.error("No se pudo contactar con Web3Forms:", err);
        return json({ success: false, message: "No se pudo enviar el mensaje." }, 502);
    }

    const texto = await respuesta.text();
    let data;
    try {
        data = JSON.parse(texto);
    } catch {
        data = { success: false, message: "Respuesta no valida de Web3Forms." };
    }

    // Se devuelve la respuesta tal cual (con su codigo), sin loguear el
    // contenido del mensaje: son datos personales del que escribe.
    if (!respuesta.ok || !data.success) {
        console.error("Web3Forms rechazo el envio:", respuesta.status);
    }

    return json(data, respuesta.ok ? 200 : respuesta.status);
}

// Cualquier metodo que no sea POST: 405 en vez de dejar que Pages sirva otra
// cosa o que la peticion caiga en el formulario.
export async function onRequest(context) {
    if (context.request.method === "POST") {
        return onRequestPost(context);
    }
    return json({ success: false, message: "Metodo no permitido." }, 405);
}
