const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const FoodDonation = sequelize.define(
    "FoodDonation",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      donorId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      recipientNgoId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      deliveryPartnerId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      foodName: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      quantityKg: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          min: 0.1,
        },
      },
      expiryDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      pickupAddress: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      currentState: {
        type: DataTypes.ENUM(
          "SUBMITTED",
          "INSPECTED",
          "ACCEPTED",
          "IN_TRANSIT",
          "FULFILLED",
          "REJECTED",
          "EXPIRED"
        ),
        allowNull: false,
        defaultValue: "SUBMITTED",
      },
      version: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "food_donations",
      timestamps: true,
      paranoid: true,
      deletedAt: "deletedAt",
      version: true,
    }
  );

  FoodDonation.associate = (models) => {
    FoodDonation.belongsTo(models.User, {
      foreignKey: "donorId",
      as: "donor",
    });

    FoodDonation.hasMany(models.LifecycleLog, {
      foreignKey: "donationId",
      as: "lifecycleLogs",
    });

    FoodDonation.hasMany(models.InspectionReport, {
      foreignKey: "donationId",
      as: "inspectionReports",
    });

    FoodDonation.belongsTo(models.User, {
      foreignKey: "recipientNgoId",
      as: "recipientNgo",
    });

    FoodDonation.belongsTo(models.User, {
      foreignKey: "deliveryPartnerId",
      as: "deliveryPartner",
    });
  };

  return FoodDonation;
};
