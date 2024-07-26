'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Shapes', 'radius', {
      type: Sequelize.FLOAT,
      allowNull: true
    });

    // If you need to modify existing columns, you can do so here
    await queryInterface.changeColumn('Shapes', 'coordinates', {
      type: Sequelize.TEXT,
      allowNull: false
    });

    // If you need to ensure 'type' is not null
    await queryInterface.changeColumn('Shapes', 'type', {
      type: Sequelize.STRING,
      allowNull: false
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Shapes', 'radius');

    // If you modified other columns, you might want to revert those changes here
  }
};