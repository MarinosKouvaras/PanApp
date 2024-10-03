const { loadADSB, getCurrentADSB } = require('./loadADSB');
const { loadDataMap } = require('./loadDataMap');
const turf = require('@turf/turf');
const L = require('leaflet');

let aircraftInShapes = {}; // Current state of aircraft in shapes
let lastAlertState = {}; // Keep track of the last alert state for each aircraft and shape

async function checkADSBInShapes(drawnItems) {
    try {
        let messages = []; // Move messages array inside the try block

        //const drawnItems = (await loadDataMap()).drawnItems;
        const adsbData = await getCurrentADSB();
        const drawnLayers = drawnItems.getLayers();

        // Create a set to keep track of the aircraft currently in shapes
        const currentAircraftInShapes = {};

        adsbData.forEach(adsbPoint => {
            const point = turf.point([adsbPoint.longitude, adsbPoint.latitude]);

            drawnLayers.forEach(layer => {
                let shape;
                let shapeId = layer.id;
                let shapeName = layer.name

                // Create shape based on layer type
                if (layer instanceof L.Circle) {
                    const center = layer.getLatLng();
                    shape = turf.circle([center.lng, center.lat], layer.getRadius() / 1000, { units: 'kilometers' });
                } else {
                    shape = layer.toGeoJSON().geometry;
                }

                const isInsideShape = turf.booleanPointInPolygon(point, shape);
                if (!aircraftInShapes[adsbPoint.id]) {
                    aircraftInShapes[adsbPoint.id] = {};
                }

                // Check if the aircraft is inside the shape
                if (isInsideShape) {
                    currentAircraftInShapes[adsbPoint.id] = currentAircraftInShapes[adsbPoint.id] || {};
                    currentAircraftInShapes[adsbPoint.id][shapeId] = true;
                } else {
                    currentAircraftInShapes[adsbPoint.id] = currentAircraftInShapes[adsbPoint.id] || {};
                    currentAircraftInShapes[adsbPoint.id][shapeId] = false; // Explicitly mark outside
                }

                // Previous state of the aircraft in the shape
                const wasInsideShape = aircraftInShapes[adsbPoint.id][shapeId];
                
                // Initialize last alert state if not set
                lastAlertState[adsbPoint.id] = lastAlertState[adsbPoint.id] || {};
                lastAlertState[adsbPoint.id][shapeId] = lastAlertState[adsbPoint.id][shapeId] || { lastState: null };

                // Entering the shape
                if (isInsideShape && !wasInsideShape) {
                    const message = `Airplane ${adsbPoint.id} has entered shape with ID ${shapeId}-${shapeName}!`;
                    if (lastAlertState[adsbPoint.id][shapeId].lastState !== 'entered') {
                        messages.push(message);
                        lastAlertState[adsbPoint.id][shapeId].lastState = 'entered'; // Update the last state
                    }
                }

                // Exiting the shape
                if (!isInsideShape && wasInsideShape) {
                    const message = `Airplane ${adsbPoint.id} has exited shape with ID ${shapeId}-${shapeName}!`;
                    if (lastAlertState[adsbPoint.id][shapeId].lastState !== 'exited') {
                        messages.push(message);
                        lastAlertState[adsbPoint.id][shapeId].lastState = 'exited'; // Update the last state
                    }
                }
            });
        });

        // Update the aircraftInShapes state after checking all aircraft
        Object.keys(aircraftInShapes).forEach(aircraftId => {
            drawnLayers.forEach(layer => {
                const shapeId = layer.id;

                // Update aircraftInShapes based on currentAircraftInShapes state
                if (currentAircraftInShapes[aircraftId] && currentAircraftInShapes[aircraftId][shapeId]) {
                    aircraftInShapes[aircraftId][shapeId] = true; // Mark as inside
                } else {
                    aircraftInShapes[aircraftId][shapeId] = false; // Mark as outside
                }
            });
        });

        return messages; // Return the messages array

    } catch (error) {
        console.error('Error checking ADSB data within shapes:', error);
        return []; // Return an empty array in case of error
    }
}

module.exports = {
    checkADSBInShapes
};
