// src/components/Sidebar.jsx
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Database,
  ChevronDown,
  LayoutDashboard,
  Users,
  FileSignature,
  User,
  LogOut,
  CheckSquare 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import supabase from "../supabaseClient";
import logo from "../assets/logo.png";
import defaultAvatar from "../assets/logo.png"; // gunakan file default di assets

// Menu khusus untuk RT (path /rt/...)
const menuItemsRT = [
  { id: "dashboard", icon: LayoutDashboard, label: "Dashboard", path: "/rt/dashboard" },
  {
    id: "keloladata",
    icon: Database,
    label: "Kelola Data",
    path: "/rt/keloladata",
    submenu: [
      { id: "datapenduduk", label: "Data Penduduk", path: "/rt/keloladata/datapenduduk" },
      { id: "datakartukeluarga", label: "Data Kartu Keluarga", path: "/rt/keloladata/datakartukeluarga" },
    ],
  },
  {
    id: "sirkulasipenduduk",
    icon: Users,
    label: "Sirkulasi Penduduk",
    path: "/rt/sirkulasipenduduk",
    submenu: [
      { id: "datakelahiran", label: "Data Kelahiran", path: "/rt/sirkulasipenduduk/datakelahiran" },
      { id: "datakematian", label: "Data Kematian", path: "/rt/sirkulasipenduduk/datakematian" },
      { id: "datapendatang", label: "Data Pendatang", path: "/rt/sirkulasipenduduk/datapendatang" },
      { id: "datapindah", label: "Data Pindah", path: "/rt/sirkulasipenduduk/datapindah" },
    ],
  },
  { id: "kelolalaporan", icon: FileSignature, label: "Kelola Laporan", path: "/rt/kelolalaporan/kelolalaporan" },
  { id: "akun", icon: User, label: "Akun", path: "/rt/akun/dataakun" },
  { id: "logout", icon: LogOut, label: "Logout", path: "/logout" },
];

// Menu khusus untuk RW (path /rw/...)
const menuItemsRW = [
  { id: "dashboard", icon: LayoutDashboard, label: "Dashboard", path: "/rw/rwdashboard" },
  {
    id: "keloladata",
    icon: Database,
    label: "Kelola Data",
    path: "/rw/rwkeloladata",
    submenu: [
      {
        id: "datapenduduk",
        label: "Data Penduduk",
        path: "/rw/rwkeloladata/datapenduduk",
        aliases: ["/rw/rwkeloladata/detailperrt"],
      },
      {
        id: "datakddartukeluarga",
        label: "Data Kartu Keluarga",
        path: "/rw/rwkeloladata/datakkperrt",
        aliases: ["/rw/rwkeloladata/detailkkperrt"],
      },
    ],
  },
  {
    id: "sirkulasipenduduk",
    icon: Users,
    label: "Sirkulasi Penduduk",
    path: "/rw/rwsirkulasipenduduk",
    submenu: [
      { id: "datakelahiran", label: "Data Kelahiran", path: "/rw/rwsirkulasipenduduk/datakelahiranrt" },
      { id: "datakematian", label: "Data Kematian", path: "/rw/rwsirkulasipenduduk/datakematianrt" },
      {
        id: "datapendatang",
        label: "Data Pendatang",
        path: "/rw/rwsirkulasipenduduk/datapendatangrt",
        aliases: ["/rw/rwsirkulasipenduduk/detailpendatangperrt"],
      },
      {
        id: "datapindah",
        label: "Data Pindah",
        path: "/rw/rwsirkulasipenduduk/datapindahrt",
        aliases: ["/rw/rwsirkulasipenduduk/detailpindahperrt"],
      },
    ],
  },
  { id: "kelolalaporan", icon: FileSignature, label: "Kelola Laporan", path: "/rw/rwkelolalaporan/laporan" },
  { id: "akun", icon: User, label: "Akun", path: "/rw/rwakun/dataakun" },
  { id: "logout", icon: LogOut, label: "Logout", path: "/logout" },
];

