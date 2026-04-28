import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";

export default function AuthLayout({ title, subtitle, footer, children }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-emerald-50 p-4">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-5xl items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28 }}
          className="grid w-full overflow-hidden rounded-2xl border border-slate-200 bg-white lg:grid-cols-[1.1fr,1fr]"
        >
          <div className="hidden border-r border-slate-200 bg-slate-900 p-10 text-white lg:block">
            <div className="mb-6 inline-flex items-center gap-2 rounded-md bg-white/10 px-3 py-2 text-sm">
              <ShieldCheck size={16} />
              FDLMS Secure Access
            </div>
            <h2 className="text-3xl font-semibold leading-tight">
              Food Donation and Lifecycle Management System
            </h2>
            <p className="mt-4 text-sm text-slate-200">
              Safely submit, inspect, and deliver food donations with complete lifecycle
              visibility.
            </p>
          </div>

          <div className="p-6 sm:p-8">
            <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-indigo-700">
              <ShieldCheck size={16} />
              FDLMS
            </Link>
            <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
            <div className="mt-6">{children}</div>
            <div className="mt-6 text-sm text-slate-600">{footer}</div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
