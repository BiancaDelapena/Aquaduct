import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from '../api';
import logo from "../assets/logoaqud.png";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const validateEmail = (value) => emailRegex.test(value);

const DropletIcon = () => (
  <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C12 2 4 10.5 4 15a8 8 0 0016 0C20 10.5 12 2 12 2z" />
  </svg>
);

const UserIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const MailIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const PhoneIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

const MapPinIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
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
    title: "Easy Ordering",
    desc: "Order water jugs with just a few clicks",
  },
  {
    title: "Flexible Delivery",
    desc: "Choose your preferred delivery schedule",
  },
  {
    title: "Track Your Orders",
    desc: "Real-time updates on your deliveries",
  },
];

const rulesMetadata = [
  { key: 'minLength', label: 'At least 8 characters long' },
  { key: 'hasUpperCase', label: 'At least one uppercase letter (A-Z)' },
  { key: 'hasLowerCase', label: 'At least one lowercase letter (a-z)' },
  { key: 'hasNumber', label: 'At least one numeric digit (0-9)' },
  { key: 'hasSpecialChar', label: 'At least one special character (!@#$...)' },
];

const getPasswordRuleStatus = (password) => ({
  minLength: password.length >= 8,
  hasUpperCase: /[A-Z]/.test(password),
  hasLowerCase: /[a-z]/.test(password),
  hasNumber: /[0-9]/.test(password),
  hasSpecialChar: /[!@#$%^&*(),.?"':{}|<>\[\]\\/`~_+=;-]/.test(password),
});

const isPasswordValid = (password) =>
  Object.values(getPasswordRuleStatus(password)).every(Boolean);

export default function RegisterPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    let value = e.target.value;
    if (e.target.name === 'email') {
      value = value.trim();
    }
    if (e.target.name === 'phone') {
      value = value.replace(/[A-Za-z]/g, '');
    }
    setForm({ ...form, [e.target.name]: value });
    if (e.target.name === 'email') setEmailError("");
    if (e.target.name === 'password') {
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setEmailError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!isPasswordValid(form.password)) {
      setError("Password must meet all password requirements.");
      return;
    }

    const email = form.email.trim();
    if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      await API.post("register/", {
        full_name: form.fullName,
        email,
        phone: form.phone,
        address: form.address,
        password: form.password,
      });
      navigate("/"); // go to login after registering
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.email?.[0] || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const passwordStatus = getPasswordRuleStatus(form.password);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-6">
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

            <span className="text-3xl font-extrabold text-blue-900 tracking-tight">
              Aquaduct
            </span>
          </div>

          <p className="text-slate-500 text-sm mb-8">
            Join Our Water Delivery Network
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

        {/* ── Register Card ── */}
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-blue-100/60 p-8 border border-slate-100">
          <h1 className="text-2xl font-extrabold text-slate-800 mb-1">Create Account</h1>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Full Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <UserIcon />
                </span>
                <input
                  type="text"
                  name="fullName"
                  placeholder="Enter your full name"
                  value={form.fullName}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-3 border-2 border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 bg-slate-50 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <MailIcon />
                </span>
                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-3 border-2 border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 bg-slate-50 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </div>
              {emailError && <p className="text-red-500 text-xs mt-1">{emailError}</p>}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Phone Number</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <PhoneIcon />
                </span>
                <input
                  type="tel"
                  inputMode="tel"
                  pattern="[0-9+\-() ]*"
                  name="phone"
                  placeholder="+63 912 345 6789"
                  value={form.phone}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border-2 border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 bg-slate-50 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Address</label>
              <div className="relative">
                <span className="absolute left-3.5 top-3.5 text-slate-400">
                  <MapPinIcon />
                </span>
                <textarea
                  name="address"
                  placeholder="Enter your complete address"
                  value={form.address}
                  onChange={handleChange}
                  rows={2}
                  className="w-full pl-10 pr-4 py-3 border-2 border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 bg-slate-50 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all resize-none"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <LockIcon />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Create a password"
                  value={form.password}
                  onChange={handleChange}
                  required
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
              <div className="mt-3 space-y-2 text-xs">
                {rulesMetadata.map((rule) => {
                  const passed = passwordStatus[rule.key];
                  return (
                    <div
                      key={rule.key}
                      className={`flex items-center gap-2 rounded-xl px-3 py-2 ${passed ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-500'}`}
                    >
                      <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full border ${passed ? 'border-emerald-400 bg-emerald-100' : 'border-slate-200 bg-white'}`}>
                        {passed ? '✓' : '•'}
                      </span>
                      <span>{rule.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Confirm Password</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <LockIcon />
                </span>
                <input
                  type={showConfirm ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Confirm your password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-10 py-3 border-2 border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 bg-slate-50 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <EyeIcon open={showConfirm} />
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold py-3.5 rounded-2xl text-sm tracking-wide shadow-lg shadow-blue-200 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          {/* Sign In */}
          <p className="text-center text-sm text-slate-500 mt-5">
            Already have an account?{" "}
            <button
              onClick={() => navigate("/")}
              className="font-bold text-blue-600 hover:text-blue-800 transition-colors"
            >
              Sign In
            </button>
          </p>
        </div>

      </div>
    </div>
  );
}