// Menu khusus untuk ADMIN
const menuItemsAdmin = [
  { id: "dashboard", icon: LayoutDashboard, label: "Dashboard", path: "/admin/admindashboard" },
  {
    id: "keloladata",
    icon: Database,
    label: "Kelola Data",
    path: "/admin/kelola_data",
    submenu: [
      { id: "data_penduduk", label: "Data Penduduk", path: "/admin/kelola_data/data_penduduk" },
      { id: "datakk", label: "Data Kartu Keluarga", path: "/admin/kelola_data/datakk" },
    ],
  },
  {
    id: "sirkulasi",
    icon: Users,
    label: "Sirkulasi Penduduk",
    path: "/admin/sirkulasi",
    submenu: [
      { id: "data_kelahiran", label: "Data Kelahiran", path: "/admin/sirkulasi_penduduk/data_kelahiran" },
      { id: "data_kematian", label: "Data Kematian", path: "/admin/sirkulasi_penduduk/data_kematian" },
      { id: "data_pendatang", label: "Data Pendatang", path: "/admin/sirkulasi_penduduk/data_pendatang" },
      { id: "data_pindah", label: "Data Pindah", path: "/admin/sirkulasi_penduduk/data_pindah" },
    ],
  },
  {
    id: "permintaan_acc",
    icon: CheckSquare, 
    label: "Permintaan ACC",
    path: "/admin/permintaan_acc",
    submenu: [
      { id: "penduduk_update", label: "Data Penduduk", path: "/admin/permintaan_acc/penduduk_update" },
      { id: "kelahiran_update", label: "Data Kelahiran", path: "/admin/permintaan_acc/kelahiran_update" },
      { id: "kematian_update", label: "Data Kematian", path: "/admin/permintaan_acc/kematian_update" },
      { id: "pendatang_update", label: "Data Pendatang", path: "/admin/permintaan_acc/pendatang_update" },
      { id: "pindah_update", label: "Data Pindah", path: "/admin/permintaan_acc/pindah_update" },
    ],
  },
  { id: "kelola_laporan", icon: FileSignature, label: "Kelola Laporan", path: "/admin/kelola_laporan/kelola_laporan" },
  { id: "data_akun", icon: User, label: "Data Akun", path: "/admin/dataakun/data_akun" },
  { id: "logout", icon: LogOut, label: "Logout", path: "/logout" },
];

