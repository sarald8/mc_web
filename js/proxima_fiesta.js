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

document.getElementById("proxima-mes").textContent = proximaFiesta.mes;
document.getElementById("proxima-artista").textContent = proximaFiesta.artista;
document.getElementById("proxima-fecha").textContent = proximaFiesta.fecha;
document.getElementById("proxima-ciudad").textContent = proximaFiesta.ciudad;
document.getElementById("proxima-hora").textContent = proximaFiesta.hora;

document.getElementById("proxima-cartel").src = proximaFiesta.cartel;
document.getElementById("proxima-cartel").alt = proximaFiesta.cartelAlt;
document.getElementById("proxima-entradas").href = proximaFiesta.entradas;

// ==========================================
// CONTADOR PRÓXIMA FIESTA
// ==========================================

const fechaFiesta = new Date(proximaFiesta.fechaContador).getTime();

function actualizarContador() {
    const ahora = new Date().getTime();
    const diferencia = fechaFiesta - ahora;

    if (diferencia <= 0) {
        document.getElementById("days").textContent = "00";
        document.getElementById("hours").textContent = "00";
        document.getElementById("minutes").textContent = "00";
        document.getElementById("seconds").textContent = "00";
        return;
    }

    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
    const horas = Math.floor((diferencia / (1000 * 60 * 60)) % 24);
    const minutos = Math.floor((diferencia / (1000 * 60)) % 60);
    const segundos = Math.floor((diferencia / 1000) % 60);

    document.getElementById("days").textContent = String(dias).padStart(2, "0");
    document.getElementById("hours").textContent = String(horas).padStart(2, "0");
    document.getElementById("minutes").textContent = String(minutos).padStart(2, "0");
    document.getElementById("seconds").textContent = String(segundos).padStart(2, "0");
}

actualizarContador();
setInterval(actualizarContador, 1000);