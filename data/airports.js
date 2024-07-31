
function airportsData() {
    const airports = [
        { code: 'LGTT', name: 'Athens International Airport', lat: 37.9364, lon: 23.9445 },
        { code: 'LGAV', name: 'Eleftherios Venizelos International Airport', lat: 37.9364, lon: 23.9445 },
        // Add more airports as needed
    ];
    return airports
}

module.exports = {
    airportsData,
}