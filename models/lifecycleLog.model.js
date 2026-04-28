const { DataTypes } = require("sequelize");

const throwInsertOnlyError = () => {
  throw new Error("LifecycleLog is INSERT-only. Update/Delete is not allowed.");
};

module.exports = (sequelize) => {
  const LifecycleLog = sequelize.define(
    "LifecycleLog",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      donationId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      actorUserId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      fromState: {
        type: DataTypes.ENUM(
          "SUBMITTED",
          "INSPECTED",
          "ACCEPTED",
          "IN_TRANSIT",
          "FULFILLED",
          "REJECTED"
        ),
        allowNull: true,
      },
      toState: {
        type: DataTypes.ENUM(
          "SUBMITTED",
          "INSPECTED",
          "ACCEPTED",
          "IN_TRANSIT",
          "FULFILLED",
          "REJECTED"
        ),
        allowNull: false,
      },
      remarks: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
    },
    {
      tableName: "lifecycle_logs",
      timestamps: true,
      hooks: {
        beforeUpdate: throwInsertOnlyError,
        beforeDestroy: throwInsertOnlyError,
        beforeBulkUpdate: throwInsertOnlyError,
        beforeBulkDestroy: throwInsertOnlyError,
      },
    }
  );

  LifecycleLog.associate = (models) => {
    LifecycleLog.belongsTo(models.FoodDonation, {
      foreignKey: "donationId",
      as: "donation",
    });

    LifecycleLog.belongsTo(models.User, {
      foreignKey: "actorUserId",
      as: "actor",
    });
  };

  return LifecycleLog;
};
