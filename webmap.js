// Import the leaflet package
const L = require('leaflet');
require('leaflet-draw');
require('leaflet-draw-drag')
require('leaflet-realtime')
const {createFormPopup,fetchShapes, createLayerFromShape, saveShape} = require('./loadDataMap');
const {loadFires} = require('./loadFireData');
const imageUrls = require('./imageUrls');
const { loadFlights } = require('./loadFlightData');
const { loadADSB } = require('./loadADSB');


const UPDATE_INTERVAL = 10000;

const drawnItems = new L.FeatureGroup();
async function loadShapes() {
    console.log('Loading shapes...');
    const shapes = await fetchShapes();
    console.log('Shapes to load:', shapes);
    if (shapes && shapes.length > 0) {
        shapes.forEach((shape, index) => {
            console.log(`Processing shape ${index}:`, shape);
            const layer = createLayerFromShape(shape);
            if (layer) {
                drawnItems.addLayer(layer);
                console.log(`Added layer ${index} to map`);
            } else {
                console.log(`Failed to create layer for shape ${index}:`, shape);
            }
        });
    } else {
        console.log('No shapes to load');
    }
}

async function initializeMap() {
    const map = L.map('map', {zoomSnap: 0.25, zoomDelta: 0.5, boxZoom:true}).setView([38.11, 23.78], 14);
    map.addLayer(drawnItems);

    const fireLayer = L.layerGroup();
    const flightLayer = L.layerGroup();
    const adsbLayer = L.layerGroup();
    // Base layer definitions
    const baseLayers = {
        "OpenStreet": L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }),
        "CartoDB_DarkMatter" : L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 20
        }),
        "Terrain": L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
            minZoom: 0,
            maxZoom: 22,
        })
    };
    baseLayers["OpenStreet"].addTo(map);

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
    await loadShapes();
    console.log('Layers in drawnItems after loading:', drawnItems.getLayers());

    

    

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
    L.control.layers(baseLayers, overlayData).addTo(map);
    
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
   
}


initializeMap();


