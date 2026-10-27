const bouton = document.getElementById('bouton-valider');
const inputDate = document.getElementById('date-choisie');
const resultatDate = document.getElementById('resultat-date');

bouton.addEventListener('click', function() {
    const dateStr = inputDate.value;
    
    if (dateStr === "") {
        resultatDate.textContent = "Oups, aucune date choisie !";
        return;
    }

    const dateChoisie = new Date(dateStr);
    
    const referenceNouvelleLune = new Date('2024-01-11');
    const dureeCycle = 29.53058867;

    const differenceMs = dateChoisie - referenceNouvelleLune;
    const differenceJours = differenceMs / (1000 * 60 * 60 * 24);


    let ageLune = differenceJours % dureeCycle;
    if (ageLune < 0) {
        ageLune += dureeCycle; 
    }

    const illumination = Math.round(((1 - Math.cos((ageLune / dureeCycle) * 2 * Math.PI)) / 2) * 100);

    let nomPhase = "";
    if (ageLune < 1.84) {
        nomPhase = "Nouvelle Lune 🌑";
    } else if (ageLune < 5.53) {
        nomPhase = "Premier croissant 🌒";
    } else if (ageLune < 9.22) {
        nomPhase = "Premier quartier 🌓";
    } else if (ageLune < 12.91) {
        nomPhase = "Gibbeuse croissante 🌔";
    } else if (ageLune < 16.61) {
        nomPhase = "Pleine Lune 🌕";
    } else if (ageLune < 20.30) {
        nomPhase = "Gibbeuse décroissante 🌖";
    } else if (ageLune < 23.99) {
        nomPhase = "Dernier quartier 🌗";
    } else if (ageLune < 27.68) {
        nomPhase = "Dernier croissant 🌘";
    } else {
        nomPhase = "Nouvelle Lune 🌑";
    }

    resultatDate.innerHTML = `
        <strong>Date :</strong> ${dateStr} <br>
        <strong>Phase :</strong> ${nomPhase} <br>
        <strong>Luminosité :</strong> ${illumination}% <br>
        <strong>Âge :</strong> ${ageLune.toFixed(1)} jours dans le cycle
    `;
});



const map = L.map('map').setView([0, 0], 2);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    minZoom: 1,
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

let marker = null;
const infoCoords = document.getElementById('info-coords');


map.on('click', function(e) {
    const lat = e.latlng.lat;
    const lng = e.latlng.lng;

    infoCoords.textContent = `Coordonnées : Lat ${lat.toFixed(4)}, Lng ${lng.toFixed(4)}`;

    if (marker) {
        marker.setLatLng([lat, lng]);
    } else {
        marker = L.marker([lat, lng]).addTo(map);
    }
});


const btnLocaliser = document.getElementById('btn-localiser');
btnLocaliser.addEventListener('click', function() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;

                map.setView([lat, lng], 10);
                infoCoords.textContent = `Coordonnées : Lat ${lat.toFixed(4)}, Lng ${lng.toFixed(4)}`;

                if (marker) {
                    marker.setLatLng([lat, lng]);
                } else {
                    marker = L.marker([lat, lng]).addTo(map);
                }
            },
            (error) => {
                alert("Impossible de récupérer votre position GPS.");
            }
        );
    } else {
        alert("La géolocalisation n'est pas supportée par votre navigateur.");
    }
});

