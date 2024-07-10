'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('LeafletDrawings', [
      {
        type: 'polygon',
        coordinates: JSON.stringify([
          [51.505, -0.09],
          [51.51, -0.1],
          [51.51, -0.12]
        ]),
        userId: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        type: 'polyline',
        coordinates: JSON.stringify([
          [51.505, -0.09],
          [51.51, -0.1],
          [51.51, -0.12],
          [51.52, -0.12]
        ]),
        userId: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        type: 'marker',
        coordinates: JSON.stringify([51.505, -0.09]),
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
