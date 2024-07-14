'use strict';
module.exports = (sequelize, DataTypes) => {
  const Shape = sequelize.define('Shape', {
    type: DataTypes.STRING,
    coordinates: DataTypes.TEXT,
    name: DataTypes.STRING,
    description: DataTypes.TEXT,
    userId: DataTypes.INTEGER
  }, {});

  Shape.associate = function(models) {
    // Define associations if needed
    // Example: LeafletDrawing.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  };

  return Shape;
};