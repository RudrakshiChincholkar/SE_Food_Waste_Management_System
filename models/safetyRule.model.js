const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const SafetyRule = sequelize.define(
    "SafetyRule",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      ruleCode: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      title: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      severity: {
        type: DataTypes.ENUM("LOW", "MEDIUM", "HIGH", "CRITICAL"),
        allowNull: false,
      },
    },
    {
      tableName: "safety_rules",
      timestamps: true,
    }
  );

  SafetyRule.associate = (models) => {
    SafetyRule.hasMany(models.Penalty, {
      foreignKey: "safetyRuleId",
      as: "penalties",
    });
  };

  return SafetyRule;
};
