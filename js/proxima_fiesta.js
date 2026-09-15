// ==========================================
// CONFIGURACIÓN PRÓXIMA FIESTA
// ==========================================

const proximaFiesta = {
    mes: "SEPTIEMBRE",
    artista: "Pedro LaDroga",
    fecha: "11.09.2026",
    ciudad: "SANTIAGO, SALA REM",
    hora: "23:59",
    cartel: "imagenes/cartel_pedro.jpg",
    cartelAlt: "Cartel de Monocromatics septiembre 2026",
    entradas: "https://enlace-a-las-entradas.com",
    fechaContador: "2026-09-11T23:59:00"
};

// ==========================================
// MOSTRAR DATOS DE LA PRÓXIMA FIESTA
// ==========================================

const setTexto = (id, valor) => {
    const el = document.getElementById(id);
    if (el) el.textContent = valor;
};

setTexto("proxima-mes", proximaFiesta.mes);
setTexto("proxima-artista", proximaFiesta.artista);
setTexto("proxima-fecha", proximaFiesta.fecha);
setTexto("proxima-ciudad", proximaFiesta.ciudad);
setTexto("proxima-hora", proximaFiesta.hora);

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

function actualizarContador() {
    const ahora = new Date().getTime();
    const diferencia = fechaFiesta - ahora;

    if (diferencia <= 0) {
        setTexto("days", "00");
        setTexto("hours", "00");
        setTexto("minutes", "00");
        setTexto("seconds", "00");
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
    setInterval(actualizarContador, 1000);
}