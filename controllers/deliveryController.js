const { FoodDonation, LifecycleLog, sequelize } = require("../models");

const getPendingPickups = async (_req, res) => {
  try {
    const donations = await FoodDonation.findAll({
      where: { currentState: "ACCEPTED" },
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({ donations });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const startPickup = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const donation = await FoodDonation.findByPk(id, { transaction });

    if (!donation) {
      await transaction.rollback();
      return res.status(404).json({ message: "Donation not found." });
    }

    if (donation.currentState !== "ACCEPTED") {
      await transaction.rollback();
      return res.status(400).json({
        message: "Only ACCEPTED donations can be picked up.",
      });
    }

    await donation.update(
      { currentState: "IN_TRANSIT", deliveryPartnerId: req.user.id },
      { transaction }
    );

    await LifecycleLog.create(
      {
        donationId: donation.id,
        actorUserId: req.user.id,
        fromState: "ACCEPTED",
        toState: "IN_TRANSIT",
        remarks: "Pickup started by delivery partner.",
      },
      { transaction }
    );

    await transaction.commit();
    return res.status(200).json({
      message: "Pickup started successfully.",
      donation: {
        id: donation.id,
        currentState: "IN_TRANSIT",
        deliveryPartnerId: req.user.id,
      },
    });
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json({ message: error.message });
  }
};

const completeDelivery = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const donation = await FoodDonation.findByPk(id, { transaction });

    if (!donation) {
      await transaction.rollback();
      return res.status(404).json({ message: "Donation not found." });
    }

    if (donation.currentState !== "IN_TRANSIT") {
      await transaction.rollback();
      return res.status(400).json({
        message: "Only IN_TRANSIT donations can be completed.",
      });
    }

    if (donation.deliveryPartnerId !== req.user.id) {
      await transaction.rollback();
      return res.status(403).json({
        message: "Forbidden. This delivery is assigned to another partner.",
      });
    }

    await donation.update({ currentState: "FULFILLED" }, { transaction });

    await LifecycleLog.create(
      {
        donationId: donation.id,
        actorUserId: req.user.id,
        fromState: "IN_TRANSIT",
        toState: "FULFILLED",
        remarks: "Delivery completed by delivery partner.",
      },
      { transaction }
    );

    await transaction.commit();
    return res.status(200).json({
      message: "Delivery completed successfully.",
      donation: { id: donation.id, currentState: "FULFILLED" },
    });
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getPendingPickups,
  startPickup,
  completeDelivery,
};
