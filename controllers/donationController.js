const { FoodDonation, LifecycleLog, InspectionReport, User, sequelize } = require("../models");
const { OptimisticLockError } = require("sequelize");

const submitDonation = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { foodName, quantityKg, expiryDate, pickupAddress } = req.body;

    if (!foodName || quantityKg === undefined || !expiryDate || !pickupAddress) {
      await transaction.rollback();
      return res.status(400).json({
        message:
          "foodName, quantityKg, expiryDate, and pickupAddress are required.",
      });
    }

    const quantityValue = Number(quantityKg);
    if (Number.isNaN(quantityValue) || quantityValue <= 0.1 || quantityValue > 10000) {
      await transaction.rollback();
      return res.status(400).json({
        message: "Quantity must be greater than 0.1 kg and at most 10,000 kg.",
      });
    }

    const parsedExpiryDate = new Date(expiryDate);
    if (Number.isNaN(parsedExpiryDate.getTime())) {
      await transaction.rollback();
      return res.status(400).json({ message: "Invalid expiryDate provided." });
    }

    const minimumExpiryDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
    if (parsedExpiryDate < minimumExpiryDate) {
      await transaction.rollback();
      return res.status(400).json({
        message: "expiryDate must be at least 24 hours from now.",
      });
    }

    const donation = await FoodDonation.create(
      {
        donorId: req.user.id,
        foodName,
        quantityKg: quantityValue,
        pickupAddress,
        expiryDate: parsedExpiryDate,
        currentState: "SUBMITTED",
      },
      { transaction }
    );

    await LifecycleLog.create(
      {
        donationId: donation.id,
        actorUserId: req.user.id,
        fromState: null,
        toState: "SUBMITTED",
        remarks: "Donation submitted by donor.",
      },
      { transaction }
    );

    await transaction.commit();

    return res.status(201).json({
      message: "Donation submitted successfully.",
      donation: {
        id: donation.id,
        donorId: donation.donorId,
        foodName: donation.foodName,
        quantityKg: donation.quantityKg,
        expiryDate: donation.expiryDate,
        pickupAddress: donation.pickupAddress,
        currentState: donation.currentState,
      },
    });
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json({ message: error.message });
  }
};

