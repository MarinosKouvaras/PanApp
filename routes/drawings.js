const express = require('express');
const router = express.Router();
const { LeafletDrawing } = require('../database/models');

// Endpoint to fetch all leaflet drawings
router.get('/drawings', async (req, res) => {
  try {
    const drawings = await LeafletDrawing.findAll();
    res.json(drawings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
