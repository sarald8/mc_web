// ==========================================
// CONFIGURACIÓN PRÓXIMA FIESTA
// ==========================================

const proximaFiesta = {
    mes: "OCTUBRE",
    info: "Especial Halloween",
    artista: "XX XXXX",
    fecha: "31.10.2026",
    ciudad: "SANTIAGO, SALA MYCLUB",
    hora: "23:59",
    cartel: "imagenes/cartel_por_desvelar.PNG",
    cartelAlt: "Cartel de Monocromatics halloween 2026",
    entradas: "https://www.enterticket.es/",
    fechaContador: "2026-10-31T23:59:00"
};

// ==========================================
// MOSTRAR DATOS DE LA PRÓXIMA FIESTA
// ==========================================

const setTexto = (id, valor) => {
    const el = document.getElementById(id);
    if (el) el.textContent = valor;
};

setTexto("proxima-mes", proximaFiesta.mes);
setTexto("proxima-info", proximaFiesta.info);
setTexto("proxima-artista", proximaFiesta.artista);
setTexto("proxima-fecha", proximaFiesta.fecha);
setTexto("proxima-ciudad", proximaFiesta.ciudad);
setTexto("proxima-hora", proximaFiesta.hora);

// Ticker: muestra el nombre de la próxima fiesta en las dos copias.
setTexto("ticker-artista", proximaFiesta.artista);
setTexto("ticker-artista-2", proximaFiesta.artista);
setTexto("ticker-artista-3", proximaFiesta.artista);
setTexto("ticker-artista-4", proximaFiesta.artista);
setTexto("ticker-artista-5", proximaFiesta.artista);
setTexto("ticker-artista-6", proximaFiesta.artista);
setTexto("ticker-artista-7", proximaFiesta.artista);
setTexto("ticker-artista-8", proximaFiesta.artista);

const cartel = document.getElementById("proxima-cartel");
if (cartel) {
    cartel.src = proximaFiesta.cartel;
    cartel.alt = proximaFiesta.cartelAlt;
}

const enlaceEntradas = document.getElementById("proxima-entradas");
if (enlaceEntradas) {
    enlaceEntradas.href = proximaFiesta.entradas;
}

// ==========================================
// CONTADOR PRÓXIMA FIESTA
// ==========================================

const fechaFiesta = new Date(proximaFiesta.fechaContador).getTime();

let timerContador = null;

function actualizarContador() {
    const ahora = new Date().getTime();
    const diferencia = fechaFiesta - ahora;

    if (diferencia <= 0) {
        setTexto("days", "00");
        setTexto("hours", "00");
        setTexto("minutes", "00");
        setTexto("seconds", "00");

        // La fiesta ya ha empezado: no tiene sentido seguir con el temporizador.
        if (timerContador !== null) {
            clearInterval(timerContador);
            timerContador = null;
        }
        return;
    }

    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
    const horas = Math.floor((diferencia / (1000 * 60 * 60)) % 24);
    const minutos = Math.floor((diferencia / (1000 * 60)) % 60);
    const segundos = Math.floor((diferencia / 1000) % 60);

    setTexto("days", String(dias).padStart(2, "0"));
    setTexto("hours", String(horas).padStart(2, "0"));
    setTexto("minutes", String(minutos).padStart(2, "0"));
    setTexto("seconds", String(segundos).padStart(2, "0"));
}

// Solo arranca el contador si existe el bloque en la página actual.
if (document.getElementById("days")) {
    actualizarContador();
    timerContador = setInterval(actualizarContador, 1000);
}