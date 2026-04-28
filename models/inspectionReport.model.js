const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const InspectionReport = sequelize.define(
    "InspectionReport",
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
      inspectorId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("PASS", "FAIL"),
        allowNull: false,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      inspectedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "inspection_reports",
      timestamps: true,
    }
  );

  InspectionReport.associate = (models) => {
    InspectionReport.belongsTo(models.FoodDonation, {
      foreignKey: "donationId",
      as: "donation",
    });

    InspectionReport.belongsTo(models.User, {
      foreignKey: "inspectorId",
      as: "inspector",
    });

    InspectionReport.hasMany(models.Penalty, {
      foreignKey: "inspectionReportId",
      as: "penalties",
    });
  };

  return InspectionReport;
};
