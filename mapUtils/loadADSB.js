const L = require('leaflet');
const imageUrls = require('../imageUrls');
require('leaflet-rotatedmarker');

let currentADSB=[];

function loadADSB(existingLayer) {
    const adsbLayer = existingLayer || new L.layerGroup();

    return new Promise((resolve, reject) => {
        const url = '/adsb';

        const airplaneIcon = L.icon({
            iconUrl: imageUrls.airplaneIcon,
            iconSize: [38, 38],
            iconAnchor: [22, 94],
            popupAnchor: [-3, -76]
        });


        fetch(url)
            .then(response => {
                if(!response.ok) {
                    throw new Error(`HTTP error! ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('Parsed adsb data', data);
                adsbLayer.clearLayers();
                if (!Array.isArray(data.states) || data.states.length === 0) {
                    console.log('No adsb data available');
                    return;
                }
                data.states.forEach(aircraft => {
                    const [
                        icao24, callsign, origin_country, time_position, 
                        last_contact, longitude, latitude, baro_altitude, 
                        on_ground, velocity, true_track, vertical_rate, 
                        sensors, geo_altitude, squawk, spi, position_source
                    ] = aircraft;

                    if (latitude && longitude) {
                        const adsbMarker = L.marker([latitude, longitude], {
                            icon: airplaneIcon,
                            title: callsign || icao24,
                            rotationAngle: true_track,
                            rotationOrigin: 'center center'});
                        
                        // You can add a popup with more information if needed
                        adsbMarker.bindPopup(`
                            <b>${callsign || icao24}</b><br>
                            Altitude: ${baro_altitude} m<br>
                            Speed: ${velocity} m/s<br>
                            Country: ${origin_country}
                        `);

                        adsbLayer.addLayer(adsbMarker);
                        currentADSB.push({
                            id: callsign || icao24,
                            latitude: latitude,
                            longitude: longitude,
                            altitude: baro_altitude,
                            speed: velocity,
                            track: true_track
                        });
                    }                    
                });
                resolve(adsbLayer);
            })
            .catch(error => {
                console.log('Error fetching adsb data', error);
                reject(error);
            });
    });
}

function getCurrentADSB() {
    return currentADSB;
}

module.exports = {
    loadADSB,
    getCurrentADSB,
};

