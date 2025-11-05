// src/pages/Login.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../supabaseClient";
import Logo from "../assets/logo.png";

function Login({ setUserRole }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    // Query ke tabel users
    const { data, error } = await supabase
      .from("users")
      .select("id, nama, rt, rw, role, username")
      .eq("username", username)
      .eq("password", password)
      .single();

    if (error || !data) {
      setErrorMsg("Username atau password salah!");
      setUsername("");
      setPassword("");
      setTimeout(() => setErrorMsg(""), 2000);
      return;
    }

    // Simpan userRole & RT/RW dengan format 2 digit
    const userRt = String(data.rt).padStart(2, "0");
    const userRw = String(data.rw).padStart(2, "0");

    setUserRole(data.role);
    localStorage.setItem("userRole", data.role);
    localStorage.setItem("userId", data.id);
    localStorage.setItem("userRt", userRt);
    localStorage.setItem("userRw", userRw);

    // Reset stats per user (agar login akun berbeda tidak ketuker)
    localStorage.removeItem(`statsData_${data.id}`);

    // Navigasi sesuai role
    if (data.role === "admin") navigate("/admin/admindashboard");
    else if (data.role === "rt") navigate("/rt/dashboard");
    else if (data.role === "rw") navigate("/rw/rwdashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-800 px-4">
      <div className="w-full max-w-sm bg-white p-6 sm:p-8 rounded-2xl shadow-lg">
        <div className="flex flex-col items-center mb-6">
          <img src={Logo} alt="Logo Desa" className="w-16 h-16 sm:w-20 sm:h-20 mb-4" />
          <h1 className="text-xl sm:text-2xl font-semibold text-center">
            Sistem Data Kependudukan
          </h1>
          <h2 className="text-lg sm:text-2xl font-semibold text-center">
            Desa Margahayu Tengah
          </h2>
        </div>

        {errorMsg && (
          <div className="mb-4 w-full p-3 text-red-700 bg-red-100 rounded border border-red-300 text-center">
            {errorMsg}
          </div>
        )}

        <form className="space-y-4 sm:space-y-6" onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="Username"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-3 sm:p-4 border border-gray-300 rounded outline-none focus:border-cyan-500 placeholder-gray-400"
          />
          <input
            type="password"
            placeholder="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 sm:p-4 border border-gray-300 rounded outline-none focus:border-cyan-500 placeholder-gray-400"
          />
          <button
            type="submit"
            className="w-full p-3 sm:p-4 bg-gradient-to-r from-[#096C00] via-[#1FAA00] to-[#A6FF00] text-white rounded-full text-base sm:text-lg font-medium hover:opacity-90 transition"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
