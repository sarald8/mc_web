const proximasFechas = [
    {
        dia: "26",
        mes: "SEP",
        ciudad: "Santiago de Compostela",
        hora: "23:00",
        entradas: "poner_enlace_entradas"
    },
    {
        dia: "XX",
        mes: "OCT",
        ciudad: "Vigo",
        hora: "23:00",
        entradas: "poner_enlace_entradas"
    },
    {
        dia: "XX",
        mes: "NOV",
        ciudad: "A Coruña",
        hora: "23:00",
        entradas: "poner_enlace_entradas"
    }
];

const datesList = document.getElementById("dates-list");

proximasFechas.forEach(fecha => {
    datesList.innerHTML += `
        <div class="date-item">
            <div class="date-number">${fecha.dia}</div>
            <div class="date-month">${fecha.mes}</div>
            <div class="date-info">
                <h3>MONOCROMATICS</h3>
                <p>${fecha.ciudad} · ${fecha.hora}</p>
            </div>
            <a href="${fecha.entradas}" class="date-button">ENTRADAS</a>
        </div>
    `;
});