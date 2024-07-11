'use strict';

const now = new Date();

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('Drawings', [
      {
        type: 'Polygon',
        coordinates: Sequelize.fn('ST_GeomFromGeoJSON', JSON.stringify({
          type: 'Polygon',
          coordinates: [
            [
              [-0.09, 51.505], // [longitude, latitude]
              [-0.1, 51.51],
              [-0.12, 51.51],
              [-0.09, 51.505] // Close the polygon
            ]
          ]
        })),
        userId: 1,
        createdAt: now,
        updatedAt: now,
      },
      {
        type: 'LineString',
        coordinates: Sequelize.fn('ST_GeomFromGeoJSON', JSON.stringify({
          type: 'LineString',
          coordinates: [
            [-0.09, 51.505],
            [-0.1, 51.51],
            [-0.12, 51.51],
            [-0.12, 51.52]
          ]
        })),
        userId: 2,
        createdAt: new Date(now - 86400000), // 1 day ago
        updatedAt: new Date(now - 86400000),
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('Drawings', null, {});
  }
};