import { useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, ShieldX } from "lucide-react";
import api from "../../api/axios";

export default function InspectionQueue({ donations, onActionDone, showToast }) {
  const [processingId, setProcessingId] = useState(null);
  const [reasons, setReasons] = useState({});

  const inspect = async (donationId, status) => {
    try {
      if (status === "REJECTED" && !reasons[donationId]?.trim()) {
        showToast("error", "Rejection reason is required.");
        return;
      }
      setProcessingId(donationId);
      await api.patch(`/donations/${donationId}/inspect`, {
        status,
        reason: status === "REJECTED" ? reasons[donationId] : undefined,
      });
      showToast(
        "success",
        status === "INSPECTED" ? "Donation approved." : "Donation rejected."
      );
      await onActionDone();
    } catch (error) {
      const message = error?.response?.data?.message || "Inspection action failed.";
      showToast("error", message);
    } finally {
      setProcessingId(null);
    }
  };

  if (!donations.length) {
    return (
      <div className="rounded-xl border border-indigo-200 bg-white p-6 text-sm text-slate-600">
        No donations are currently waiting in the inspection queue.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {donations.map((donation) => (
        <motion.div
          key={donation.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-indigo-200 bg-white p-5"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
                Submitted for inspection
              </p>
              <h3 className="mt-1 text-base font-semibold text-slate-900">{donation.foodName}</h3>
              <p className="mt-1 text-sm text-slate-600">{donation.quantityKg} kg</p>
              <p className="text-sm text-slate-600">{donation.pickupAddress}</p>
              <p className="mt-1 text-xs text-slate-500">
                Donor: {donation.donor?.fullName || "Unknown"}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={processingId === donation.id}
                onClick={() => inspect(donation.id, "INSPECTED")}
                className="inline-flex items-center gap-1 rounded-md bg-indigo-700 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-600 disabled:opacity-60"
              >
                <ShieldCheck size={16} />
                Approve
              </button>
              <button
                type="button"
                disabled={processingId === donation.id}
                onClick={() => inspect(donation.id, "REJECTED")}
                className="inline-flex items-center gap-1 rounded-md border border-violet-300 bg-violet-50 px-3 py-2 text-sm font-semibold text-violet-700 hover:bg-violet-100 disabled:opacity-60"
              >
                <ShieldX size={16} />
                Reject
              </button>
            </div>
          </div>
          <div className="mt-3">
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Rejection Reason (required for Reject)
            </label>
            <textarea
              value={reasons[donation.id] || ""}
              onChange={(e) =>
                setReasons((prev) => ({ ...prev, [donation.id]: e.target.value }))
              }
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
              rows={2}
              placeholder="Add food safety issue or inspection reason..."
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
}
