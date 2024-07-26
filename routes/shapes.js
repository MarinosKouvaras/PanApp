const express = require('express');
const { Shape } = require('../database/models'); // Adjust the path as needed
const router = express.Router();

// Fetch all leaflet drawings (with pagination)
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 18;
        const offset = (page - 1) * limit;

        const shapes = await Shape.findAndCountAll({
            limit: limit,
            offset: offset,
            order: [['createdAt', 'DESC']]
        });

        const parsedShapes = shapes.rows.map(shape => {
            const shapeData = shape.toJSON();
            return {
                ...shapeData,
                coordinates: JSON.parse(shapeData.coordinates)
            };
        });

        console.log('Parsed shapes:', JSON.stringify(parsedShapes, null, 2));

        res.json({
            shapes: parsedShapes,
            totalPages: Math.ceil(shapes.count / limit),
            currentPage: page
        });
    } catch (err) {
        console.error('Error in GET /shapes:', err);
        res.status(500).json({ error: err.message });
    }
});

// Fetch a single drawing by ID
router.get('/:id', async (req, res) => {
    try {
        const shape = await Shape.findByPk(req.params.id);
        if (shape) {
            res.json(shape);
        } else {
            res.status(404).json({ error: 'Shape not found' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create a new shape
router.post('/', async (req, res) => {
    console.log('Received shape data:', req.body);
    try {
        const { type, coordinates, radius, name, description } = req.body;
        
        let shapeData = {
            type,
            coordinates: JSON.stringify(coordinates),
            name,
            description,
            userId: 1, // Replace with actual user ID when you implement authentication
        };

        // Only add radius if the shape is a circle
        if (type === 'Circle') {
            shapeData.radius = radius;
        }

        const shape = await Shape.create(shapeData);
        
        console.log('Shape saved:', shape);
        res.status(201).json(shape);
    } catch (error) {
        console.error('Error saving shape:', error);
        res.status(500).json({ message: 'Error saving shape', error: error.message });
    }
});

// Update a shape by ID
router.put('/:id', async (req, res) => {
    console.log(`Received PUT request for shape ID: ${req.params.id}`);
    console.log('Request body:', req.body);
    try {
        const { id } = req.params;
        const { type, coordinates, radius, name, description } = req.body;

        const shape = await Shape.findByPk(id);

        if (!shape) {
            return res.status(404).json({ error: 'Shape not found' });
        }

        let updateData = {
            type,
            coordinates: JSON.stringify(coordinates),
            name,
            description
        };

        // Only update radius if the shape is a circle
        if (type === 'Circle') {
            updateData.radius = radius;
        }

        await shape.update(updateData);

        res.json(shape);
    } catch (error) {
        console.error('Error updating shape:', error);
        res.status(500).json({ message: 'Error updating shape', error: error.message });
    }
});

// Add this route to your existing router file in routes/shapes.js

// Delete a shape by ID
router.delete('/:id', async (req, res) => {
    console.log(`Received DELETE request for shape ID: ${req.params.id}`);
    try {
        const { id } = req.params;

        const shape = await Shape.findByPk(id);

        if (!shape) {
            console.log(`Shape with ID ${id} not found`);
            return res.status(404).json({ error: 'Shape not found' });
        }

        await shape.destroy();

        console.log(`Shape with ID ${id} deleted successfully`);
        res.json({ message: 'Shape deleted successfully' });
    } catch (error) {
        console.error('Error deleting shape:', error);
        res.status(500).json({ message: 'Error deleting shape', error: error.message });
    }
});

module.exports = router;