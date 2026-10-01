/* ==========================================================
   FORMULARIO DE CONTACTO
   Envia el formulario a Web3Forms con fetch (con hCaptcha de por
   medio) en vez de dejar que el navegador haga el POST nativo.

   Vive en un archivo aparte y no en un <script> en linea dentro de
   contacto.html para poder quitar 'unsafe-inline' de script-src en
   la CSP (ver _headers).
========================================================= */

const form = document.getElementById('form-contacto');

if (form) {
    const estado = document.getElementById('form-estado');

    // Si el script de Web3Forms no carga, el widget de hCaptcha nunca se
    // inyecta y el formulario rechazaria TODOS los envios. Con este flag
    // sabemos si el captcha esta disponible de verdad.
    let captchaDisponible = false;

    window.addEventListener('load', () => {
        captchaDisponible = !!document.querySelector('textarea[name="h-captcha-response"]');

        if (!captchaDisponible) {
            console.warn('hCaptcha no se ha cargado: se enviara el formulario sin validacion en cliente (Web3Forms lo valida en servidor).');
        }
    });

    form.addEventListener('submit', async (e) => {
        // El POST nativo ya lo corta el onsubmit="return false" del <form>;
        // esto es la segunda red de seguridad por si ese atributo se quita.
        e.preventDefault();

        // Solo bloqueamos por captcha si este se ha cargado realmente.
        const captcha = form.querySelector('textarea[name="h-captcha-response"]');
        if (captchaDisponible && (!captcha || !captcha.value)) {
            estado.className = 'error';
            estado.textContent = 'Marca el captcha antes de enviar.';
            return;
        }

        const boton = form.querySelector('button[type="submit"]');
        boton.disabled = true;
        estado.className = '';
        estado.textContent = 'Enviando…';

        try {
            const formData = new FormData(form);
            const motivoTexto = form.elements['motivo'].selectedOptions[0].text;
            formData.set('subject', `[${motivoTexto}] , ${formData.get('name')}`);

            const res = await fetch(form.action, {
                method: 'POST',
                body: formData,
                headers: { 'Accept': 'application/json' }
            });
            const data = await res.json().catch(() => ({}));

            if (res.ok && data.success) {
                window.location.href = 'gracias.html';
            } else {
                throw new Error(data.message || `Error del servidor (${res.status})`);
            }
        } catch (err) {
            console.error('Fallo al enviar:', err);
            estado.textContent = 'Algo ha fallado :(. Inténtalo de nuevo o escríbenos a monocromaticss@gmail.com';
            estado.classList.add('error');
            boton.disabled = false;
            if (window.hcaptcha) hcaptcha.reset();
        }
    });
}
