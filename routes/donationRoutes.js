const express = require("express");
const {
  submitDonation,
  getMyDonations,
  getAvailableDonations,
  acceptDonation,
} = require("../controllers/donationController");
const { protect, restrictTo } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/available", protect, restrictTo("NGO", "ADMIN"), getAvailableDonations);
router.get("/", protect, restrictTo("DONOR"), getMyDonations);
router.post("/", protect, restrictTo("DONOR"), submitDonation);
router.patch("/:id/accept", protect, restrictTo("NGO"), acceptDonation);

module.exports = router;
