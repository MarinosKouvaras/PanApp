const express = require('express');
const { Shape } = require('../database/models'); // Adjust the path as needed
const router = express.Router();

// Fetch all leaflet drawings (with pagination)
router.get('/', async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;
  
      const shapes = await Shape.findAndCountAll({
        limit: limit,
        offset: offset,
        order: [['createdAt', 'DESC']]
      });
      // console.log('Shape data:', JSON.stringify(shapes.rows, null, 2));
      // // Parse the coordinates for each shape
      // const parsedShapes = shapes.rows.map(shape => ({
      //   ...shape.toJSON(),
      //   coordinates: JSON.parse(shape.coordinates)
      // }));
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

// router.post('/', async (req, res) => {
//     console.log('Received shape data:', req.body);
//     try {
//         const { type, coordinates, name, description } = req.body;
        
//         const shape = await Shape.create({
//             type,
//             coordinates: JSON.stringify(coordinates),
//             radius: radius,
//             name,
//             description,
//             userId: 1, // Replace with actual user ID when you implement authentication
//         });
//         console.log('Received shape data:', req.body);
//         res.status(201).json(shape);
//     } catch (error) {
//         console.error('Error saving drawing:', error);
//         res.status(500).json({ message: 'Error saving drawing' });
//     }
// });
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

module.exports = router;