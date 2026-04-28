require("dotenv").config();
const express = require("express");
const authRoutes = require("./routes/authRoutes");
const { sequelize } = require("./models");

const app = express();

app.use(express.json());
app.use("/api/auth", authRoutes);

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log("Database connection established.");
    app.listen(PORT, () => {
      console.log(`FDLMS server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Unable to start server:", error.message);
    process.exit(1);
  }
}

startServer();
