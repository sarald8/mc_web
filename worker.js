export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/imagenes/fiestas/")) {
      const key = url.pathname.slice(1);
      const object = await env.FOTOS.get(key);

      if (!object) {
        return new Response("Imagen no encontrada", { status: 404 });
      }

      const headers = new Headers();
      object.writeHttpMetadata(headers);
      headers.set("ETag", object.httpEtag);
      headers.set("Cache-Control", "public, max-age=31536000, immutable");

      return new Response(object.body, {
        headers
      });
    }

    return env.ASSETS.fetch(request);
  }
};