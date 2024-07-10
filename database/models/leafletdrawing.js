'use strict';
module.exports = (sequelize, DataTypes) => {
  const LeafletDrawing = sequelize.define('LeafletDrawing', {
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    coordinates: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  }, {});
  LeafletDrawing.associate = function(models) {
    // associations can be defined here
  };
  return LeafletDrawing;
};
