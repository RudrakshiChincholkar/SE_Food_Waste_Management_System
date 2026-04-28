import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  HandHeart,
  UserCircle2,
  Settings,
  LogOut,
  Menu,
  Package,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/dashboard" },
  { label: "My Donations", icon: HandHeart, to: "/dashboard" },
  { label: "Profile", icon: UserCircle2, to: "/dashboard" },
  { label: "Settings", icon: Settings, to: "/dashboard" },
];

function decodeToken(token) {
  try {
    const payload = token.split(".")[1];
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = JSON.parse(window.atob(normalized));
    return decoded;
  } catch (_error) {
    return null;
  }
}

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const userName = useMemo(() => {
    const token = localStorage.getItem("token");
    const payload = token ? decodeToken(token) : null;
    if (!payload?.email) return "User";
    const nameFromEmail = payload.email.split("@")[0].replace(/[._-]/g, " ");
    return nameFromEmail
      .split(" ")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }, []);

  const onLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 border-r border-slate-200 bg-white p-5 lg:block">
          <SidebarContent location={location} />
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
              <SidebarContent
                location={location}
                onNavigate={() => setSidebarOpen(false)}
              />
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
              <div className="text-sm text-slate-600">
                Welcome back,{" "}
                <span className="font-semibold text-slate-900">{userName}</span>
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium hover:bg-slate-100"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </header>
          <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">{children}</main>
        </div>
      </div>
    </div>
  );
}

function SidebarContent({ location, onNavigate }) {
  return (
    <div className="flex h-full flex-col">
      <div className="mb-8 flex items-center gap-3">
        <span className="rounded-lg bg-indigo-100 p-2 text-indigo-700">
          <Package size={20} />
        </span>
        <div>
          <p className="text-sm text-slate-500">FDLMS</p>
          <p className="text-base font-semibold">Donor Panel</p>
        </div>
      </div>

      <nav className="space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = location.pathname === item.to;
          return (
            <Link
              key={item.label}
              to={item.to}
              onClick={onNavigate}
              className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition ${
                active
                  ? "bg-indigo-700 text-white"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <Icon size={16} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
