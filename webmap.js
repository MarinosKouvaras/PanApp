// Import the leaflet package
const L = require('leaflet');
require('leaflet-draw');
require('leaflet-draw-drag')
require('leaflet-realtime')
const turf = require('@turf/turf');
const { mapLayers } = require('./mapUtils/mapOverlays');
const { loadDataMap } = require('./mapUtils/loadDataMap');
const {loadFires} = require('./mapUtils/loadFireData');
const imageUrls = require('./imageUrls');
const { loadFlights } = require('./mapUtils/loadFlightData');
const { loadADSB, getCurrentADSB } = require('./mapUtils/loadADSB');


const UPDATE_INTERVAL = 10000;

//const drawnItems = new L.FeatureGroup();

// async function loadShapes() {
//     console.log('Loading shapes...');
//     const shapes = await fetchShapes();
//     console.log('Shapes to load:', shapes);
//     if (shapes && shapes.length > 0) {
//         shapes.forEach((shape, index) => {
//             console.log(`Processing shape ${index}:`, shape);
//             const layer = createLayerFromShape(shape);
//             if (layer) {
//                 drawnItems.addLayer(layer);
//                 console.log(`Added layer ${index} to map`);
//             } else {
//                 console.log(`Failed to create layer for shape ${index}:`, shape);
//             }
//         });
//     } else {
//         console.log('No shapes to load');
//     }
// }

async function initializeMap() {
    const map = L.map('map', {zoomSnap: 0.25, zoomDelta: 0.5, boxZoom:true}).setView([38.11, 23.78], 14);
    const { drawnItems, createFormPopup, saveShape, loadShapes } = await loadDataMap();
    map.addLayer(drawnItems);
    console.log('Layers in drawnItems after loading:', drawnItems.getLayers());

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
    //await loadDataMap(drawnItems);
    //await loadDataMap();
    //map.addLayer(drawnItems);
    //console.log('Layers in drawnItems after loading:', drawnItems.getLayers());

    // Overlay layers
    const lgtt = L.marker([38.11, 23.78]).bindPopup('lgtt');
    const airports = L.layerGroup([lgtt]);
    
    let overlayData = {
    "Airports": airports,
    "Fires": fireLayer,
    "Flights": flightLayer,
    "ADSB": adsbLayer
    };
    

    // Add layer control to map
    L.control.layers(mapBaseLayers, overlayData).addTo(map);
    
    const drawController = new L.Control.Draw({
        edit: {
            featureGroup: drawnItems,
            edit: true,
            remove: true 
        },
        draw : {
            polyline: {
                shapeOptions: {
                    color: '#f33bee',
                    weight: 20
                }
            },
            polygon: {
                shapeOptions: {
                    color: 'black',
                    fillColor: '#ab0707',
                    fillOpacity: 0.5
                }
            },
            rectangle: {
                shapeOptions: {
                    color: 'black',
                    fillColor: '#ab0707',
                    fillOpacity: 0.5
                }
            },
            circle: {
                shapeOptions: {
                    color: 'black',
                    fillColor: '#ab0707',
                    fillOpacity: 0.5
                }
            }
        }
    });
    map.addControl(drawController);

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
                layer.bindPopup(`Name: ${name}<br>Description: ${description}`);
                //layer.setPopupContent(`Name: ${name}<br>Description: ${description}`);
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


