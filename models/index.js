const { Sequelize } = require("sequelize");
const dotenv = require("dotenv");

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME || "fdlms_db",
  process.env.DB_USER || "postgres",
  process.env.DB_PASSWORD || "postgres",
  {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 5432),
    dialect: "postgres",
    logging: false,
  }
);

const db = {};

db.sequelize = sequelize;
db.Sequelize = Sequelize;

db.Role = require("./role.model")(sequelize);
db.User = require("./user.model")(sequelize);
db.FoodDonation = require("./foodDonation.model")(sequelize);
db.LifecycleLog = require("./lifecycleLog.model")(sequelize);
db.InspectionReport = require("./inspectionReport.model")(sequelize);
db.SafetyRule = require("./safetyRule.model")(sequelize);
db.Penalty = require("./penalty.model")(sequelize);
db.AuditLog = require("./auditLog.model")(sequelize);

Object.keys(db).forEach((modelName) => {
  if (db[modelName] && typeof db[modelName].associate === "function") {
    db[modelName].associate(db);
  }
});

module.exports = db;
