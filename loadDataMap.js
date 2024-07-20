

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
        // Function to reverse the coordinates
        function reverseCoordinates(coords) {
            if (Array.isArray(coords[0])) {
                return coords.map(reverseCoordinates); // Recursively reverse nested arrays
            } else {
                return [coords[1], coords[0]]; // Swap latitude and longitude
            }
        }

        let reversedCoordinates = reverseCoordinates(coordinates);
        
        let layer;
        if (shape.type === 'Circle') {
            //layer = L.circle(coordinates, { radius: shape.radius });
            const center = [coordinates[1], coordinates[0]];
            //layer = L.circle(center, { radius: shape.radius, editable: true });
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
            
            //layer = L.geoJSON(geoJSON)

            //layer = L.geoJSON(geoJSON);
            //layer = L.geoJSON(geoJSON, {editable: true});
        
            switch(shape.type) {
                case 'Polygon':
                    layer = L.polygon(reversedCoordinates[0]); // For polygons, use the first array of coordinates
                    break;
                case 'LineString':
                    layer = L.polyline(reversedCoordinates);
                    break;
                case 'Point':
                    layer = L.marker(reversedCoordinates);
                    break;
                case 'Rectangle':
                    layer = L.rectangle(reversedCoordinates);
                    break;
                default:
                    console.error('Unsupported shape type:', shape.type);
                    return null;
            }
        }
        
        if (layer) {
            layer.id = shape.id; // Store the database ID on the layer
            layer.name = shape.name;  // Set the name
            layer.description = shape.description;  // Set the description
            layer.bindPopup(`ID: ${shape.id}<br>Name: ${shape.name}<br>Description: ${shape.description}`);
            //layer.feature = geoJSON;
        }

        //layer.bindPopup(`Name: ${shape.name}<br>Description: ${shape.description}`);

        console.log('Created layer:', layer);

        return layer;
    } catch (error) {
        console.error('Error creating layer:', error);
        return null;
    }
}

// async function saveShape(shape, name, description) {
//     let data;
//     if (shape.geometry.type === 'Point' && shape.properties.radius) {
//         // This is a circle
//         data = {
//             type: 'Circle',
//             coordinates: JSON.stringify(shape.geometry.coordinates),
//             radius: shape.properties.radius,
//             name: name,
//             description: description,
//         };
//     } else {
//         data = {
//             type: shape.geometry.type,
//             coordinates: JSON.stringify(shape.geometry.coordinates),
//             name: name,
//             description: description,
//         };
//     }
//     console.log('Sending shape data:', data);

//     try {
//         const response = await fetch('http://localhost:3000/shapes', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//             },
//             body: JSON.stringify(data),
//         });
//         if (!response.ok) {
//             const errorText = await response.text();
//             throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
//         }
//         return response.json();
//     } catch (error) {
//         console.error('Error saving shape:', error);
//         throw error;
//     }
// }
// async function saveShape(layer, name, description) {
//     let data;
//     const geoJSON = layer.toGeoJSON();

//     if (layer instanceof L.Circle) {
//         data = {
//             type: 'Circle',
//             coordinates: JSON.stringify([layer.getLatLng().lng, layer.getLatLng().lat]),
//             radius: layer.getRadius(),
//             name: name,
//             description: description,
//         };
//     } else {
//         data = {
//             type: geoJSON.geometry.type,
//             coordinates: JSON.stringify(geoJSON.geometry.coordinates),
//             name: name,
//             description: description,
//         };
//     }

//     console.log('Sending shape data:', data);

//     try {
//         const response = await fetch('http://localhost:3000/shapes', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//             },
//             body: JSON.stringify(data),
//         });
//         if (!response.ok) {
//             const errorText = await response.text();
//             throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
//         }
//         return response.json();
//     } catch (error) {
//         console.error('Error saving shape:', error);
//         throw error;
//     }
// }

async function saveShape(shapeData) {
    console.log('Sending shape data:', shapeData);

    try {
        const response = await fetch('http://localhost:3000/shapes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(shapeData),
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

module.exports = {
    createFormPopup,
    fetchShapes,
    createLayerFromShape,
    saveShape
};