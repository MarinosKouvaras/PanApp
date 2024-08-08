// Import the leaflet package
const L = require('leaflet');
require('leaflet-draw');
require('leaflet-draw-drag');
require('leaflet-realtime');
require('leaflet-easybutton');
require('leaflet-dialog');
require('leaflet-filelayer')(L);
require('leaflet-notifications');
const { notifications } = require('./mapUtils/notifications');
const { airportsData, airports } = require('./data/airports');
const { fireFightingFeature, fireFightingCommand, sendAcknowledgmentToServer, loadCommandsFromStorage } = require('./mapUtils/fireFightingCommands');
const { timeStampPrint } = require('./mapUtils/timeStamp');
const { fileUploader, loadedFileLayers } = require('./mapUtils/fileUploader');
const turf = require('@turf/turf');
const { mapLayers } = require('./mapUtils/mapOverlays');
const { loadDataMap } = require('./mapUtils/loadDataMap');
const { mapDrawControllers, mapFileImport }= require('./mapUtils/mapDrawControllers');
const {loadFires} = require('./mapUtils/loadFireData');
const imageUrls = require('./imageUrls');
const { loadFlights } = require('./mapUtils/loadFlightData');
const { loadADSB, getCurrentADSB } = require('./mapUtils/loadADSB');
const config = require('./config');


const UPDATE_INTERVAL = 5000;


