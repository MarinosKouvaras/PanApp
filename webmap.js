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
	"TacticalMap": L.tileLayer('https://tile.jawg.io/jawg-dark/{z}/{x}/{y}{r}.png?access-token={accessToken}', {
		attribution: '<a href="https://jawg.io" title="Tiles Courtesy of Jawg Maps" target="_blank">&copy; <b>Jawg</b>Maps</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
		minZoom: 0,
		maxZoom: 22,
		accessToken: '<your accessToken>'
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

map.on(L.Draw.Event.CREATED, function (event) {
	let type = event.layerType;
    let layer = event.layer;
	
	let shape = layer.toGeoJSON();
	console.log(shape);
  	let shape_for_db = JSON.stringify(shape);
	console.log(shape_for_db)

    if (type === 'marker') {
        // Do marker specific actions
    }

    // Do whatever else you need to. (save to db, add to map etc)
    drawnItems.addLayer(layer);
	createFormPopup();
	drawnItems.eachLayer(function(layer) {
        geojson = JSON.stringify(layer.toGeoJSON().geometry);    
        console.log(geojson);
    });
});
map.on('draw:edited', function (e) {
	let layers = e.layers;
	console.log("EDIT");
	layers.eachLayer(function (layer) {
		//do whatever you want; most likely save back to db
	});
});

let popup = L.popup();


