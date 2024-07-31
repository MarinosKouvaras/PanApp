const {loadFires} = require('./loadFireData');

async function fireFightingFeature(){
    let globalFireData = [];

    try {
        const {layer: fireLayer, data: fireData} = await loadFires();
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
    }
}



module.exports = {
    fireFightingFeature,
}