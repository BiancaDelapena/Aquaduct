import { useNavigate } from "react-router-dom";

export default function CustomerPage() {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear localStorage
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user_role");

    // Redirect to login page
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="p-8 bg-white rounded-3xl shadow-lg text-center">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Customer Dashboard</h1>
        <p className="text-slate-600 mb-6">You successfully logged in.</p>
        <button
          onClick={handleLogout}
          className="bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white font-bold py-2.5 px-6 rounded-2xl text-sm tracking-wide shadow-lg shadow-red-200 transition-all duration-200"
        >
          Log Out
        </button>
      </div>
    </div>
  );
}
