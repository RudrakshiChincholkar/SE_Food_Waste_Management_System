import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import api from "../api/axios";
import AvailableMarketplace from "../components/marketplace/AvailableMarketplace";
import InspectionQueue from "../components/inspector/InspectionQueue";
import DeliveryQueue from "../components/delivery/DeliveryQueue";

const statusClasses = {
  SUBMITTED: "bg-blue-50 text-blue-700 border-blue-200",
  INSPECTED: "bg-purple-50 text-purple-700 border-purple-200",
  ACCEPTED: "bg-orange-50 text-orange-700 border-orange-200",
  IN_TRANSIT: "bg-amber-50 text-amber-700 border-amber-200",
  FULFILLED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  REJECTED: "bg-red-50 text-red-700 border-red-200",
  EXPIRED: "bg-red-50 text-red-700 border-red-200",
};

const initialForm = {
  foodName: "",
  quantityKg: "",
  expiryDate: "",
  pickupAddress: "",
};

export default function DonorDashboard() {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [donations, setDonations] = useState([]);
  const [toast, setToast] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [role, setRole] = useState("DONOR");

  const showToast = (type, message) => {
    setToast({ type, message });
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => {
      setToast(null);
    }, 2500);
  };

  const loadDonations = async () => {
    try {
      const response = await api.get("/donations");
      setDonations(response.data?.donations || []);
    } catch (error) {
      const msg = error?.response?.data?.message || "Unable to load donations.";
      showToast("error", msg);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(window.atob(token.split(".")[1]));
        setRole(payload?.role || "DONOR");
      } catch (_error) {
        setRole("DONOR");
      }
    }
    loadDonations();
  }, []);

  const stats = useMemo(() => {
    const total = donations.length;
    const kgs = donations.reduce((sum, item) => sum + Number(item.quantityKg), 0);
    const active = donations.filter((item) =>
      ["SUBMITTED", "INSPECTED", "ACCEPTED", "IN_TRANSIT"].includes(item.currentState)
    ).length;
    return [
      { label: "Total Donations", value: total },
      { label: "Kgs Saved", value: `${kgs.toFixed(1)} kg` },
      { label: "Active Requests", value: active },
    ];
  }, [donations]);

  const validate = () => {
    const nextErrors = {};
    if (!form.foodName.trim()) nextErrors.foodName = "Food name is required.";
    const qty = Number(form.quantityKg);
    if (!form.quantityKg || Number.isNaN(qty) || qty <= 0.1 || qty > 10000) {
      nextErrors.quantityKg = "Enter quantity between 0.1 and 10,000 kg.";
    }
    if (!form.expiryDate) {
      nextErrors.expiryDate = "Expiry date is required.";
    } else {
      const expiry = new Date(form.expiryDate);
      const min = new Date(Date.now() + 24 * 60 * 60 * 1000);
      if (expiry < min) nextErrors.expiryDate = "Expiry must be at least 24 hours ahead.";
    }
    if (!form.pickupAddress.trim()) {
      nextErrors.pickupAddress = "Pickup address is required.";
    }
    return nextErrors;
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    try {
      setIsSubmitting(true);
      await api.post("/donations", {
        foodName: form.foodName,
        quantityKg: Number(form.quantityKg),
        expiryDate: form.expiryDate,
        pickupAddress: form.pickupAddress,
      });
      setForm(initialForm);
      await loadDonations();
      showToast("success", "Success: Donation submitted.");
    } catch (error) {
      const msg = error?.response?.data?.message || "Failed to submit donation.";
      showToast("error", msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24 }}
      className="space-y-6"
    >
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`rounded-lg border px-4 py-3 text-sm ${
              toast.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <section className="grid gap-4 sm:grid-cols-3">
        {stats.map((card) => (
          <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold">{card.value}</p>
          </div>
        ))}
      </section>

      {role === "NGO" ? (
        <section className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-semibold">Marketplace</h2>
            <p className="mt-1 text-sm text-slate-500">
              Browse inspected donations and accept requests for your NGO.
            </p>
          </div>
          <AvailableMarketplace
            donations={donations}
            onAccepted={loadDonations}
            showToast={showToast}
          />
        </section>
      ) : role === "INSPECTOR" ? (
        <section className="space-y-4">
          <div className="rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50 to-blue-50 p-5">
            <h2 className="text-lg font-semibold text-indigo-900">Inspection Queue</h2>
            <p className="mt-1 text-sm text-indigo-800/80">
              Review submitted donations, approve safe food, and reject unsafe requests
              with documented reasons.
            </p>
          </div>
          <InspectionQueue
            donations={donations}
            onActionDone={loadDonations}
            showToast={showToast}
          />
        </section>
      ) : role === "DELIVERY_PARTNER" ? (
        <section className="space-y-4">
          <div className="rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 p-5">
            <h2 className="text-lg font-semibold text-amber-900">Delivery Queue</h2>
            <p className="mt-1 text-sm text-amber-800/80">
              Track pickup and drop-off tasks. Start pickup for accepted donations, then
              confirm delivery once dropped at the assigned NGO.
            </p>
          </div>
          <DeliveryQueue
            donations={donations}
            onActionDone={loadDonations}
            showToast={showToast}
          />
        </section>
      ) : (
        <section className="grid gap-6 xl:grid-cols-[1.1fr,1fr]">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-semibold">Donate Food</h2>
            <p className="mt-1 text-sm text-slate-500">
              Submit a pickup request for NGOs and delivery partners.
            </p>
            <form className="mt-5 grid gap-4" onSubmit={onSubmit}>
              <Field
                label="Food Name"
                value={form.foodName}
                error={errors.foodName}
                onChange={(v) => setForm((p) => ({ ...p, foodName: v }))}
                placeholder="Ex: Fresh Vegetable Biryani"
              />
              <Field
                label="Quantity (kg)"
                value={form.quantityKg}
                error={errors.quantityKg}
                onChange={(v) => setForm((p) => ({ ...p, quantityKg: v }))}
                type="number"
                placeholder="Ex: 12.5"
              />
              <Field
                label="Expiry Date"
                value={form.expiryDate}
                error={errors.expiryDate}
                onChange={(v) => setForm((p) => ({ ...p, expiryDate: v }))}
                type="datetime-local"
              />
              <Field
                label="Pickup Address"
                value={form.pickupAddress}
                error={errors.pickupAddress}
                onChange={(v) => setForm((p) => ({ ...p, pickupAddress: v }))}
                placeholder="Building, street, area, city"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-1 rounded-md bg-indigo-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-600"
              >
                {isSubmitting ? "Submitting..." : "Submit Donation Request"}
              </button>
            </form>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-semibold">Active Donations</h2>
            <p className="mt-1 text-sm text-slate-500">
              Recent requests and their current lifecycle status.
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="px-2 py-2 font-medium">Food</th>
                    <th className="px-2 py-2 font-medium">Qty</th>
                    <th className="px-2 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {donations.map((item) => (
                    <tr key={item.id} className="border-b border-slate-100">
                      <td className="px-2 py-3">
                        <p className="font-medium text-slate-800">{item.foodName}</p>
                        <p className="text-xs text-slate-500">{item.pickupAddress}</p>
                      </td>
                      <td className="px-2 py-3 text-slate-700">{item.quantityKg} kg</td>
                      <td className="px-2 py-3">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
                            statusClasses[item.currentState] ||
                            "bg-slate-100 text-slate-700 border-slate-200"
                          }`}
                        >
                          {item.currentState}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </motion.div>
  );
}

function Field({ label, error, value, onChange, type = "text", placeholder = "" }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={`w-full rounded-md border px-3 py-2 text-sm outline-none transition ${
          error ? "border-red-300 focus:border-red-500" : "border-slate-300 focus:border-indigo-500"
        }`}
      />
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}
