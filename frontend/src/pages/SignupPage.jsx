import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Building2, HandHeart, ShieldCheck, Truck, User, Mail, Lock } from "lucide-react";
import AuthLayout from "../components/layout/AuthLayout";
import api from "../api/axios";

const roleCards = [
  { role: "DONOR", label: "Donor", icon: HandHeart },
  { role: "NGO", label: "NGO", icon: Building2 },
  { role: "INSPECTOR", label: "Inspector", icon: ShieldCheck },
  { role: "DELIVERY_PARTNER", label: "Delivery Partner", icon: Truck },
];

export default function SignupPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [roleName, setRoleName] = useState("DONOR");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      setIsSubmitting(true);
      await api.post("/auth/signup", {
        fullName,
        email,
        password,
        roleName,
      });
      navigate("/login");
    } catch (err) {
      setError(err?.response?.data?.message || "Signup failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Create Account"
      subtitle="Join FDLMS and start contributing to food recovery."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-indigo-700 hover:text-indigo-600">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <InputField
          label="Full Name"
          icon={User}
          value={fullName}
          onChange={setFullName}
          type="text"
          placeholder="Shiv Patil"
        />
        <InputField
          label="Email"
          icon={Mail}
          value={email}
          onChange={setEmail}
          type="email"
          placeholder="you@example.com"
        />
        <InputField
          label="Password"
          icon={Lock}
          value={password}
          onChange={setPassword}
          type="password"
          placeholder="Create a secure password"
        />

        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">Select Role</p>
          <div className="grid grid-cols-2 gap-2">
            {roleCards.map(({ role, label, icon: Icon }) => {
              const active = roleName === role;
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => setRoleName(role)}
                  className={`rounded-md border p-3 text-left text-sm transition ${
                    active
                      ? "border-indigo-400 bg-indigo-50 text-indigo-700"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                  }`}
                >
                  <Icon size={16} className="mb-1.5" />
                  <div className="font-medium">{label}</div>
                </button>
              );
            })}
          </div>
        </div>

        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-indigo-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-600"
        >
          {isSubmitting ? "Creating account..." : "Create Account"}
        </button>
      </form>
    </AuthLayout>
  );
}

function InputField({ label, icon: Icon, value, onChange, type, placeholder }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      <div className="flex items-center rounded-md border border-slate-300 px-3">
        <Icon size={16} className="text-slate-500" />
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          required
          className="w-full border-0 px-2 py-2.5 text-sm outline-none"
        />
      </div>
    </label>
  );
}
