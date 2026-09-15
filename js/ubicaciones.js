/* ==========================================================
   UBICACIONES MONOCROMATICS
========================================================== */

let mapaMonocromatics = null;

function inicializarUbicaciones() {
    const toggleButtons = document.querySelectorAll(".ubicacion-toggle");
    const panels = document.querySelectorAll(".ubicaciones-panel");

    if (!toggleButtons.length) {
        console.warn("No se encontraron los botones de ubicaciones.");
        return;
    }

    /* ======================================================
       TOGGLE RUTA / MAPA
    ====================================================== */

    toggleButtons.forEach(button => {
        button.addEventListener("click", () => {
            const view = button.dataset.view;

            toggleButtons.forEach(btn => btn.classList.remove("active"));
            button.classList.add("active");

            panels.forEach(panel => panel.classList.remove("active"));

            const selectedPanel = document.getElementById(`vista-${view}`);

            if (selectedPanel) {
                selectedPanel.classList.add("active");
            }

            if (view === "mapa" && mapaMonocromatics) {
                setTimeout(() => {
                    mapaMonocromatics.invalidateSize();
                }, 150);
            }
        });
    });

    /* ======================================================
       SALAS
    ====================================================== */

    const venues = [
        {
            id: "malavida",
            name: "Sala Malavida",
            city: "A Coruña",
            lat: 43.3656156,
            lng: -8.4123614,
            url: "https://maps.google.com/?cid=4083833265726215060"
        },
        {
            id: "pantalan",
            name: "Pantalán Rest Club",
            city: "A Coruña",
            lat: 43.366,
            lng: -8.389,
            url: "https://www.google.com/maps/search/?api=1&query=Pantalán+Rest+Club,+Lugar,+Playa+de+Oza,+1,+15006+A+Coruña"
        },
        {
            id: "myclub",
            name: "MyClub",
            city: "Santiago de Compostela",
            lat: 42.8740669,
            lng: -8.5474035,
            url: "https://maps.google.com/?cid=16209566277123279662"
        },
        {
            id: "vanitas",
            name: "Vanitas",
            city: "Santiago de Compostela",
            lat: 42.8745061,
            lng: -8.5504516,
            url: "https://maps.google.com/?cid=9866776456648871609"
        },
        {
            id: "rem",
            name: "Rem Forbiden",
            city: "Santiago de Compostela",
            lat: 42.8743593,
            lng: -8.5511835,
            url: "https://maps.google.com/?cid=11474033764251988544"
        },
        {
            id: "moon",
            name: "Sala Moon",
            city: "Santiago de Compostela",
            lat: 42.875,
            lng: -8.546,
            url: "https://www.google.com/maps/search/?api=1&query=Sala+Moon,+Rúa+da+República+Arxentina,+35,+15701+Santiago+de+Compostela"
        },
        {
            id: "doppler",
            name: "Doppler",
            city: "Vigo",
            lat: 42.2351211,
            lng: -8.716598,
            url: "https://maps.google.com/?cid=13925092457490533232"
        },
        {
            id: "molotov",
            name: "Sala Molotov",
            city: "Vigo",
            lat: 42.240,
            lng: -8.724,
            url: "https://www.google.com/maps/search/?api=1&query=Sala+Molotov,+Travesía+Santiago+de+Vigo,+1,+36201+Vigo"
        }
    ];

    /* ======================================================
       MAPA
    ====================================================== */

    const mapElement = document.getElementById("mapa-monocromatics");

    if (!mapElement) {
        console.warn("No se encontró #mapa-monocromatics.");
        return;
    }

    if (typeof L === "undefined") {
        console.error("Leaflet no está cargado.");
        return;
    }

    mapaMonocromatics = L.map("mapa-monocromatics", {
        zoomControl: true,
        attributionControl: true
    }).setView([42.9, -8.55], 8);

    L.tileLayer(
        "https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=cb1_3m00_1_1b3962c3a82510e00ca19739",
        {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
            maxZoom: 19
        }
    ).addTo(mapaMonocromatics);

    const markers = {};
    const markerGroup = [];

    venues.forEach(venue => {
        const icon = L.divIcon({
            className: "mapa-marker",
            html: '<div class="mapa-pin"></div>',
            iconSize: [16, 16],
            iconAnchor: [8, 8]
        });

        const marker = L.marker(
            [venue.lat, venue.lng],
            { icon }
        ).addTo(mapaMonocromatics);

        const popup = document.createElement("div");

        const popupName = document.createElement("p");
        popupName.className = "popup-name";
        popupName.textContent = venue.name;

        const popupCity = document.createElement("p");
        popupCity.className = "popup-city";
        popupCity.textContent = venue.city;

        const popupLink = document.createElement("a");
        popupLink.className = "popup-link";
        popupLink.href = venue.url;
        popupLink.target = "_blank";
        popupLink.rel = "noopener";
        popupLink.textContent = "Cómo llegar →";

        popup.appendChild(popupName);
        popup.appendChild(popupCity);
        popup.appendChild(popupLink);

        marker.bindPopup(popup);

        markers[venue.id] = marker;
        markerGroup.push(marker);
    });

    if (markerGroup.length) {
        mapaMonocromatics.fitBounds(
            L.featureGroup(markerGroup).getBounds(),
            { padding: [40, 40] }
        );
    }

    /* ======================================================
       LISTA DE SALAS
    ====================================================== */

    const listElement = document.getElementById("mapa-venue-list");

    if (listElement) {
        venues.forEach(venue => {
            const button = document.createElement("button");

            button.className = "mapa-venue-item";
            button.dataset.city = venue.city;

            const nameSpan = document.createElement("span");
            nameSpan.className = "name";
            nameSpan.textContent = venue.name;

            const citySpan = document.createElement("span");
            citySpan.className = "city";
            citySpan.textContent = venue.city;

            button.appendChild(nameSpan);
            button.appendChild(citySpan);

            button.addEventListener("click", () => {
                document
                    .querySelectorAll(".mapa-venue-item")
                    .forEach(item => item.classList.remove("selected"));

                button.classList.add("selected");

                mapaMonocromatics.flyTo(
                    [venue.lat, venue.lng],
                    15,
                    { duration: 0.6 }
                );

                markers[venue.id].openPopup();
            });

            listElement.appendChild(button);
        });
    }

    /* ======================================================
       FILTROS POR CIUDAD
    ====================================================== */

    const filterElement = document.getElementById("mapa-filters");

    if (filterElement) {
        const cities = [
            "Todas",
            ...new Set(venues.map(venue => venue.city))
        ];

        cities.forEach(city => {
            const button = document.createElement("button");

            button.className = "mapa-filter-btn";
            button.textContent = city;

            if (city === "Todas") {
                button.classList.add("active");
            }

            button.addEventListener("click", () => {
                document
                    .querySelectorAll(".mapa-filter-btn")
                    .forEach(btn => btn.classList.remove("active"));

                button.classList.add("active");

                document
                    .querySelectorAll(".mapa-venue-item")
                    .forEach(item => {
                        item.style.display =
                            city === "Todas" || item.dataset.city === city
                                ? "flex"
                                : "none";
                    });

                venues.forEach(venue => {
                    const markerElement = markers[venue.id]
                        .getElement()
                        ?.querySelector(".mapa-pin");

                    if (!markerElement) return;

                    markerElement.classList.toggle(
                        "dim",
                        city !== "Todas" && venue.city !== city
                    );
                });
            });

            filterElement.appendChild(button);
        });
    }

    console.log("Ubicaciones inicializadas correctamente.");
}