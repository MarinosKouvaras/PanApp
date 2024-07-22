const L = require('leaflet');

function mapDrawControllers(drawnItems) {
    return new L.Control.Draw({
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
};

function mapFileImport() {
    return new L.Control.fileLayerLoad({
        // Allows you to use a customized version of L.geoJson.
        // For example if you are using the Proj4Leaflet leaflet plugin,
        // you can pass L.Proj.geoJson and load the files into the
        // L.Proj.GeoJson instead of the L.geoJson.
        layer: L.geoJson,
        // See http://leafletjs.com/reference.html#geojson-options
        layerOptions: {style: {color:'red'}},
        // Add to map after loading (default: true) ?
        addToMap: true,
        // File size limit in kb (default: 1024) ?
        fileSizeLimit: 1024,
        // Restrict accepted file formats (default: .geojson, .json, .kml, and .gpx) ?
        formats: [
            '.geojson',
            '.kml'
        ]});
}

module.exports = {
    mapDrawControllers,
    mapFileImport,
}