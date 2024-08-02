const L = require('leaflet');

let loadedFileLayers;

function fileUploader(map) {
    loadedFileLayers = new L.layerGroup().addTo(map);

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

    fileLayerControl.loader.on('data:loaded', function (e) {
        // Add the loaded layer to our layer group
        loadedFileLayers.addLayer(e.layer);
        // Fit the map to the loaded data
        map.fitBounds(e.layer.getBounds());
    });

    return loadedFileLayers;

}

module.exports = {
    fileUploader,
    loadedFileLayers: () => loadedFileLayers
};

