const { DataTypes } = require("sequelize");

const throwInsertOnlyError = () => {
  throw new Error("Penalty is INSERT-only. Update/Delete is not allowed.");
};

module.exports = (sequelize) => {
  const Penalty = sequelize.define(
    "Penalty",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      inspectionReportId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      safetyRuleId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      reason: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
    },
    {
      tableName: "penalties",
      timestamps: true,
      hooks: {
        beforeUpdate: throwInsertOnlyError,
        beforeDestroy: throwInsertOnlyError,
        beforeBulkUpdate: throwInsertOnlyError,
        beforeBulkDestroy: throwInsertOnlyError,
      },
    }
  );

  Penalty.associate = (models) => {
    Penalty.belongsTo(models.InspectionReport, {
      foreignKey: "inspectionReportId",
      as: "inspectionReport",
    });

    Penalty.belongsTo(models.SafetyRule, {
      foreignKey: "safetyRuleId",
      as: "safetyRule",
    });
  };

  return Penalty;
};
