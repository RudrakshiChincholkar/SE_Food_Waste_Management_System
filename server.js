require("dotenv").config();
const express = require("express");
const cors = require("cors"); // 1. Import CORS
const authRoutes = require("./routes/authRoutes");
const donationRoutes = require("./routes/donationRoutes");
const inspectionRoutes = require("./routes/inspectionRoutes");
const deliveryRoutes = require("./routes/deliveryRoutes");
const { startHousekeepingJobs } = require("./jobs/expiryJob");
const { sequelize } = require("./models");

const app = express();

// 2. Add CORS before routes so it can authorize preflight (OPTIONS) requests
app.use(cors()); 
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/donations", donationRoutes);
app.use("/api/inspections", inspectionRoutes);
app.use("/api/delivery", deliveryRoutes);

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log("Database connection established.");
    startHousekeepingJobs();
    app.listen(PORT, () => {
      console.log(`FDLMS server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Unable to start server:", error.message);
    process.exit(1);
  }
}

startServer();