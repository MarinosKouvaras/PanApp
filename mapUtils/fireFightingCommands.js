const { loadFires } = require('./loadFireData');

async function fireFightingFeature() {
    let globalFireData = [];

    try {
        const { layer: fireLayer, data: fireData } = await loadFires();
        globalFireData = fireData; // Store the fire data globally
        console.log('Fire data loaded:', globalFireData);
    } catch (error) {
        console.error('Error loading fires:', error);
    }

    return {
        globalFireData,
        getFireCoordinates: function(fireIndex) {
            const fire = globalFireData[fireIndex];
            if (fire) {
                return [parseFloat(fire.latitude), parseFloat(fire.longitude)];
            } else {
                console.error(`Fire with index ${fireIndex} not found`);
                return null;
            }
        }
    };
}

function fireFightingCommand(map, notificationControl, sendAlertToTab, my_airports) {
    let firefightingFeatureInstance;
    let commandLayer = new L.layerGroup().addTo(map);

    async function openCommandDialog() {
        if (window.currentDialog) {
            window.currentDialog.remove(); // Remove the existing dialog if it exists
        }

        const dialog = L.control.dialog({
            size: [350, 350],
            minSize: [200, 200],
            maxSize: [500, 500],
            anchor: [50, 50],
            position: 'topleft',
            initOpen: true
        }).addTo(map);

        window.currentDialog = dialog;

        dialog.showClose();  // Add the built-in close button
        dialog.showResize(); // Add the built-in resize handle

        const content = `
            <h3>Send Firefighting Command</h3>
            <select id="airport-select">
                <option value="">Select Airport</option>
            </select>
            <br><br>
            <select id="command-select">
                <option value="">Select Command</option>
                <option value="patrol">Patrol</option>
                <option value="commit">Commit</option>
            </select>
            <br><br>
            <select id="fire-select">
                <option value="">Select Fire</option>
            </select>
            <br><br>
            <button id="send-command">Send Command</button>
        `;

        dialog.setContent(content);

        // Populate airport and fire options
        populateAirportOptions();
        firefightingFeatureInstance = await fireFightingFeature();
        populateFireOptions(firefightingFeatureInstance.globalFireData);

        // Add event listener for the send button
        document.getElementById('send-command').addEventListener('click', function() {
            const airport = document.getElementById('airport-select').value;
            const command = document.getElementById('command-select').value;
            const fireIndex = document.getElementById('fire-select').value;

            if (airport && command && fireIndex !== "") {
                sendFirefightingCommand(airport, command, parseInt(fireIndex));
                dialog.close();
            } else {
                alert('Please select all options');
            }
        });
    }

    function populateAirportOptions() {
        const airportSelect = document.getElementById('airport-select');
        airportSelect.innerHTML = '<option value="">Select Airport</option>'; // Clear previous options
        my_airports.forEach(airport => {
            const option = document.createElement('option');
            option.value = airport.code;
            option.textContent = `${airport.name} (${airport.code})`;
            airportSelect.appendChild(option);
        });
    }

    function populateFireOptions(fireData) {
        const fireSelect = document.getElementById('fire-select');
        fireSelect.innerHTML = '<option value="">Select Fire</option>'; // Clear previous options
        fireData.forEach((fire, index) => {
            const option = document.createElement('option');
            option.value = index; // Using index as value, you might want to use a unique identifier if available
            option.textContent = `Fire at ${fire.latitude}, ${fire.longitude} (${fire.acq_date} ${fire.acq_time})`;
            fireSelect.appendChild(option);
        });
    }

    function sendFirefightingCommand(airport, command, fireIndex) {
        const airportCoords = getAirportCoordinates(airport);
        const fireCoords = firefightingFeatureInstance.getFireCoordinates(fireIndex);

        if (!airportCoords || !fireCoords) {
            console.error('Invalid airport or fire data');
            return;
        }

        // Draw line on the map
        const line = L.polyline([airportCoords, fireCoords], { color: 'red', weight: 3 }).addTo(map);
        commandLayer.addLayer(line);

        // Create message
        const airportName = my_airports.find(a => a.code === airport).name;
        const fire = firefightingFeatureInstance.globalFireData[fireIndex];
        const message = `Firefighting aircraft from ${airportName} (${airport}) has been commanded to ${command} the fire at ${fire.latitude}, ${fire.longitude}`;

        // Display message in the alerts tab
        sendAlertToTab(message);
        // Display notification alert
        notificationControl.alert(message);

        const popupContent = `
            ${message}<br><br>
            <button onclick="acknowledgeCommand('${line._leaflet_id}')">Acknowledge</button>
        `;
        line.bindPopup(popupContent);

        // Display a popup on the map
        L.popup()
            .setLatLng([(airportCoords[0] + fireCoords[0]) / 2, (airportCoords[1] + fireCoords[1]) / 2])
            .setContent(popupContent)
            .openOn(map);
        
        const commandData = {
            airport,
            command,
            fireIndex,
            airportCoords,
            fireCoords,
            message
        };
        saveCommandToStorage(commandData);
    }

    function getAirportCoordinates(airportCode) {
        const airport = my_airports.find(a => a.code === airportCode);
        if (airport) {
            return [airport.lat, airport.lon];
        } else {
            console.error(`Airport with code ${airportCode} not found`);
            return null;
        }
    }

    return {
        openCommandDialog,
        commandLayer
    };
    
}

function sendAcknowledgmentToServer(lineId, ipAddress) {
    // Replace with your actual server endpoint
    fetch('/acknowledge-command', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            lineId: lineId,
            ipAddress: ipAddress,
        }),
    })
        .then(response => response.json())
        .then(data => {
            console.log('Acknowledgment sent to server:', data);
        })
        .catch(error => {
            console.error('Error sending acknowledgment to server:', error);
        });

        
}

function saveCommandToStorage(command) {
    let commands = JSON.parse(localStorage.getItem('firefightingCommands') || '[]');
    commands.push(command);
    localStorage.setItem('firefightingCommands', JSON.stringify(commands));
}

function loadCommandsFromStorage() {
    return JSON.parse(localStorage.getItem('firefightingCommands') || '[]');
}

module.exports = {
    fireFightingFeature,
    fireFightingCommand,
    sendAcknowledgmentToServer,
    loadCommandsFromStorage
};
