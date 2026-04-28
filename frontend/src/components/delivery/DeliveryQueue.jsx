import { useState } from "react";
import { motion } from "framer-motion";
import { Truck, MapPin, CheckCircle2 } from "lucide-react";
import api from "../../api/axios";

const badgeClasses = {
  ACCEPTED: "border-amber-300 bg-amber-50 text-amber-800",
  IN_TRANSIT: "border-blue-300 bg-blue-50 text-blue-800",
};

export default function DeliveryQueue({ donations, onActionDone, showToast }) {
  const [processingId, setProcessingId] = useState(null);

  const startPickup = async (id) => {
    try {
      setProcessingId(id);
      await api.patch(`/donations/${id}/pickup`);
      showToast("success", "Pickup started.");
      await onActionDone();
    } catch (error) {
      const message = error?.response?.data?.message || "Failed to start pickup.";
      showToast("error", message);
    } finally {
      setProcessingId(null);
    }
  };

  const confirmDelivery = async (id) => {
    try {
      setProcessingId(id);
      await api.patch(`/donations/${id}/deliver`);
      showToast("success", "Delivery confirmed.");
      await onActionDone();
    } catch (error) {
      const message = error?.response?.data?.message || "Failed to confirm delivery.";
      showToast("error", message);
    } finally {
      setProcessingId(null);
    }
  };

  if (!donations.length) {
    return (
      <div className="rounded-xl border border-amber-200 bg-white p-6 text-sm text-slate-600">
        No delivery tasks available right now.
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
          className="rounded-xl border border-amber-200 bg-white p-5"
        >
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base font-semibold text-slate-900">{donation.foodName}</h3>
            <span
              className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
                badgeClasses[donation.currentState] || "border-slate-200 bg-slate-50 text-slate-700"
              }`}
            >
              {donation.currentState}
            </span>
          </div>

          <div className="mt-3 space-y-2 text-sm">
            <p className="flex items-start gap-2 text-slate-700">
              <MapPin size={16} className="mt-0.5 text-amber-700" />
              <span>
                <span className="font-medium">Pickup From:</span> {donation.pickupAddress}
              </span>
            </p>
            <p className="flex items-start gap-2 text-slate-700">
              <Truck size={16} className="mt-0.5 text-blue-700" />
              <span>
                <span className="font-medium">Deliver To:</span>{" "}
                {donation.recipientNgo?.fullName || "Assigned NGO"}
              </span>
            </p>
            <p className="text-xs text-slate-500">Qty: {donation.quantityKg} kg</p>
          </div>

          <div className="mt-4">
            {donation.currentState === "ACCEPTED" ? (
              <button
                type="button"
                disabled={processingId === donation.id}
                onClick={() => startPickup(donation.id)}
                className="inline-flex items-center gap-2 rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-60"
              >
                <Truck size={16} />
                {processingId === donation.id ? "Starting..." : "Start Pickup"}
              </button>
            ) : (
              <button
                type="button"
                disabled={processingId === donation.id}
                onClick={() => confirmDelivery(donation.id)}
                className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                <CheckCircle2 size={16} />
                {processingId === donation.id ? "Confirming..." : "Confirm Delivery"}
              </button>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
