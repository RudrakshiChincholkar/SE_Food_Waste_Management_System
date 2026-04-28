const express = require("express");
const {
  getPendingPickups,
  startPickup,
  completeDelivery,
} = require("../controllers/deliveryController");
const { protect, restrictTo } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/pending", protect, restrictTo("DELIVERY_PARTNER", "ADMIN"), getPendingPickups);
router.patch("/:id/pickup", protect, restrictTo("DELIVERY_PARTNER", "ADMIN"), startPickup);
router.patch(
  "/:id/complete",
  protect,
  restrictTo("DELIVERY_PARTNER", "ADMIN"),
  completeDelivery
);

module.exports = router;
