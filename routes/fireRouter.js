require('dotenv').config();
const express = require('express');
const axios = require('axios');
const router = express.Router();

router.get('/', async(req, res) => {
    try {
        API_KEY = process.env.FIRMS_API_KEY
        const response = await axios.get(`https://firms.modaps.eosdis.nasa.gov/api/country/csv/${API_KEY}/VIIRS_NOAA20_NRT/GRC/1`);
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching flight data:', error);
        res.status(500).json({ error: 'Error fetching flight data' });
    }
});

module.exports = router;