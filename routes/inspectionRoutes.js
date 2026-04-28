const express = require("express");
const { submitInspection } = require("../controllers/inspectionController");
const { protect, restrictTo } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, restrictTo("INSPECTOR", "ADMIN"), submitInspection);

module.exports = router;