async function initializeMap() {
    console.log(config.API_URL);
    const map = L.map('map', {zoomSnap: 0.25, zoomDelta: 0.5, boxZoom:true}).setView([38.11, 23.78], 14);
    const { drawnItems, createFormPopup, saveShape } = await loadDataMap();
    map.addLayer(drawnItems);
    console.log('Layers in drawnItems after loading:', drawnItems.getLayers());
    let drawController = mapDrawControllers(drawnItems);
    map.addControl(drawController);
    const my_airports = airportsData();
    const notificationControl = notifications();
    notificationControl.addTo(map);
    const { openCommandDialog, commandLayer } = fireFightingCommand(map, notificationControl, sendAlertToTab, my_airports);
    map.addLayer(commandLayer);
    const savedCommands = loadCommandsFromStorage();
    savedCommands.forEach(cmd => {
        const line = L.polyline([cmd.airportCoords, cmd.fireCoords], {color: 'yellow', weight: 3}).addTo(map);
        commandLayer.addLayer(line);
        line.bindPopup(cmd.message);
    });
    L.easyButton('<img src="./assets/cndr.png" style="width:100%; height:auto;">', async function(btn, map) {
        await openCommandDialog();
    }, 'Send firefighting command').addTo(map);

    // Open new tab for alerts
    const alertsTab = window.open('', 'alertsTab', 'width=400,height=600');
    alertsTab.document.write('<html><head><title>Alerts</title></head><body><h1>Alerts</h1><div id="alerts"></div></body></html>');

    // Base layer definitions
    let mapBaseLayers = mapLayers();
    mapBaseLayers['OpenStreet'].addTo(map);
    const fireLayer = L.layerGroup();
    const flightLayer = L.layerGroup();
    const adsbLayer = L.layerGroup();
    fileUploader(map);

    try {
        await loadFires(fireLayer);
        map.addLayer(fireLayer);
        console.log('Fire layer added to map');
    } catch (error) {
        console.error('Error loading fires:', error);
    }

    try {
        await loadFlights(flightLayer);
        map.addLayer(flightLayer);
        console.log('Flights layer added to map');
    } catch (error) {
        console.log('Error loading flights', error);
    }

    try {
        await loadADSB(adsbLayer);
        map.addLayer(adsbLayer);
        console.log('ADSB layer added to map')
    } catch (error) {
        console.log('Error loading adsb', error)
    }

    
    const airportMarkers = [];

    for (let airport of airportsData()) {
        let apt = L.marker([airport.lat, airport.lon]);
        airportMarkers.push(apt);
    }

    const airportLayer = L.layerGroup(airportMarkers);
    
    let overlayData = {
    "Airports": airportLayer,
    "Fires": fireLayer,
    "Flights": flightLayer,
    "ADSB": adsbLayer,
    "Loaded Files": loadedFileLayers()
    };
    

    // Add layer control to map
    L.control.layers(mapBaseLayers, overlayData).addTo(map);


    ///////////////////
    

    window.acknowledgeCommand = function(lineId) {
        // Find the line by its Leaflet ID
        const line = commandLayer.getLayers().find(layer => layer._leaflet_id === parseInt(lineId));
        
        if (line) {
            // Change the line color to green
            line.setStyle({color: 'green'});
            
            // Get the IP address of the client
            fetch('https://api.ipify.org?format=json')
                .then(response => response.json())
                .then(data => {
                    const ipAddress = data.ip;
                    
                    // Send acknowledgment to server
                    sendAcknowledgmentToServer(lineId, ipAddress);
                    // Remove the warning notification
                    //notificationControl.success(`Command acknowledged by IP: ${ipAddress}`);

                    const newPopupContent = `Command acknowledged by IP: ${ipAddress}`;
                    sendAlertToTab(timeStampPrint() + ' ' +newPopupContent);
                    line.setPopupContent(newPopupContent);
                    line.openPopup();
                    socket.emit('commandAcknowledged', { lineId, ipAddress });
                    //line.bindPopup(newPopupContent).openPopup();
                })
                .catch(error => {
                    console.error('Error getting IP address:', error);
                });
        } else {
            console.error('Line not found');
        }
    }

    
    
    
    
    
    map.on('draw:created', function (e) {
        const layer = e.layer;
        let shapeData;
        if (e.layerType === 'circle') {
            shapeData = {
                type: 'Circle',
                coordinates: [layer.getLatLng().lng, layer.getLatLng().lat],
                radius: layer.getRadius()
            };
        } else {
            shapeData = layer.toGeoJSON().geometry;
        }
        drawnItems.addLayer(layer);
        layer.bindPopup(createFormPopup()).openPopup();
    
        // Handle form submission
        document.getElementById('shape-form').addEventListener('submit', async function(e) {
            e.preventDefault();
            const name = document.getElementById('input_name').value;
            const description = document.getElementById('input_desc').value;
            
            shapeData.name = name;
            shapeData.description = description;
            try {
                const savedShape = await saveShape(shapeData);
                console.log('Drawing saved:', savedShape);
                layer.id = saveShape.id;
                layer.bindPopup(`Name: ${name}<br>Description: ${description}`);
                //layer.bindPopup(`Name: ${name}<br>Description: ${description}`);
                //layer.setPopupContent(`Name: ${name}<br>Description: ${description}`);
                // Refresh the page after saving
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } catch (error) {
                console.error('Error saving drawing:', error);
                layer.setPopupContent('Error saving drawing. Please try again.');
            }
        });
    });

    

    function sendAlertToTab(message) {
        if (alertsTab && !alertsTab.closed) {
            console.log('Sending alert to tab:', message); // Debugging
            alertsTab.document.getElementById('alerts').innerHTML += `<p>${message}</p>`;
        } else {
            console.error('Alerts tab is not available or closed');
        }
    }
    

    // Ensure the new tab is fully loaded before using it
    setTimeout(() => {
        setInterval(() => checkADSBInShapes(sendAlertToTab), UPDATE_INTERVAL);
    }, 500);

    setInterval(() => loadFlights(flightLayer), UPDATE_INTERVAL);
    setInterval(() => loadADSB(adsbLayer), UPDATE_INTERVAL);


    function updateShape(layer) {
        const id = layer.id;
        let shapeData;
    
        if (layer instanceof L.Circle) {
            shapeData = {
                type: 'Circle',
                coordinates: [layer.getLatLng().lng, layer.getLatLng().lat],
                radius: layer.getRadius()
            };
        } else {
            shapeData = layer.toGeoJSON().geometry;
        }
        console.log(`Sending PUT request to: ${config.API_URL}/shapes/${id}`);
        console.log('Shape data:', shapeData);
    
        // Send updated shape data to server
        fetch(`${config.API_URL}/shapes/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(shapeData),
        })
        .then(response => response.json())
        .then(data => {
            console.log('Shape updated:', data);
        })
        .catch((error) => {
            console.error('Error updating shape:', error);
        });
    }
    
    function deleteShape(layer) {
        const id = layer.id;
    
        // Send delete request to server
        fetch(`${config.API_URL}/shapes/${id}`, {
            method: 'DELETE',
        })
        .then(response => response.json())
        .then(data => {
            console.log('Shape deleted:', data);
        })
        .catch((error) => {
            console.error('Error deleting shape:', error);
        });
    }
    map.on('draw:edited', function (e) {
        const layers = e.layers;
        layers.eachLayer(function (layer) {
            updateShape(layer);
        });
    });

    map.on('draw:deleted', function (e) {
        const layers = e.layers;
        layers.eachLayer(function (layer) {
            deleteShape(layer);
        });
        commandLayer.clearLayers();
    });

    async function checkADSBInShapes(sendAlert) {
        try {
            const adsbData = await getCurrentADSB();
            const drawnLayers = drawnItems.getLayers();
    
            adsbData.forEach(adsbPoint => {
                const point = turf.point([adsbPoint.longitude, adsbPoint.latitude]);
    
                drawnLayers.forEach(layer => {
                    let shape;
    
                    if (layer instanceof L.Circle) {
                        const center = layer.getLatLng();
                        shape = turf.circle([center.lng, center.lat], layer.getRadius() / 1000, { units: 'kilometers' });
                    } else {
                        shape = layer.toGeoJSON().geometry;
                    }
    
                    if (turf.booleanPointInPolygon(point, shape)) {
                        sendAlertToTab(`Airplane ${adsbPoint.id} is within shape with ID ${layer.id}!`);
                    }
                });
            });
        } catch (error) {
            console.error('Error checking ADSB data within shapes:', error);
        }
    }
    ////////////////////////////////////////////////
    // Listen for firefighting command broadcasts
    socket.on('firefightingCommand', (data) => {
        const line = L.polyline([data.airportCoords, data.fireCoords], { color: 'red', weight: 3 }).addTo(map);
        line._leaflet_id = data.lineId;
        commandLayer.addLayer(line);
        const popupContent = `
            ${data.message}<br><br>
            <button onclick="acknowledgeCommand('${line._leaflet_id}')">Acknowledge</button>
        `;
        line.bindPopup(popupContent);
        L.popup()
            .setLatLng([(data.airportCoords[0] + data.fireCoords[0]) / 2, (data.airportCoords[1] + data.fireCoords[1]) / 2])
            .setContent(popupContent)
            .openOn(map);
        sendAlertToTab(data.message);
        notificationControl.alert(data.message);
    });

    socket.on('commandAcknowledged', (data) => {
    // Find the line by its Leaflet ID
    const line = commandLayer.getLayers().find(layer => layer._leaflet_id === parseInt(data.lineId));

    if (line) {
        // Change the line color to green
        line.setStyle({ color: 'green' });

        const newPopupContent = `Command acknowledged by IP: ${data.ipAddress}`;
        line.setPopupContent(newPopupContent);
        line.openPopup();

        // Display a success notification
        notificationControl.success(`Command acknowledged by IP: ${data.ipAddress}`);
    } else {
        console.error('Line not found');
    }
});
    ////////////////////////
         
}


initializeMap();


