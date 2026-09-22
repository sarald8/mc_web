const proximasFechas = [
    {
        dia: "31",
        mes: "OCT",
        ciudad: "Santiago",
        hora: "23:59",
        entradas: "https://www.enterticket.es/"
    },
    {
        dia: "XX",
        mes: "NOV",
        ciudad: "XXX",
        hora: "23:59",
        entradas: "https://www.enterticket.es/"
    },
    {
        dia: "XX",
        mes: "DIC",
        ciudad: "XXX",
        hora: "23:59",
        entradas: "https://www.enterticket.es/"
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

//        const titulo = document.createElement("h3");
//        titulo.textContent = "MONOCROMATICS";

        const detalle = document.createElement("h3");
        detalle.textContent = `${fecha.ciudad} · ${fecha.hora}`;

//        info.appendChild(titulo);
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