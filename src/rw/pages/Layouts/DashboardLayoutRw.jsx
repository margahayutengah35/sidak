import React, { useState } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import Sidebar from "../../../components/Sidebar";
import Header from "../../../components/Header";

function DashboardLayoutRw({ onLogout }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const navigate = useNavigate();

  const handleLogoutClick = () => {
    onLogout?.();
    navigate("/");
  };

  const sidebarWidth = sidebarCollapsed ? 6 : 18; // rem

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full bg-green-800 text-white flex flex-col p-4 transition-all duration-300 z-50`}
        style={{ width: `${sidebarWidth}rem` }}
      >
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((prev) => !prev)}
          onLogout={handleLogoutClick}
        />
      </div>

      {/* Main area */}
      <div
        className="flex-1 flex flex-col min-h-screen transition-all duration-300"
        style={{ marginLeft: `${sidebarWidth}rem` }}
      >
        {/* Header */}
        <div
          className="fixed top-0 left-0 right-0 z-40 transition-all duration-300"
          style={{ marginLeft: `${sidebarWidth}rem` }}
        >
          <Header onToggleSidebar={() => setSidebarCollapsed((prev) => !prev)} />
        </div>

        {/* Main content */}
        <main className="flex-1 pt-[100px] px-8 pb-6 bg-slate-100 overflow-auto">
          <div className="w-full min-h-full">
            <Outlet />
          </div>
        </main>

        {/* Footer */}
        <footer className="text-black text-center py-4 bg-slate-200 shadow-inner">
          <p className="text-sm">
            © {new Date().getFullYear()} SIDAK Desa Margahayu Tengah. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
}

export default DashboardLayoutRw;
