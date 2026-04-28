const { DataTypes } = require("sequelize");

const throwInsertOnlyError = () => {
  throw new Error("AuditLog is INSERT-only. Update/Delete is not allowed.");
};

module.exports = (sequelize) => {
  const AuditLog = sequelize.define(
    "AuditLog",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      actorUserId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      action: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      entityType: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      entityId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
    },
    {
      tableName: "audit_logs",
      timestamps: true,
      hooks: {
        beforeUpdate: throwInsertOnlyError,
        beforeDestroy: throwInsertOnlyError,
        beforeBulkUpdate: throwInsertOnlyError,
        beforeBulkDestroy: throwInsertOnlyError,
      },
    }
  );

  AuditLog.associate = (models) => {
    AuditLog.belongsTo(models.User, {
      foreignKey: "actorUserId",
      as: "actor",
    });
  };

  return AuditLog;
};
