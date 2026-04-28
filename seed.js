require("dotenv").config();
const { sequelize, Role, User } = require("./models");
const { registerUser } = require("./controllers/authController");

const STANDARD_ROLES = [
  "DONOR",
  "NGO",
  "VOLUNTEER",
  "DELIVERY_PARTNER",
  "INSPECTOR",
  "ADMIN",
];

const TEST_USERS = [
  { roleName: "DONOR", fullName: "Donor Test User", email: "donor@test.fdlms" },
  { roleName: "NGO", fullName: "NGO Test User", email: "ngo@test.fdlms" },
  { roleName: "VOLUNTEER", fullName: "Volunteer Test User", email: "volunteer@test.fdlms" },
  {
    roleName: "DELIVERY_PARTNER",
    fullName: "Delivery Partner Test User",
    email: "delivery_partner@test.fdlms",
  },
  { roleName: "INSPECTOR", fullName: "Inspector Test User", email: "inspector@test.fdlms" },
  { roleName: "ADMIN", fullName: "Admin Test User", email: "admin@test.fdlms" },
];

async function seedRoles() {
  for (const roleName of STANDARD_ROLES) {
    await Role.findOrCreate({
      where: { name: roleName },
      defaults: {
        description: `${roleName} role`,
      },
    });
  }
}

async function seedUsers() {
  for (const payload of TEST_USERS) {
    const exists = await User.findOne({ where: { email: payload.email } });
    if (exists) {
      console.log(`Skipping existing user: ${payload.email}`);
      continue;
    }

    await registerUser({
      fullName: payload.fullName,
      email: payload.email,
      password: "password123",
      roleName: payload.roleName,
      phone: null,
    });

    console.log(`Created user: ${payload.email} (${payload.roleName})`);
  }
}

async function runSeed() {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: false });

    await seedRoles();
    await seedUsers();

    console.log("Seed completed successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Seed failed:", error.message);
    process.exit(1);
  }
}

runSeed();
