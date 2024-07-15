// Import the leaflet package
const L = require('leaflet');
const drawControl = require('leaflet-draw-drag');

// Map initialization
const map = L.map('map', {zoomSnap: 0.25, zoomDelta: 0.5, boxZoom:true}).setView([38.11, 23.78], 14);

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



// Initialize the FeatureGroup to store editable layers
const drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);

// Initialize the draw control and pass it the FeatureGroup of editable layers
const drawController = new L.Control.Draw({
    edit: {
        featureGroup: drawnItems
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

function createFormPopup() {
    return `<form id="shape-form">
        Name: <input type="text" id="input_name"><br>
        Description: <input type="text" id="input_desc"><br>
        <input type="submit" value="Save">
    </form>`;
}

async function fetchShapes() {
    try {
        const response = await fetch('http://localhost:3000/shapes');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        console.log('Received data:', data);
		//console.log(data.drawings)
        return data.shapes; // Return just the shape array
    } catch (error) {
        console.error('Error fetching drawings:', error);
    }
}


function createLayerFromShape(shape) {
    console.log('Creating layer from shape:', shape);
    try {
        let coordinates = Array.isArray(shape.coordinates) ? shape.coordinates : JSON.parse(shape.coordinates);
        
        let layer;
        if (shape.type === 'Circle') {
            //layer = L.circle(coordinates, { radius: shape.radius });
            const center = [coordinates[1], coordinates[0]];
            layer = L.circle(center, { radius: shape.radius });
        } else {
            const geoJSON = {
                type: 'Feature',
                geometry: {
                    type: shape.type,
                    coordinates: coordinates
                },
                properties: {
                    name: shape.name,
                    description: shape.description
                }
            };

            layer = L.geoJSON(geoJSON);
        }

        layer.bindPopup(`Name: ${shape.name}<br>Description: ${shape.description}`);

        console.log('Created layer:', layer);

        return layer;
    } catch (error) {
        console.error('Error creating layer:', error);
        return null;
    }
}
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


async function saveShape(shape, name, description) {
    let data;
    if (shape.geometry.type === 'Point' && shape.properties.radius) {
        // This is a circle
        data = {
            type: 'Circle',
            coordinates: JSON.stringify(shape.geometry.coordinates),
            radius: shape.properties.radius,
            name: name,
            description: description,
        };
    } else {
        data = {
            type: shape.geometry.type,
            coordinates: JSON.stringify(shape.geometry.coordinates),
            name: name,
            description: description,
        };
    }
    console.log('Sending shape data:', data);

    try {
        const response = await fetch('http://localhost:3000/shapes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
        return response.json();
    } catch (error) {
        console.error('Error saving shape:', error);
        throw error;
    }
}

map.on('draw:created', function (e) {
    const layer = e.layer;
    const shape = layer.toGeoJSON();
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

map.on('draw:edited', function (e) {
    const layers = e.layers;
    layers.eachLayer(function (layer) {
        const shape = layer.toGeoJSON();
        console.log('Edited shape:', shape);
        // Here you could update the shape in your backend
    });
});

map.on('draw:deleted', function (e) {
    const layers = e.layers;
    layers.eachLayer(function (layer) {
        const shape = layer.toGeoJSON();
        console.log('Deleted shape:', shape);
        // Here you could delete the shape from your backend
    });
});

loadShapes();


