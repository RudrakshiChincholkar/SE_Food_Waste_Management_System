import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard,
  HandHeart,
  UserCircle2,
  Settings,
  LogOut,
  Menu,
  Package,
} from "lucide-react";
import api from "./api/axios";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "My Donations", icon: HandHeart },
  { label: "Profile", icon: UserCircle2 },
  { label: "Settings", icon: Settings },
];

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

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [donations, setDonations] = useState([]);
  const [toast, setToast] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 border-r border-slate-200 bg-white p-5 lg:block">
          <SidebarContent />
        </aside>

        <AnimatePresence>
          {sidebarOpen && (
            <motion.aside
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="fixed inset-y-0 z-50 w-72 border-r border-slate-200 bg-white p-5 lg:hidden"
            >
              <SidebarContent onClose={() => setSidebarOpen(false)} />
            </motion.aside>
          )}
        </AnimatePresence>

        <div className="flex-1">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
              <button
                type="button"
                className="rounded-md border border-slate-200 p-2 lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu size={18} />
              </button>
              <div className="text-sm text-slate-600">Welcome back, <span className="font-semibold text-slate-900">Shiv</span></div>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium hover:bg-slate-100"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </header>

          <motion.main
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28 }}
            className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6"
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
                    className="mt-1 rounded-md bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
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
          </motion.main>
        </div>
      </div>
    </div>
  );
}

function SidebarContent({ onClose }) {
  return (
    <div className="flex h-full flex-col">
      <div className="mb-8 flex items-center gap-3">
        <span className="rounded-lg bg-emerald-100 p-2 text-emerald-700">
          <Package size={20} />
        </span>
        <div>
          <p className="text-sm text-slate-500">FDLMS</p>
          <p className="text-base font-semibold">Donor Panel</p>
        </div>
      </div>

      <nav className="space-y-1.5">
        {navItems.map((item, idx) => {
          const Icon = item.icon;
          const active = idx === 0;
          return (
            <button
              key={item.label}
              type="button"
              onClick={onClose}
              className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition ${
                active
                  ? "bg-slate-900 text-white"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <Icon size={16} />
              {item.label}
            </button>
          );
        })}
      </nav>
    </div>
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
          error
            ? "border-red-300 focus:border-red-500"
            : "border-slate-300 focus:border-slate-500"
        }`}
      />
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}

export default App;
