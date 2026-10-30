const bouton = document.getElementById('bouton-valider');
const inputDate = document.getElementById('date-choisie');
const resultatDate = document.getElementById('resultat-date');
const infoCoords = document.getElementById('info-coords');
const infoAstroMeteo = document.getElementById('info-astro-meteo');
const btnLocaliser = document.getElementById('btn-localiser');

let derniereLat = null;
let derniereLng = null;

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

    if (derniereLat !== null && derniereLng !== null) {
        selectionnerPosition(derniereLat, derniereLng);
    }
});

const map = L.map('map').setView([0, 0], 2);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    minZoom: 1,
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

let marker = null;

async function selectionnerPosition(lat, lng) {
    derniereLat = lat;
    derniereLng = lng;

    infoCoords.textContent = `Coordonnées : Lat ${lat.toFixed(4)}, Lng ${lng.toFixed(4)}`;

    if (marker) {
        marker.setLatLng([lat, lng]);
    } else {
        marker = L.marker([lat, lng]).addTo(map);
    }

    const dateStr = inputDate.value || new Date().toISOString().split('T')[0];

    try {
        infoAstroMeteo.innerHTML = `
            <p>☁️ <strong>Météo / Nuages :</strong> Chargement...</p>
            <p>🌅 <strong>Coucher du soleil :</strong> Chargement...</p>
            <p>🌄 <strong>Lever du soleil :</strong> Chargement...</p>
        `;
        
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=sunrise,sunset,cloud_cover_mean&timezone=auto&start_date=${dateStr}&end_date=${dateStr}`;
        
        const response = await fetch(url);
        const data = await response.json();

        const nuages = (data.daily && data.daily.cloud_cover_mean) ? data.daily.cloud_cover_mean[0] : "N/A";
        const sunrise = (data.daily && data.daily.sunrise) ? data.daily.sunrise[0].split('T')[1] : "N/A";
        const sunset = (data.daily && data.daily.sunset) ? data.daily.sunset[0].split('T')[1] : "N/A";

        infoAstroMeteo.innerHTML = `
            <p>☁️ <strong>Météo / Nuages (Moy.) :</strong> ${nuages}%</p>
            <p>🌅 <strong>Coucher du soleil :</strong> ${sunset}</p>
            <p>🌄 <strong>Lever du soleil :</strong> ${sunrise}</p>
        `;

    } catch (error) {
        console.error("Erreur API Météo:", error);
        infoAstroMeteo.innerHTML = `
            <p>❌ Impossible de charger la météo pour ce spot.</p>
        `;
    }
}

map.on('click', function(e) {
    selectionnerPosition(e.latlng.lat, e.latlng.lng);
});

btnLocaliser.addEventListener('click', function() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;

                map.setView([lat, lng], 10);
                selectionnerPosition(lat, lng);
            },
            (error) => {
                alert("Impossible de récupérer votre position GPS.");
            }
        );
    } else {
        alert("La géolocalisation n'est pas supportée par votre navigateur.");
    }
});