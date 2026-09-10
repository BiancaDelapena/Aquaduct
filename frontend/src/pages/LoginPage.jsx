//LoginPage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from '../api';
import logo from "../assets/logoaqud.png";

const DropletIcon = () => (
  <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C12 2 4 10.5 4 15a8 8 0 0016 0C20 10.5 12 2 12 2z" />
  </svg>
);

const MailIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const LockIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 11V7a5 5 0 0110 0v4" />
  </svg>
);

const EyeIcon = ({ open }) =>
  open ? (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ) : (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M3 3l18 18" />
    </svg>
  );

const features = [
  {
    title: "Automated Reminders",
    desc: "Never run out of water with scheduled refills",
  },
  {
    title: "Real-time Tracking",
    desc: "Track your delivery from pickup to doorstep",
  },
];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loggingIn, setLoggingIn] = useState(false);
  const navigate = useNavigate();

  // Check if already authenticated
  useEffect(() => {
    API.get('profile/')
      .then(res => {
        if (res.data.role === 'Admin')
          navigate('/admin-dashboard', { replace: true });
        else
          navigate('/dashboard', { replace: true });
      })
      .catch(() => {
        // Not logged in – safe to show the form
      })
      .finally(() => {
        setCheckingAuth(false);
      });
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoggingIn(true);
    try {
      const res = await API.post("token/", {
        username: email,
        password: password,
      });

      const roleFromResponse = res.data.role;

      if (roleFromResponse === "Customer") {
        navigate("/dashboard", { replace: true });
      } else if (roleFromResponse === "Admin") {
        navigate("/admin-dashboard", { replace: true });
      } else {
        setError("Invalid dashboard routing role.");
        setLoggingIn(false);
      }
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Invalid username or password."
      );
      setLoggingIn(false);
    }
  };

  // Show spinner while checking auth or logging in
  if (checkingAuth || loggingIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-10 via-blue-30 to-indigo-90 flex items-center justify-center p-6">
      <div className="w-full max-w-5xl flex flex-col md:flex-row items-center gap-12">

        {/* ── Left Panel ── */}
        <div className="flex-1 w-full">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl overflow-hidden">
              <img
                src={logo}
                alt="Aquaduct Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="font-gugi text-2xl bg-gradient-to-t from-blue-700 to-cyan-300 
            bg-clip-text text-transparent">Aquaduct</span>
          </div>

          <p className="text-slate-500 text-sm mb-8">
            Water Jug Delivery Management System
          </p>

          {/* Features */}
          <div className="space-y-6">
            {features.map(({ title, desc }) => (
              <div key={title} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <DropletIcon />
                </div>
                <div>
                  <p className="font-bold text-blue-900">{title}</p>
                  <p className="text-slate-500 text-sm mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Login Card ── */}
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-blue-100/60 p-8 border border-slate-100">
          <h1 className="text-2xl font-extrabold text-slate-800 mb-1">Welcome Back</h1>
          <p className="text-slate-500 text-sm mb-6">Sign in to access your dashboard</p>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Email or Username
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <MailIcon />
                </span>
                <input
                  type="text"
                  required
                  placeholder="Enter your email or username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 bg-slate-50 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <LockIcon />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 border-2 border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 bg-slate-50 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <EyeIcon open={showPassword} />
                </button>
              </div>
            </div>

            {/* Remember me + Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 accent-blue-600"
                />
                <span className="text-sm text-slate-600">Remember me</span>
              </label>
              <button 
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors bg-transparent border-none cursor-pointer"
              >
                Forgot password?
              </button>
            </div>

            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}

            {/* Sign In Button */}
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold py-3.5 rounded-2xl text-sm tracking-wide shadow-lg shadow-blue-200 transition-all duration-200"
            >
              Sign In
            </button>
          </form>

          {/* Create Account */}
          <p className="text-center text-sm text-slate-500 mt-5">
            Don't have an account?{" "}
            <button
              type="button"
              onClick={() => navigate("/signup")}
              className="font-bold text-blue-600 hover:text-blue-800 transition-colors bg-none border-none cursor-pointer"
            >
              Create Account
            </button>
          </p>
        </div>

      </div>
    </div>
  );
}