function Sidebar({ collapsed = false, onToggle, onLogout }) {
  const location = useLocation();
  const [openMenus, setOpenMenus] = useState({});
  const [userData, setUserData] = useState({
    nama: "Nama Ketua",
    rt: "-",
    rw: "-",
    foto: null,
  });
  const [profileUrl, setProfileUrl] = useState(defaultAvatar);

  // normalized role state (null sebelum fetch selesai)
  const [role, setRole] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // fetch user and compute profile url
  const fetchAndSetUser = async () => {
    try {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        setIsLoaded(true); // no user id -> mark loaded to avoid endless loading
        return;
      }

      const { data, error } = await supabase
        .from("users")
        .select("nama, rt, rw, role, foto")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Gagal ambil data user:", error);
        setIsLoaded(true);
        return;
      }

      // normalisasi role: trim + uppercase (mis. "admin", " Admin ")
      const normalizedRole = data?.role ? String(data.role).trim().toUpperCase() : null;

      setUserData((prev) => ({ ...prev, ...data }));
      setRole(normalizedRole); // bisa "RW", "RT", "ADMIN", null, dst
      setIsLoaded(true);

      // compute profile public url (support both full URL or storage path)
      if (!data?.foto) {
        setProfileUrl(defaultAvatar);
      } else if (typeof data.foto === "string" && (data.foto.startsWith("http://") || data.foto.startsWith("https://"))) {
        // already full url
        setProfileUrl(`${data.foto}?t=${Date.now()}`);
      } else {
        // treat as storage path
        try {
          const { data: urlData } = supabase.storage.from("user-photos").getPublicUrl(data.foto);
          if (urlData?.publicUrl) setProfileUrl(`${urlData.publicUrl}?t=${Date.now()}`);
          else setProfileUrl(defaultAvatar);
        } catch (err) {
          console.warn("Gagal ambil publicUrl:", err);
          setProfileUrl(defaultAvatar);
        }
      }
    } catch (err) {
      console.error("Unexpected error fetching user:", err);
      setIsLoaded(true);
    }
  };

  useEffect(() => {
    fetchAndSetUser();

    const handleProfileUpdate = () => {
      // re-fetch when profile-updated event fires
      fetchAndSetUser();
    };

    window.addEventListener("profile-updated", handleProfileUpdate);
    return () => window.removeEventListener("profile-updated", handleProfileUpdate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleMenu = (id, hasSubmenu) => {
    if (collapsed && hasSubmenu) {
      onToggle(false);
      setOpenMenus({ [id]: true });
    } else {
      setOpenMenus((prev) => ({ ...prev, [id]: !prev[id] }));
    }
  };

  // helper isActive (cek path & aliases)
  const isActive = (menu) => {
    if (!location || !menu) return false;
    if (location.pathname.startsWith(menu.path)) return true;
    if (menu.aliases) {
      return menu.aliases.some((alias) => location.pathname.startsWith(alias));
    }
    return false;
  };

  // pilih konstanta menu berdasarkan role (setelah load)
  const visibleMenuItems = isLoaded
    ? (role === "RW" ? menuItemsRW : role === "ADMIN" ? menuItemsAdmin : menuItemsRT)
    : menuItemsRT; // fallback sementara sebelum data load

  // helper render title text (tunggu load dulu)
  const renderTitle = () => {
    if (!isLoaded) return "";
    if (role === "RW") return `SIDAK RW ${userData.rw}`;
    if (role === "ADMIN") return `SIDAK ADMIN`;
    return `SIDAK RT ${userData.rt}/RW ${userData.rw}`;
  };

  const renderProfileSubtitle = () => {
    if (!isLoaded) return "";
    if (role === "RW") return `Ketua RW ${userData.rw}`;
    if (role === "ADMIN") return `Administrator`;
    return `Ketua RT ${userData.rt}`;
  };

  return (
    <aside
      className={`${collapsed ? "w-24" : "w-72"} bg-green-800 text-white flex flex-col min-h-screen p-6 transition-all duration-300 ease-in-out overflow-hidden`}
    >
      {/* Logo */}
      <div className={`flex items-center ${collapsed ? "justify-center" : "justify-start"} mb-8`}>
        <div className="flex items-center space-x-3">
          <img src={logo} alt="Logo SIDAK" className={`rounded-xl shadow-lg object-cover ${collapsed ? "w-8 h-8" : "w-10 h-10"}`} />
          {!collapsed && <h1 className="text-xl font-bold">{renderTitle()}</h1>}
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto overflow-x-hidden">
        {visibleMenuItems.map((item) => (
          <div key={item.id}>
            {item.submenu ? (
              <div>
                <button
                  onClick={() => toggleMenu(item.id, true)}
                  className={`w-full flex justify-between items-center ${collapsed ? "px-0 justify-center" : "px-3"} py-3 rounded-xl transition-all duration-200 hover:bg-green-700 ${isActive(item) ? "bg-green-700" : ""}`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </div>
                  {!collapsed && (
                    <ChevronDown className={`w-4 h-4 transform transition-transform duration-300 ${openMenus[item.id] ? "rotate-180" : ""}`} />
                  )}
                </button>

                <AnimatePresence>
                  {!collapsed && openMenus[item.id] && item.submenu && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="ml-8 mt-2 space-y-1 overflow-hidden"
                    >
                      {item.submenu.map((subitem) => (
                        <Link
                          key={subitem.id}
                          to={subitem.path}
                          className={`block px-3 py-2 rounded-lg hover:bg-green-700 text-sm ${location.pathname.startsWith(subitem.path) ? "bg-green-700" : ""}`}
                          onClick={() => setOpenMenus((prev) => ({ ...prev, [item.id]: false }))}
                        >
                          {subitem.label}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                to={item.path}
                onClick={item.id === "logout" ? onLogout : undefined}
                className={`w-full flex items-center space-x-3 ${collapsed ? "justify-center px-0" : "justify-start px-3"} py-3 rounded-xl transition-all duration-200 hover:bg-green-700 ${isActive(item) ? "bg-green-700" : ""}`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            )}
          </div>
        ))}
      </nav>

      {/* User Profile */}
      <div className="mt-auto">
        <div className={`flex items-center space-x-3 rounded-xl bg-slate-50/10 p-2 transition-all duration-300 ${collapsed ? "justify-center" : "justify-start"}`}>
          <img
            src={profileUrl}
            alt={userData.nama || "user"}
            className="w-10 h-10 rounded-full ring-2 ring-blue-500 object-cover"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = defaultAvatar;
            }}
          />
          {!collapsed && (
            <div className="truncate">
              <p className="text-sm font-medium truncate">{userData.nama}</p>
              <p className="text-xs text-slate-300 truncate">{renderProfileSubtitle()}</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
