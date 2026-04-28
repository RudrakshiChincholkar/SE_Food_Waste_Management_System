const { InspectionReport, FoodDonation, LifecycleLog, sequelize } = require("../models");

const submitInspection = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { donationId, status, remarks } = req.body;

    if (!donationId || !status) {
      await transaction.rollback();
      return res.status(400).json({
        message: "donationId and status are required.",
      });
    }

    if (!["PASS", "FAIL"].includes(status)) {
      await transaction.rollback();
      return res.status(400).json({
        message: "status must be either PASS or FAIL.",
      });
    }

    const donation = await FoodDonation.findByPk(donationId, { transaction });
    if (!donation) {
      await transaction.rollback();
      return res.status(404).json({ message: "Donation not found." });
    }

    const nextState = status === "PASS" ? "INSPECTED" : "REJECTED";

    const report = await InspectionReport.create(
      {
        donationId,
        inspectorId: req.user.id,
        status,
        notes: remarks || null,
      },
      { transaction }
    );

    await donation.update(
      {
        currentState: nextState,
      },
      { transaction }
    );

    await LifecycleLog.create(
      {
        donationId: donation.id,
        actorUserId: req.user.id,
        fromState: donation.currentState,
        toState: nextState,
        remarks: remarks || `Inspection marked as ${status}.`,
      },
      { transaction }
    );

    await transaction.commit();

    return res.status(201).json({
      message: "Inspection submitted successfully.",
      inspectionReport: {
        id: report.id,
        donationId: report.donationId,
        inspectorId: report.inspectorId,
        status: report.status,
        remarks: report.notes,
      },
      donation: {
        id: donation.id,
        currentState: nextState,
      },
    });
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  submitInspection,
};