const getMyDonations = async (req, res) => {
  try {
    const roleName = req.user?.role?.name;
    if (roleName === "NGO") {
      const donations = await FoodDonation.findAll({
        where: { currentState: "INSPECTED" },
        order: [["createdAt", "DESC"]],
        include: [
          {
            model: User,
            as: "donor",
            attributes: ["id", "fullName"],
          },
        ],
        attributes: [
          "id",
          "foodName",
          "quantityKg",
          "expiryDate",
          "pickupAddress",
          "currentState",
          "createdAt",
        ],
      });

      return res.status(200).json({
        donations: donations.map((d) => ({
          id: d.id,
          foodName: d.foodName,
          quantityKg: d.quantityKg,
          expiryDate: d.expiryDate,
          pickupAddress: d.pickupAddress,
          currentState: d.currentState,
          createdAt: d.createdAt,
          donor: d.donor ? { id: d.donor.id, fullName: d.donor.fullName } : null,
        })),
      });
    }
    if (roleName === "INSPECTOR") {
      const donations = await FoodDonation.findAll({
        where: { currentState: "SUBMITTED" },
        order: [["createdAt", "DESC"]],
        include: [
          {
            model: User,
            as: "donor",
            attributes: ["id", "fullName"],
          },
        ],
        attributes: [
          "id",
          "foodName",
          "quantityKg",
          "expiryDate",
          "pickupAddress",
          "currentState",
          "createdAt",
        ],
      });

      return res.status(200).json({
        donations: donations.map((d) => ({
          id: d.id,
          foodName: d.foodName,
          quantityKg: d.quantityKg,
          expiryDate: d.expiryDate,
          pickupAddress: d.pickupAddress,
          currentState: d.currentState,
          createdAt: d.createdAt,
          donor: d.donor ? { id: d.donor.id, fullName: d.donor.fullName } : null,
        })),
      });
    }

    const donations = await FoodDonation.findAll({
      where: { donorId: req.user.id },
      order: [["createdAt", "DESC"]],
      attributes: [
        "id",
        "foodName",
        "quantityKg",
        "expiryDate",
        "pickupAddress",
        "currentState",
        "createdAt",
      ],
    });

    return res.status(200).json({ donations });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getAvailableDonations = async (req, res) => {
  try {
    const donations = await FoodDonation.findAll({
      where: { currentState: "INSPECTED" },
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: User,
          as: "donor",
          attributes: ["id", "fullName"],
        },
      ],
    });

    return res.status(200).json({
      donations: donations.map((d) => ({
        id: d.id,
        foodName: d.foodName,
        quantityKg: d.quantityKg,
        expiryDate: d.expiryDate,
        pickupLocation: d.pickupAddress,
        currentState: d.currentState,
        createdAt: d.createdAt,
        donor: d.donor ? { id: d.donor.id, fullName: d.donor.fullName } : null,
      })),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const acceptDonation = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;

    const donation = await FoodDonation.findByPk(id, { transaction });
    if (!donation) {
      await transaction.rollback();
      return res.status(404).json({ message: "Donation not found." });
    }

    if (donation.currentState !== "INSPECTED") {
      await transaction.rollback();
      return res.status(400).json({
        message: "Only INSPECTED donations can be accepted.",
      });
    }

    const [updatedCount] = await FoodDonation.update(
      {
        currentState: "ACCEPTED",
        recipientNgoId: req.user.id,
        version: donation.version + 1,
      },
      {
        where: {
          id: donation.id,
          currentState: "INSPECTED",
          version: donation.version,
        },
        transaction,
      }
    );

    if (updatedCount !== 1) {
      throw new OptimisticLockError({
        modelName: "FoodDonation",
        values: { id: donation.id },
      });
    }

    await LifecycleLog.create(
      {
        donationId: donation.id,
        actorUserId: req.user.id,
        fromState: "INSPECTED",
        toState: "ACCEPTED",
        remarks: "Donation accepted by NGO.",
      },
      { transaction }
    );

    await transaction.commit();

    return res.status(200).json({
      message: "Donation accepted successfully.",
      donation: {
        id: donation.id,
        currentState: "ACCEPTED",
        recipientNgoId: req.user.id,
      },
    });
  } catch (error) {
    await transaction.rollback();
    if (error instanceof OptimisticLockError) {
      return res.status(409).json({
        message: "Conflict: Donation was modified by another request.",
      });
    }
    return res.status(500).json({ message: error.message });
  }
};

const inspectDonation = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    if (!["INSPECTED", "REJECTED"].includes(status)) {
      await transaction.rollback();
      return res.status(400).json({
        message: "status must be INSPECTED or REJECTED.",
      });
    }

    if (status === "REJECTED" && (!reason || !String(reason).trim())) {
      await transaction.rollback();
      return res.status(400).json({
        message: "Reason is required when rejecting a donation.",
      });
    }

    const donation = await FoodDonation.findByPk(id, { transaction });
    if (!donation) {
      await transaction.rollback();
      return res.status(404).json({ message: "Donation not found." });
    }

    if (donation.currentState !== "SUBMITTED") {
      await transaction.rollback();
      return res.status(400).json({
        message: "Only SUBMITTED donations can be inspected.",
      });
    }

    await InspectionReport.create(
      {
        donationId: donation.id,
        inspectorId: req.user.id,
        status: status === "INSPECTED" ? "PASS" : "FAIL",
        notes: status === "REJECTED" ? reason : "Approved after inspection.",
      },
      { transaction }
    );

    await donation.update({ currentState: status }, { transaction });

    await LifecycleLog.create(
      {
        donationId: donation.id,
        actorUserId: req.user.id,
        fromState: "SUBMITTED",
        toState: status,
        remarks:
          status === "REJECTED"
            ? `Rejected by inspector. Reason: ${reason}`
            : "Approved by inspector.",
      },
      { transaction }
    );

    await transaction.commit();
    return res.status(200).json({
      message: `Donation ${status === "INSPECTED" ? "approved" : "rejected"} successfully.`,
      donation: {
        id: donation.id,
        currentState: status,
      },
    });
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  submitDonation,
  getMyDonations,
  getAvailableDonations,
  acceptDonation,
  inspectDonation,
};
