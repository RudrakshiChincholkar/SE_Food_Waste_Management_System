import { useState } from "react";
import { motion } from "framer-motion";
import api from "../../api/axios";

export default function AvailableMarketplace({ donations, onAccepted, showToast }) {
  const [acceptingId, setAcceptingId] = useState(null);

  const handleAccept = async (donationId) => {
    try {
      setAcceptingId(donationId);
      await api.patch(`/donations/${donationId}/accept`);
      showToast("success", "Donation accepted successfully.");
      await onAccepted();
    } catch (error) {
      const message = error?.response?.data?.message || "Unable to accept donation.";
      showToast("error", message);
    } finally {
      setAcceptingId(null);
    }
  };

  if (!donations.length) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
        No inspected donations available in the marketplace right now.
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {donations.map((donation) => (
        <motion.div
          key={donation.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-slate-200 bg-white p-5"
        >
          <p className="text-xs font-semibold tracking-wide text-indigo-700">INSPECTED</p>
          <h3 className="mt-1 text-base font-semibold text-slate-900">{donation.foodName}</h3>
          <p className="mt-2 text-sm text-slate-600">{donation.quantityKg} kg</p>
          <p className="mt-1 text-sm text-slate-600">{donation.pickupAddress}</p>
          <p className="mt-1 text-xs text-slate-500">
            Donor: {donation.donor?.fullName || "Unknown"}
          </p>
          <button
            type="button"
            disabled={acceptingId === donation.id}
            onClick={() => handleAccept(donation.id)}
            className="mt-4 rounded-md bg-indigo-700 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600 disabled:cursor-not-allowed disabled:bg-indigo-300"
          >
            {acceptingId === donation.id ? "Accepting..." : "Accept"}
          </button>
        </motion.div>
      ))}
    </div>
  );
}
