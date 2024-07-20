const express = require('express');
const axios = require('axios');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const response = await axios.get('https://api.adsb.lol/v2/sqk/7000');
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching flight data:', error);
    res.status(500).json({ error: 'Error fetching flight data' });
  }
});

module.exports = router;