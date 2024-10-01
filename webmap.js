
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
const {checkADSBInShapes} = require('./mapUtils/airplaneInShape');
const config = require('./config');


const UPDATE_INTERVAL = 5000;
const { checkAuth } = require('./auth');
// Before initializing your map or any other functionality
checkAuth().then(() => {
    // Initialize your map and other functionality here
    initializeMap();
  }).catch(error => {
    console.error('Failed to authenticate:', error);
  });



async function initializeMap() {
    console.log(config.API_URL);
    const map = L.map('map', {zoomSnap: 0.25, zoomDelta: 0.5, boxZoom:true}).setView([38.11, 23.78], 12);
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
    let { createBaseLayers, createOverlayLayers } = mapLayers();
    let baseLayers = createBaseLayers();
    let overlayLayers = createOverlayLayers();
    baseLayers['OpenStreet'].addTo(map);
    overlayLayers['OpenAIP'].addTo(map);

    //////////////////
    // Assuming your Leaflet map is initialized and stored in a variable called 'map'

// Initialize Cesium viewer (make sure this is inside a check for Cesium's existence)
Cesium.Ion.defaultAccessToken ='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJjZjMwNzdhMi1kYmZmLTRlZGUtYmQ4MS1lNzQzYjNhYzBmNTIiLCJpZCI6MjM1MDI5LCJpYXQiOjE3MjM3NDM1NzR9.GwDT86zYf1SSHkarPDQeoLsgw0WVP7PCLdBKKSuq7AU'
let viewer;
if (typeof Cesium !== 'undefined') {
    viewer = new Cesium.Viewer("cesiumContainer", {
        terrainProvider: Cesium.createWorldTerrain({
            requestWaterMask: true,          // Enables water effects on oceans and other bodies of water
            requestVertexNormals: true,      // Enables lighting and shadows on terrain
        }),
        scene3DOnly: true,                    // Optimize for 3D
        shadows: true,                        // Enable shadows
        terrainShadows: Cesium.ShadowMode.ENABLED,
    });
    // Add an imagery layer on top of the terrain
    viewer.imageryLayers.addImageryProvider(
        new Cesium.IonImageryProvider({ assetId: 2 }) // Bing Maps Aerial imagery
    );
    // Hide Cesium viewer initially
    document.getElementById('cesiumContainer').style.display = 'none';
} else {
    console.error('Cesium is not loaded');
}
function setupToggleButton() {
    var toggleButton = document.getElementById('toggleView');
    var mapContainer = document.getElementById('map');
    var cesiumContainer = document.getElementById('cesiumContainer');

    if (toggleButton) {
        toggleButton.addEventListener('click', function() {
            console.log('Toggle button clicked'); // Add this line for debugging
            if (mapContainer.style.display !== 'none') {
                mapContainer.style.display = 'none';
                cesiumContainer.style.display = 'block';
                if (viewer && viewer.resize) {
                    viewer.resize();
                }
            } else {
                mapContainer.style.display = 'block';
                cesiumContainer.style.display = 'none';
                if (map && map.invalidateSize) {
                    map.invalidateSize();
                }
            }
        });
        console.log('Toggle button event listener added'); // Add this line for debugging
    } else {
        console.error('Toggle button not found');
    }
}
function addFiresToCesium(viewer, fireData) {
    fireData.forEach(fire => {
        const entity = viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(fire.longitude, fire.latitude),
            billboard: {
                image: imageUrls.fireIcon,  // Path to the fire icon
                scale: 0.3,  // Scale of the icon
                scaleByDistance: new Cesium.NearFarScalar(
                    1.5e2, 1.0, // Full size when near (150m)
                    8.0e6, 0.5 // Smaller when far (8,000km)
                ),
                disableDepthTestDistance: Number.POSITIVE_INFINITY,  // Disable depth testing so the icon is always on top
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM, // Anchor the icon to the bottom of the point
                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, // Ensure it follows the terrain
            },
            name: fire.name, // Optional: Name or other metadata
            description: fire.description // Optional: Description or other info
        });
    });
}
    //////////////////
    let fireLayer = L.layerGroup();
    const flightLayer = L.layerGroup();
    const adsbLayer = L.layerGroup();
    fileUploader(map);

    try {
        const fireResult = await loadFires(fireLayer);
        fireLayer = fireResult.layer;
        fireData = fireResult.data;
        map.addLayer(fireLayer);
        console.log('Fire layer added to map');
        if (typeof Cesium !== 'undefined' && viewer) {
            addFiresToCesium(viewer, fireData);
        }
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
    "Loaded Files": loadedFileLayers(),
    "OpenAIP": overlayLayers['OpenAIP']
    };
    

    // Add layer control to map
    L.control.layers(baseLayers, overlayData).addTo(map);
    // Ensure OpenAIP layer stays on top when base layer changes
    map.on('baselayerchange', function (e) {
        if (map.hasLayer(overlayLayers['OpenAIP'])) {
            overlayLayers['OpenAIP'].bringToFront();
        }
    });

    // Optional: If you want to ensure OpenAIP is always visible
    map.on('overlayadd', function (e) {
        if (e.name === 'OpenAIP') {
            e.layer.bringToFront();
        }
    });


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
            alertsTab.document.getElementById('alerts').innerHTML += `<p>${timeStampPrint()+' '+message}</p>`;
        } else {
            console.error('Alerts tab is not available or closed');
        }
    }

    

    // Ensure the new tab is fully loaded before using it
    setTimeout(() => {
        setInterval(async () => {
            const messages = await checkADSBInShapes(); // Use existingLayer if necessary
            messages.forEach(msg => sendAlertToTab(msg)); // Send each message to the alert tab
        }, UPDATE_INTERVAL);
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
        localStorage.clear();
    });

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
    document.addEventListener('DOMContentLoaded', setupToggleButton);

    // Also set up the button after a short delay
    setTimeout(setupToggleButton, 1000);        
}





