const express = require ('express');
const axios = require('axios');
const router = express.Router();

router.get('/', async (req,res) => {
    try {
        const response = await  axios.get('https://opensky-network.org/api/states/all?lamin=36.146747&lomin=19.841309&lamax=41.162114&lomax=26.564941',{
            auth: {
                username: 'ap23011',
                password: '1qaz+!@1qaz'
            }
        })
        res.json(response.data);
    } catch (error) {
        console.log("Error fetching adsb data", error);
        res.status(500).json({error: 'Error fetching adsb data'});
    }
});

module.exports = router;