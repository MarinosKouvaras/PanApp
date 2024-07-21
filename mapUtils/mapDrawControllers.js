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

module.exports = {
    mapDrawControllers,
}