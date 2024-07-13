// // Import the leaflet package
// let L = require('leaflet');
// let drawControl = require('leaflet-draw-drag');


// // map initialization
// let map = L.map('map', {zoomSnap: 0.25, zoomDelta: 0.5, boxZoom:true}).setView([38.11, 23.78], 14);

// // map osm selection
// let baseLayers = {
// 	"OpenStreet": L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
// 		maxZoom: 19,
// 		attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
// 	}),
// 		"CartoDB_DarkMatter" : L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
// 			attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
// 			subdomains: 'abcd',
// 			maxZoom: 20
// 		}),
// 	"Terrain": L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
// 		attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
// 		minZoom: 0,
// 		maxZoom: 22,
// 	})
// };
// let lgtt = L.marker([38.11, 23.78]).bindPopup('lgtt');
// let airports = L.layerGroup([lgtt]);

// let overlayAirports = {
// 	"Airports": airports
// }


// L.control.layers(baseLayers, overlayAirports).addTo(map);
// baseLayers["OpenStreet"].addTo(map)

// // Initialize the FeatureGroup to store editable layers
// let drawnItems = new L.FeatureGroup();
// map.addLayer(drawnItems);

// // Initialize the draw control and pass it the FeatureGroup of editable layers
// drawControl = new L.Control.Draw({
//     edit: {
//         featureGroup: drawnItems
//     },
// 	draw : {
// 		polyline: {
// 			shapeOptions: {
// 				color: '#f33bee', // Border color
// 				weight: 20
// 			}
// 		},
// 		polygon: {
// 			shapeOptions: {
// 				color: 'black', // Border color
// 				fillColor: '#ab0707', // Fill color
// 				fillOpacity: 0.5 // Fill opacity
// 			}
// 		},
// 		rectangle: {
// 			shapeOptions: {
// 				color: 'black', // Border color
// 				fillColor: '#ab0707', // Fill color
// 				fillOpacity: 0.5 // Fill opacity
// 			}
// 		},
// 		circle: {
// 			shapeOptions: {
// 				color: 'black', // Border color
// 				fillColor: '#ab0707', // Fill color
// 				fillOpacity: 0.5 // Fill opacity
// 			}
// 		}
// 	}
// });
// map.addControl(drawControl);

// function createFormPopup() {
//     let popupContent =
//         '<form>Description:<br>' +
//         '<input type="text" id="input_desc"><br>' +
//         'Name:<br>' +
//         '<input type="text" id="input_name"><br>' +
//         '<input type="button" value="Submit" id="submit">' + 
//         '</form>';
//     drawnItems.bindPopup(popupContent).openPopup();
// }

// map.on('draw:created', function (e) {
// 	let type = e.layerType;
//     let layer = e.layer;
// 	console.log(type)
// 	let shape = layer.toGeoJSON();
// 	console.log(shape.geometry.type)
// 	if (shape.geometry.type === 'Polygon') {
// 		console.log(shape, "HEY");
// 		let shape_for_db = JSON.stringify(shape);
// 		console.log(shape_for_db)
// 	}
//     // Do whatever else you need to. (save to db, add to map etc)
//     drawnItems.addLayer(layer);
// 	createFormPopup();
// 	//drawnItems.eachLayer(function(layer) {
//     //    let geojson = JSON.stringify(layer.toGeoJSON().geometry);
//     //    console.log(geojson);
//     //});
// });
// map.on('draw:edited', function (e) {
// 	let layers = e.layers;
// 	console.log("EDIT");
// 	layers.eachLayer(function (layer) {
// 		//do whatever you want; most likely save back to db
// 	});
// });



// let popup = L.popup();


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
    const popupContent =
        '<form id="shape-form">' +
        'Description:<br><input type="text" id="input_desc"><br>' +
        'Name:<br><input type="text" id="input_name"><br>' +
        '<input type="submit" value="Submit">' + 
        '</form>';
    drawnItems.bindPopup(popupContent).openPopup();
}

async function fetchDrawings() {
    try {
        const response = await fetch('http://localhost:3000/drawings');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        console.log('Received data:', data);
		//console.log(data.drawings)
        return data.drawings; // Return just the drawings array
    } catch (error) {
        console.error('Error fetching drawings:', error);
    }
}

function createLayerFromDrawing(drawing) {
    let my_layer;
    let geoJSON = drawing.coordinates; // The coordinates are already an object, no need to parse

    console.log('Processing drawing:', drawing); // For debugging

    switch (geoJSON.type) {
        case 'Point':
            my_layer = L.marker([geoJSON.coordinates[1], geoJSON.coordinates[0]]);
            break;
        case 'LineString':
            my_layer = L.polyline(geoJSON.coordinates.map(coord => [coord[1], coord[0]]));
            break;
        case 'Polygon':
            my_layer = L.polygon(geoJSON.coordinates[0].map(coord => [coord[1], coord[0]]));
            break;
        // Add cases for other geometry types as needed
        default:
            console.warn('Unsupported geometry type:', geoJSON.type);
            return null;
    }

    if (my_layer) {
        my_layer.bindPopup(`Type: ${drawing.type}<br>User ID: ${drawing.userId}`);
    }

    return my_layer;
}

async function loadDrawings() {
    console.log('Loading drawings...');
    const drawings = await fetchDrawings();
    console.log('Drawings to load:', drawings);
    if (drawings && drawings.length > 0) {
      drawings.forEach(drawing => {
        console.log('Processing drawing:', drawing);
        const layer = createLayerFromDrawing(drawing);
        if (layer) {
          drawnItems.addLayer(layer);
          console.log('Added layer to map');
        } else {
          console.log('Failed to create layer for drawing:', drawing);
        }
      });
    } else {
      console.log('No drawings to load');
    }
}

async function saveShape(shape, name, description) {
    try {
        const response = await fetch('/drawings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type: shape.geometry.type,
                coordinates: JSON.stringify(shape.geometry.coordinates),
                name: name,
                description: description,
            }),
        });
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const savedDrawing = await response.json();
        const layer = createLayerFromDrawing(savedDrawing);
        if (layer) {
            drawnItems.addLayer(layer);
        }
        return savedDrawing;
    } catch (error) {
        console.error('Error:', error);
    }
}


map.on('draw:created', function (e) {
    const layer = e.layer;
	alert(layer);
    drawnItems.addLayer(layer);
    createFormPopup();

    // Handle form submission
    document.getElementById('shape-form').addEventListener('submit', async function(event) {
        event.preventDefault();
        const name = document.getElementById('input_name').value;
        const description = document.getElementById('input_desc').value;
        const shape = layer.toGeoJSON();
        await saveShape(shape, name, description);
        drawnItems.closePopup();
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

loadDrawings();
// Add this after map initialization
L.marker([51.5, -0.09]).addTo(map)
    .bindPopup('A test marker')
    .openPopup();
let popup = L.popup();

