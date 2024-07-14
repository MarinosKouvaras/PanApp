const express = require('express');
const { Shape } = require('../database/models'); // Adjust the path as needed
const router = express.Router();

router.post('/shapes', async (req, res) => {
    console.log('Received shape data:', req.body);
    try {
        const { type, coordinates, name, description } = req.body;
        
        const shape = await Shape.create({
            type,
            coordinates: JSON.stringify(coordinates),
            name,
            description,
            userId: 1, // Replace with actual user ID when you implement authentication
        });
        console.log('Received shape data:', req.body);
        res.status(201).json(shape);
    } catch (error) {
        console.error('Error saving drawing:', error);
        res.status(500).json({ message: 'Error saving drawing' });
    }
});

module.exports = router;