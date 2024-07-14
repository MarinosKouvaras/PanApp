'use strict';
module.exports = (sequelize, DataTypes) => {
  // const Shape = sequelize.define('Shape', {
  //   type: DataTypes.STRING,
  //   coordinates: DataTypes.TEXT,
  //   name: DataTypes.STRING,
  //   description: DataTypes.TEXT,
  //   userId: DataTypes.INTEGER
  // }
  const Shape = sequelize.define('Shape', {
    type: {
      type: DataTypes.STRING,
      allowNull: false
    },
    coordinates: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    radius: {
      type: DataTypes.FLOAT,
      allowNull: true  // Allow null for non-circle shapes
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {});

  Shape.associate = function(models) {
    // Define associations if needed
    // Example: LeafletDrawing.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  };

  return Shape;
};