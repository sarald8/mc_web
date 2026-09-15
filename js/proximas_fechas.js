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

if (datesList) {
    proximasFechas.forEach(fecha => {
        const item = document.createElement("div");
        item.className = "date-item";

        const dia = document.createElement("div");
        dia.className = "date-number";
        dia.textContent = fecha.dia;

        const mes = document.createElement("div");
        mes.className = "date-month";
        mes.textContent = fecha.mes;

        const info = document.createElement("div");
        info.className = "date-info";

        const titulo = document.createElement("h3");
        titulo.textContent = "MONOCROMATICS";

        const detalle = document.createElement("p");
        detalle.textContent = `${fecha.ciudad} · ${fecha.hora}`;

        info.appendChild(titulo);
        info.appendChild(detalle);

        const enlace = document.createElement("a");
        enlace.href = fecha.entradas;
        enlace.className = "date-button";
        enlace.textContent = "ENTRADAS";

        item.appendChild(dia);
        item.appendChild(mes);
        item.appendChild(info);
        item.appendChild(enlace);

        datesList.appendChild(item);
    });
}