const L = require('leaflet');
const imageUrls = require('../imageUrls');
const config = require('../config');


function loadFires(existingLayer) {
    const fireLayer = existingLayer || new L.layerGroup();

    const fireIcon = L.icon({
        iconUrl: imageUrls.fireIcon,
        iconSize: [38, 95],
        iconAnchor: [22, 94],
        popupAnchor: [-3, -76]
    });

    return new Promise((resolve, reject) => {
        const url = `${config.API_URL}/fires`;

        fetch(url)
            .then(response => response.text())
            .then(data => {
                console.log('Raw data from /fires:', data);
                // Step 2: Parse CSV Data
                const rows = data.split('\\n');  // Split on the literal '\n' string
                console.log('Number of rows:', rows.length);
                const headers = rows[0].split(',');
                console.log('Headers:', headers);

                const fireData = rows.slice(1).map(row => {
                    const rowData = row.split(',');
                    const entry = {};
                    headers.forEach((header, index) => {
                        entry[header] = rowData[index];
                    });
                    return entry;
                });

                console.log('Processed fire data:', fireData);

                // Step 3: Plot Data on Leaflet Map
                fireData.forEach(fire => {
                    const latitude = parseFloat(fire.latitude);
                    const longitude = parseFloat(fire.longitude);

                    console.log(`Processing fire: lat ${latitude}, lon ${longitude}`);

                    if (!isNaN(latitude) && !isNaN(longitude)) {
                        console.log(`Creating fire marker at: ${latitude}, ${longitude}`);
                        const fireMarker = L.marker([latitude, longitude], {icon: fireIcon})
                            .bindPopup(`<b>Fire Location:</b><br>Latitude: ${latitude}<br>Longitude: ${longitude}<br>Date: ${fire.acq_date}<br>Time: ${fire.acq_time}`);
                        fireLayer.addLayer(fireMarker);
                        

                    } else {
                        console.log('Invalid latitude or longitude');
                    }
                });

                const mockFire = {
                    latitude: '38.576353',
                    longitude: '22.149467',
                    acq_date: '2024-07-31',
                    acq_time: '14:30',
                    confidence: 'high',
                    brightness: '350.5',
                    frp: '75.2'
                };
                fireData.push(mockFire);

                console.log('Total markers added:', fireLayer.getLayers().length);

                //resolve(fireLayer);
                resolve({layer: fireLayer, data: fireData})
            })
            .catch(error => {
                console.error('Error fetching data:', error);
                reject(error);
            });
    });
}

module.exports = {
    loadFires,
}