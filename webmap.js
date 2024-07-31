// Import the leaflet package
const L = require('leaflet');
require('leaflet-draw');
require('leaflet-draw-drag');
require('leaflet-realtime');
require('leaflet-easybutton');
require('leaflet-dialog');
require('leaflet-filelayer')(L);
require('leaflet-notifications');
const turf = require('@turf/turf');
const { mapLayers } = require('./mapUtils/mapOverlays');
const { loadDataMap } = require('./mapUtils/loadDataMap');
const { mapDrawControllers, mapFileImport }= require('./mapUtils/mapDrawControllers');
const {loadFires} = require('./mapUtils/loadFireData');
const imageUrls = require('./imageUrls');
const { loadFlights } = require('./mapUtils/loadFlightData');
const { loadADSB, getCurrentADSB } = require('./mapUtils/loadADSB');


const UPDATE_INTERVAL = 5000;
let globalFireData = [];


async function initializeMap() {
    const map = L.map('map', {zoomSnap: 0.25, zoomDelta: 0.5, boxZoom:true}).setView([38.11, 23.78], 14);
    const { drawnItems, createFormPopup, saveShape, loadShapes } = await loadDataMap();
    map.addLayer(drawnItems);
    console.log('Layers in drawnItems after loading:', drawnItems.getLayers());
    let drawController = mapDrawControllers(drawnItems);
    map.addControl(drawController);
    ///////////////////
    let notificationControl = L.control
        .notifications({
            position: 'bottomright',
            closable: true,
            dismissable: true,
            timeout: 300000,
            })
        .addTo(map);

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
                    notificationControl.success(lineId);

                // Display a success notification
                    // notificationControl.alert('Command acknowledged successfully', {
                    //     icon: 'check',
                    //     type: 'success',
                    //     closeButton: true,
                    //     autoClose: false,
                    //     id: `success-${lineId}` // Auto close after 5 seconds
                    // });
                    // Update the popup content
                    const newPopupContent = `Command acknowledged by IP: ${ipAddress}`;
                    line.setPopupContent(newPopupContent);
                    line.openPopup();
                    //line.bindPopup(newPopupContent).openPopup();
                })
                .catch(error => {
                    console.error('Error getting IP address:', error);
                });
        } else {
            console.error('Line not found');
        }
    }

    const my_airports = [
        { code: 'LGTT', name: 'Athens International Airport', lat: 37.9364, lon: 23.9445 },
        { code: 'LGAV', name: 'Eleftherios Venizelos International Airport', lat: 37.9364, lon: 23.9445 },
        // Add more airports as needed
    ];
    try {
        const {layer: fireLayer, data: fireData} = await loadFires();
        //map.addLayer(fireLayer);
        globalFireData = fireData; // Store the fire data globally
        console.log('Fire layer added to map');
    } catch (error) {
        console.error('Error loading fires:', error);
    }
    // Add this after initializing the map
    L.easyButton('<img src="./assets/cndr.png" style="width:100%; height:auto;">', function(btn, map) {
        fireFightingCommand();
    }, 'Send firefighting command').addTo(map);


    
    
    let commandLayer = new L.layerGroup().addTo(map);

    function fireFightingCommand() {
        if (window.currentDialog) {
            map.removeControl(window.currentDialog);
          }
        function openCommandDialog() {
            const dialog = L.control.dialog({
                size: [350, 350],
                minSize: [200, 200],
                maxSize: [500, 500],
                anchor: [50, 50],
                position: 'topleft',
                initOpen: true
            }).addTo(map);

            window.currentDialog = dialog;
            
            dialog.showClose();  // Add the built-in close button
            dialog.showResize(); // Add the built-in resize handle
        
            let content = `
                <h3>Send Firefighting Command</h3>
                <select id="airport-select">
                    <option value="">Select Airport</option>
                </select>
                <br><br>
                <select id="command-select">
                    <option value="">Select Command</option>
                    <option value="patrol">Patrol</option>
                    <option value="commit">Commit</option>
                </select>
                <br><br>
                <select id="fire-select">
                    <option value="">Select Fire</option>
                </select>
                <br><br>
                <button id="send-command">Send Command</button>
            `;
            
            dialog.setContent(content);
            
            // Populate airport and fire options
            populateAirportOptions();
            populateFireOptions(globalFireData);
            
            // Add event listener for the send button
            document.getElementById('send-command').addEventListener('click', function() {
                const airport = document.getElementById('airport-select').value;
                const command = document.getElementById('command-select').value;
                const fireIndex = document.getElementById('fire-select').value;
        
                if (airport && command && fireIndex !== "") {
                    sendFirefightingCommand(airport, command, parseInt(fireIndex));
                    dialog.close();
                } else {
                    alert('Please select all options');
                }
            });
        }
        
        
        function populateAirportOptions() {
            // Add logic to populate airport options
            // This will depend on how you store airport data
            const airportSelect = document.getElementById('airport-select');
            airportSelect.innerHTML = '<option value="">Select Airport</option>';  // Clear previous options
            my_airports.forEach(airport => {
                const option = document.createElement('option');
                option.value = airport.code;
                option.textContent = `${airport.name} (${airport.code})`;
                airportSelect.appendChild(option);
            });
        }
        
        function populateFireOptions(fireData) {
            const fireSelect = document.getElementById('fire-select');
            
            // Clear existing options
            fireSelect.innerHTML = '<option value="">Select Fire</option>';
        
            fireData.forEach((fire, index) => {
                const option = document.createElement('option');
                option.value = index; // Using index as value, you might want to use a unique identifier if available
                option.textContent = `Fire at ${fire.latitude}, ${fire.longitude} (${fire.acq_date} ${fire.acq_time})`;
                fireSelect.appendChild(option);
            });
        }
        function sendFirefightingCommand(airport, command, fireIndex) {
            const airportCoords = getAirportCoordinates(airport);
            const fireCoords = getFireCoordinates(fireIndex);
            
            if (!airportCoords || !fireCoords) {
                console.error('Invalid airport or fire data');
                return;
            }
        
            // Draw line on the map
            const line = L.polyline([airportCoords, fireCoords], {color: 'red', weight: 3}).addTo(map);
            commandLayer.addLayer(line);
            
            // Create message
            const airportName = my_airports.find(a => a.code === airport).name;
            const fire = globalFireData[fireIndex];
            const message = `Firefighting aircraft from ${airportName} (${airport}) has been commanded to ${command} the fire at ${fire.latitude}, ${fire.longitude}`;
            
            // Display message in the alerts tab
            sendAlertToTab(message);
            // Display notification alert
            notificationControl.alert(message, {
                closable: true,
                dismissable: true,
                icon: 'fa fa-exclamation-triangle',
                timeout: 3000000,
                id: line._leaflet_id,  // Use the line's ID to identify this
            });

            const popupContent = `
                ${message}<br><br>
                <button onclick="acknowledgeCommand('${line._leaflet_id}')">Acknowledge</button>
                `;
            line.bindPopup(popupContent);
            // Display a popup on the map
            L.popup()
                .setLatLng([(airportCoords[0] + fireCoords[0]) / 2, (airportCoords[1] + fireCoords[1]) / 2])
                .setContent(popupContent)
                .openOn(map);
        }
        
        function getAirportCoordinates(airportCode) {
            const airport = my_airports.find(a => a.code === airportCode);
            if (airport) {
                return [airport.lat, airport.lon];
            } else {
                console.error(`Airport with code ${airportCode} not found`);
                return null;
            }
        }

        function getFireCoordinates(fireIndex) {
            const fire = globalFireData[fireIndex];
            if (fire) {
                return [parseFloat(fire.latitude), parseFloat(fire.longitude)];
            } else {
                console.error(`Fire with index ${fireIndex} not found`);
                return null;
            }
        }
        openCommandDialog();
    };
    

    function sendAcknowledgmentToServer(lineId, ipAddress) {
        // Replace with your actual server endpoint
        fetch('/acknowledge-command', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                lineId: lineId,
                ipAddress: ipAddress,
            }),
        })
        .then(response => response.json())
        .then(data => {
            console.log('Acknowledgment sent to server:', data);
        })
        .catch(error => {
            console.error('Error sending acknowledgment to server:', error);
        });
    }  
    
    ///////////////////////
    
    const loadedFileLayers = L.layerGroup().addTo(map);

    const fileLayerControl = L.Control.fileLayerLoad({
        layer: L.geoJson,
        layerOptions: {style: {color:'red'}},
        addToMap: false,
        fileSizeLimit: 1024,
        formats: [
            '.geojson',
            '.kml',
            '.json',
            '.kml',
            '.gpx',
        ]
    });
    fileLayerControl.addTo(map);
    //var control = L.Control.fileLayerLoad();
    fileLayerControl.loader.on('data:loaded', function (e) {
        // Add the loaded layer to our layer group
        loadedFileLayers.addLayer(e.layer);
        // Fit the map to the loaded data
        map.fitBounds(e.layer.getBounds());
    });
    

    //const drawnItems = new L.FeatureGroup();
    const fireLayer = L.layerGroup();
    const flightLayer = L.layerGroup();
    const adsbLayer = L.layerGroup();
    // Base layer definitions
    let mapBaseLayers = mapLayers();
    mapBaseLayers['OpenStreet'].addTo(map);

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

    // Overlay layers
    //const lgtt = L.marker([38.11, 23.78]).bindPopup('lgtt');
    const lgtt = L.marker([38.11, 23.78]).addTo(map);
    //updateAirportMarkers();

    const airports = L.layerGroup([lgtt]);
    
    let overlayData = {
    "Airports": airports,
    "Fires": fireLayer,
    "Flights": flightLayer,
    "ADSB": adsbLayer,
    "Loaded Files": loadedFileLayers
    };
    

    // Add layer control to map
    L.control.layers(mapBaseLayers, overlayData).addTo(map);
    
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

    // Open new tab for alerts
    const alertsTab = window.open('', 'alertsTab', 'width=400,height=600');
    alertsTab.document.write('<html><head><title>Alerts</title></head><body><h1>Alerts</h1><div id="alerts"></div></body></html>');

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
        console.log(`Sending PUT request to: http://localhost:3000/shapes/${id}`);
        console.log('Shape data:', shapeData);
    
        // Send updated shape data to server
        fetch(`http://localhost:3000/shapes/${id}`, {
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
        fetch(`/shapes/${id}`, {
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
         
}


initializeMap();


