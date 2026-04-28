import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Mail, Lock } from "lucide-react";
import AuthLayout from "../components/layout/AuthLayout";
import api from "../api/axios";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      setIsSubmitting(true);
      const response = await api.post("/auth/login", {
        email,
        password,
        clientType: "web",
      });

      if (rememberMe) {
        localStorage.setItem("token", response.data.token);
      } else {
        localStorage.setItem("token", response.data.token);
      }
      navigate("/dashboard");
    } catch (err) {
      setError(err?.response?.data?.message || "Login failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to continue managing your food donations."
      footer={
        <>
          No account yet?{" "}
          <Link to="/signup" className="font-medium text-indigo-700 hover:text-indigo-600">
            Create one
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <InputField
          label="Email"
          icon={Mail}
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="you@example.com"
        />
        <InputField
          label="Password"
          icon={Lock}
          type="password"
          value={password}
          onChange={setPassword}
          placeholder="Enter your password"
        />
        <div className="flex items-center justify-between text-sm">
          <label className="inline-flex items-center gap-2 text-slate-600">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="size-4 rounded border-slate-300 text-indigo-700"
            />
            Remember me
          </label>
          <button type="button" className="text-indigo-700 hover:text-indigo-600">
            Forgot Password?
          </button>
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
          {isSubmitting ? "Signing in..." : "Sign In"}
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
