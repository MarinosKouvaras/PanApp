// Import the leaflet package
const L = require('leaflet');
require('leaflet-draw');
require('leaflet-draw-drag')
const {createFormPopup,fetchShapes, createLayerFromShape, saveShape} = require('./loadDataMap');


// Map initialization
const map = L.map('map', {zoomSnap: 0.25, zoomDelta: 0.5, boxZoom:true}).setView([38.11, 23.78], 14);
// Initialize the FeatureGroup to store editable layers
const drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);

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
        // Fit the map to the bounds of all shapes
        map.fitBounds(drawnItems.getBounds());
    } else {
        console.log('No shapes to load');
    }
}

async function initializeMap() {
    await loadShapes();
    console.log('Layers in drawnItems after loading:', drawnItems.getLayers());

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

    // Overlay layers
    const lgtt = L.marker([38.11, 23.78]).bindPopup('lgtt');
    const airports = L.layerGroup([lgtt]);
    const overlayAirports = {
    "Airports": airports
    };

    // Add layer control to map
    L.control.layers(baseLayers, overlayAirports).addTo(map);
    baseLayers["OpenStreet"].addTo(map);

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
        const shape = layer;
        //alert(layer);
        if (e.layerType === 'circle') {
            shape.properties.radius = layer.getRadius();
        }
        drawnItems.addLayer(layer);
        layer.bindPopup(createFormPopup()).openPopup();
    
        // Handle form submission
        document.getElementById('shape-form').addEventListener('submit', async function(e) {
            e.preventDefault();
            const name = document.getElementById('input_name').value;
            const description = document.getElementById('input_desc').value;
            try {
                const savedShape = await saveShape(shape, name, description);
                console.log('Drawing saved:', savedShape);
                layer.setPopupContent(`Name: ${name}<br>Description: ${description}`);
            } catch (error) {
                console.error('Error saving drawing:', error);
                layer.setPopupContent('Error saving drawing. Please try again.');
            }
        });
    });

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
    
        // Send updated shape data to server
        fetch(`/api/shapes/${id}`, {
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
        fetch(`/api/shapes/${id}`, {
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


