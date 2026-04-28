const cron = require("node-cron");
const { Op } = require("sequelize");
const { FoodDonation, User, LifecycleLog, sequelize } = require("../models");

async function runExpiryGuard() {
  const now = new Date();
  const [updatedCount] = await FoodDonation.update(
    { currentState: "EXPIRED" },
    {
      where: {
        expiryDate: { [Op.lt]: now },
        currentState: { [Op.notIn]: ["FULFILLED", "REJECTED", "EXPIRED"] },
      },
    }
  );

  if (updatedCount > 0) {
    console.log(`[ExpiryJob] Marked ${updatedCount} donations as EXPIRED.`);
  }
}

async function checkNoShows() {
  const transaction = await sequelize.transaction();
  try {
    const now = new Date();
    const acceptedBefore = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const staleAcceptedDonations = await FoodDonation.findAll({
      where: {
        currentState: "ACCEPTED",
        updatedAt: { [Op.lt]: acceptedBefore },
        recipientNgoId: { [Op.not]: null },
      },
      transaction,
    });

    for (const donation of staleAcceptedDonations) {
      const ngo = await User.findByPk(donation.recipientNgoId, { transaction });
      if (!ngo) {
        continue;
      }

      const newStrikeCount = (ngo.strikes || 0) + 1;
      const ngoUpdates = { strikes: newStrikeCount };
      if (newStrikeCount >= 3) {
        ngoUpdates.isActive = false;
      }

      await ngo.update(ngoUpdates, { transaction });

      const nextState = donation.expiryDate < now ? "REJECTED" : "INSPECTED";
      await donation.update(
        {
          currentState: nextState,
          recipientNgoId: null,
        },
        { transaction }
      );

      await LifecycleLog.create(
        {
          donationId: donation.id,
          actorUserId: ngo.id,
          fromState: "ACCEPTED",
          toState: nextState,
          remarks:
            nextState === "REJECTED"
              ? "No-show exceeded acceptable window; donation rejected."
              : "No-show by NGO after 24h; donation reopened for claim.",
        },
        { transaction }
      );
    }

    if (staleAcceptedDonations.length > 0) {
      console.log(
        `[ExpiryJob] Processed ${staleAcceptedDonations.length} NGO no-show donation(s).`
      );
    }

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    console.error("[ExpiryJob] checkNoShows failed:", error.message);
  }
}

function startHousekeepingJobs() {
  cron.schedule("0 * * * *", async () => {
    try {
      await runExpiryGuard();
      await checkNoShows();
    } catch (error) {
      console.error("[ExpiryJob] Hourly housekeeping failed:", error.message);
    }
  });

  console.log("[ExpiryJob] Hourly housekeeping jobs initialized.");
}

module.exports = {
  startHousekeepingJobs,
  runExpiryGuard,
  checkNoShows,
};
