'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Shape extends Model {}
  Shape.init({
    type: {
      type: DataTypes.STRING,
      allowNull: false
    },
    geometry: {
      type: DataTypes.GEOMETRY('POLYGON', 4326), // Example for Polygon, adjust as needed
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Shape'
  });

  return Shape;
};