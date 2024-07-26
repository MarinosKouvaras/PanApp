const express = require('express');
const router = express.Router();
const { LeafletDrawing } = require('../database/models');

// Fetch all leaflet drawings (with pagination)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const drawings = await LeafletDrawing.findAndCountAll({
      limit: limit,
      offset: offset,
      order: [['createdAt', 'DESC']]
    });
    console.log('Drawings data:', JSON.stringify(drawings.rows, null, 2));

    res.json({
      drawings: drawings.rows,
      totalPages: Math.ceil(drawings.count / limit),
      currentPage: page
    });
  } catch (err) {
    console.error('Error in GET /drawings:', err);

    res.status(500).json({ error: err.message });
  }
});

// Fetch a single drawing by ID
router.get('/:id', async (req, res) => {
  try {
    const drawing = await LeafletDrawing.findByPk(req.params.id);
    if (drawing) {
      res.json(drawing);
    } else {
      res.status(404).json({ error: 'Drawing not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new drawing
router.post('/', async (req, res) => {
  try {
    const newDrawing = await LeafletDrawing.create(req.body);
    res.status(201).json(newDrawing);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update a drawing
router.put('/:id', async (req, res) => {
  try {
    const updated = await LeafletDrawing.update(req.body, {
      where: { id: req.params.id }
    });
    if (updated) {
      const updatedDrawing = await LeafletDrawing.findByPk(req.params.id);
      res.json(updatedDrawing);
    } else {
      res.status(404).json({ error: 'Drawing not found' });
    }
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete a drawing
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await LeafletDrawing.destroy({
      where: { id: req.params.id }
    });
    if (deleted) {
      res.status(204).send();
    } else {
      res.status(404).json({ error: 'Drawing not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;