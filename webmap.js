// Import the leaflet package
let L = require('leaflet');
let drawControl = require('leaflet-draw-drag');


// map initialization
let map = L.map('map', {zoomSnap: 0.25, zoomDelta: 0.5, boxZoom:true}).setView([38.11, 23.78], 14);

// map osm selection
let baseLayers = {
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
let lgtt = L.marker([38.11, 23.78]).bindPopup('lgtt');
let airports = L.layerGroup([lgtt]);

let overlayAirports = {
	"Airports": airports
}


L.control.layers(baseLayers, overlayAirports).addTo(map);
baseLayers["OpenStreet"].addTo(map)

// Initialize the FeatureGroup to store editable layers
let drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);

// Initialize the draw control and pass it the FeatureGroup of editable layers
drawControl = new L.Control.Draw({
    edit: {
        featureGroup: drawnItems
    },
	draw : {
		polyline: {
			shapeOptions: {
				color: '#f33bee', // Border color
				weight: 20
			}
		},
		polygon: {
			shapeOptions: {
				color: 'black', // Border color
				fillColor: '#ab0707', // Fill color
				fillOpacity: 0.5 // Fill opacity
			}
		},
		rectangle: {
			shapeOptions: {
				color: 'black', // Border color
				fillColor: '#ab0707', // Fill color
				fillOpacity: 0.5 // Fill opacity
			}
		},
		circle: {
			shapeOptions: {
				color: 'black', // Border color
				fillColor: '#ab0707', // Fill color
				fillOpacity: 0.5 // Fill opacity
			}
		}
	}
});
map.addControl(drawControl);

function createFormPopup() {
    let popupContent =
        '<form>Description:<br>' +
        '<input type="text" id="input_desc"><br>' +
        'Name:<br>' +
        '<input type="text" id="input_name"><br>' +
        '<input type="button" value="Submit" id="submit">' + 
        '</form>';
    drawnItems.bindPopup(popupContent).openPopup();
}

map.on('draw:created', function (e) {
	let type = e.layerType;
    let layer = e.layer;
	console.log(type)
	let shape = layer.toGeoJSON();
	console.log(shape.geometry.type)
	if (shape.geometry.type === 'Polygon') {
		console.log(shape, "HEY");
		let shape_for_db = JSON.stringify(shape);
		console.log(shape_for_db)
	}
    // Do whatever else you need to. (save to db, add to map etc)
    drawnItems.addLayer(layer);
	createFormPopup();
	//drawnItems.eachLayer(function(layer) {
    //    let geojson = JSON.stringify(layer.toGeoJSON().geometry);
    //    console.log(geojson);
    //});
});
map.on('draw:edited', function (e) {
	let layers = e.layers;
	console.log("EDIT");
	layers.eachLayer(function (layer) {
		//do whatever you want; most likely save back to db
	});
});

let popup = L.popup();


