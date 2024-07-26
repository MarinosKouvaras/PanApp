'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('LeafletDrawings', [
      {
        type: 'Polygon',
        coordinates: JSON.stringify({
          type: 'Polygon',
          coordinates: [
            [
              [-0.09, 51.505],
              [-0.1, 51.51],
              [-0.12, 51.51],
              [-0.09, 51.505]  // Close the polygon
            ]
          ]
        }),
        userId: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        type: 'LineString',
        coordinates: JSON.stringify({
          type: 'LineString',
          coordinates: [
            [-0.09, 51.505],
            [-0.1, 51.51],
            [-0.12, 51.51],
            [-0.12, 51.52]
          ]
        }),
        userId: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        type: 'Point',
        coordinates: JSON.stringify({
          type: 'Point',
          coordinates: [-0.09, 51.505]
        }),
        userId: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('LeafletDrawings', null, {});
  }
};