const bouton = document.getElementById('bouton-valider');
const inputDate = document.getElementById('date-choisie');
const resultatDate = document.getElementById('resultat-date');
const infoCoords = document.getElementById('info-coords');
const infoAstroMeteo = document.getElementById('info-astro-meteo');
const btnLocaliser = document.getElementById('btn-localiser');

let derniereLat = null;
let derniereLng = null;

function obtenirIlluminationLune(dateStr) {
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

    return { illumination, nomPhase, ageLune };
}

bouton.addEventListener('click', function() {
    const dateStr = inputDate.value;
    
    if (dateStr === "") {
        resultatDate.textContent = "Oups, aucune date choisie !";
        return;
    }

    const lune = obtenirIlluminationLune(dateStr);

    resultatDate.innerHTML = `
        <strong>Date :</strong> ${dateStr} <br>
        <strong>Phase :</strong> ${lune.nomPhase} <br>
        <strong>Luminosité :</strong> ${lune.illumination}% <br>
        <strong>Âge :</strong> ${lune.ageLune.toFixed(1)} jours dans le cycle
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
    
    // Récupération sécurisée de l'illumination
    const luneInfo = obtenirIlluminationLune(dateStr);
    const illumination = luneInfo ? luneInfo.illumination : 0;

    try {
        document.getElementById('valeur-nuages').textContent = "Chargement...";
        document.getElementById('valeur-soleil').textContent = "Chargement...";
        document.getElementById('score-ciel').textContent = "...";
        document.getElementById('score-lune').textContent = "...";
        
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=sunrise,sunset,cloud_cover_mean&timezone=auto&start_date=${dateStr}&end_date=${dateStr}`;
        
        const response = await fetch(url);
        const data = await response.json();

        const nuages = (data.daily && data.daily.cloud_cover_mean) ? data.daily.cloud_cover_mean[0] : 0;
        const sunrise = (data.daily && data.daily.sunrise) ? data.daily.sunrise[0].split('T')[1] : "N/A";
        const sunset = (data.daily && data.daily.sunset) ? data.daily.sunset[0].split('T')[1] : "N/A";

        const conditions = calculerConditionNuit(illumination, nuages);

        document.getElementById('valeur-nuages').textContent = nuages + "%";
        document.getElementById('valeur-soleil').textContent = `Coucher ${sunset} / Lever ${sunrise}`;
        document.getElementById('score-ciel').textContent = conditions.cielNocturne;
        document.getElementById('score-lune').textContent = conditions.photoLune;

    } catch (error) {
        console.error("Erreur API Météo:", error);
        document.getElementById('valeur-nuages').textContent = "Erreur";
        document.getElementById('valeur-soleil').textContent = "Erreur";
        document.getElementById('score-ciel').textContent = "-";
        document.getElementById('score-lune').textContent = "-";
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

function calculerConditionNuit(illuminationLune, pourcentageNuages) {
    const facteurNuages = Math.max(0, 1 - (pourcentageNuages / 100));

    const facteurLuneCiel = 1 - (illuminationLune / 100);
    const scoreCielNocturne = 10 * facteurNuages * facteurLuneCiel;

    const facteurLunePhoto = illuminationLune / 100;
    const scorePhotoLune = 10 * facteurNuages * facteurLunePhoto;

    return {
        cielNocturne: Number(scoreCielNocturne.toFixed(1)),
        photoLune: Number(scorePhotoLune.toFixed(1))
    };
}