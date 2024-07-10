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
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  }, {});

  LeafletDrawing.associate = function(models) {
    // Define associations if needed
    // Example: LeafletDrawing.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  };

  return LeafletDrawing;
};
