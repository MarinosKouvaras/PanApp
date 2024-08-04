const config = require('../config');
const L = require('leaflet');


function loadFlights(existingLayer) {
    const flightLayer = existingLayer || new L.layerGroup();
    
    return new Promise((resolve, reject) => {
        const url = `${config.API_URL}/flights`; // This now matches your server route
        fetch(url)
            .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
            })
            .then(data => {
                console.log('Parsed data:', data);
  
                // Clear existing markers
                flightLayer.clearLayers();
  
                if (!Array.isArray(data.ac) || data.ac.length === 0) {
                console.log('No flight data available');
                return;
                }
  
            // Add new markers
            data.ac.forEach(aircraft => {
                if (aircraft.lat && aircraft.lon) {
                    const marker = L.marker([aircraft.lat, aircraft.lon]);
            
                    const popupContent = `
                    ICAO: ${aircraft.hex || 'Unknown'}<br>
                    Type: ${aircraft.t || 'Unknown'}<br>
                    Altitude: ${aircraft.alt_baro || 'Unknown'} ft<br>
                    Speed: ${aircraft.gs || 'Unknown'} knots<br>
                    Heading: ${aircraft.track || 'Unknown'}°
            `;
            marker.bindPopup(popupContent);
            
            flightLayer.addLayer(marker);
          }
        });
        resolve(flightLayer);
      })
      .catch(err => {
        console.error('Error fetching flight data:', err);
        reject(err);
      });

    });
    
  
    
}

module.exports = {
    loadFlights,
}