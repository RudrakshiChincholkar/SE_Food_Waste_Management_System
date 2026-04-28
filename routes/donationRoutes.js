const express = require("express");
const {
  submitDonation,
  getMyDonations,
  getAvailableDonations,
  acceptDonation,
  inspectDonation,
  startPickup,
  confirmDelivery,
} = require("../controllers/donationController");
const { protect, restrictTo } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/available", protect, restrictTo("NGO", "ADMIN"), getAvailableDonations);
router.get(
  "/",
  protect,
  restrictTo("DONOR", "NGO", "INSPECTOR", "DELIVERY_PARTNER", "ADMIN"),
  getMyDonations
);
router.post("/", protect, restrictTo("DONOR"), submitDonation);
router.patch("/:id/accept", protect, restrictTo("NGO"), acceptDonation);
router.patch("/:id/inspect", protect, restrictTo("INSPECTOR", "ADMIN"), inspectDonation);
router.patch("/:id/pickup", protect, restrictTo("DELIVERY_PARTNER", "ADMIN"), startPickup);
router.patch("/:id/deliver", protect, restrictTo("DELIVERY_PARTNER", "ADMIN"), confirmDelivery);

module.exports = router;
