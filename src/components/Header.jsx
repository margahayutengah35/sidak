import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { X, Menu, Search } from "lucide-react";
import supabase from "../supabaseClient";

function Header({ onToggleSidebar }) {
  const location = useLocation();
  const navigate = useNavigate();

  const rawRole = (localStorage.getItem("userRole") || "rt").toString().trim().toLowerCase();
  const role = rawRole === "rw" ? "rw" : rawRole === "admin" ? "admin" : "rt";

  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  const debounceRef = useRef(null);
  const fetchIdRef = useRef(0);

  const getTitle = () => {
    const path = location.pathname;

    if (path.startsWith("/rw")) {
      if (path === "/rw/dashboard") return "Dashboard";
      if (
        path.includes("/rw/rwkeloladata/datapenduduk") ||
        path.includes("/rw/rwkeloladata/detailperrt")
      ) return "Data Penduduk";
      if (
        path.includes("/rw/rwkeloladata/datakkperrt") ||
        path.includes("/rw/rwkeloladata/detailkkperrt")
      ) return "Data Kartu Keluarga";
      if (path.includes("/rw/rwsirkulasipenduduk/datakelahiran")) return "Data Kelahiran";
      if (path.includes("/rw/rwsirkulasipenduduk/datakematian")) return "Data Kematian";
      if (path.includes("/rw/rwsirkulasipenduduk/datapendatang")) return "Data Pendatang";
      if (path.includes("/rw/rwsirkulasipenduduk/datapindah")) return "Data Pindah";
      if (path.includes("/rw/rwkelolalaporan/laporan")) return "Kelola Laporan";
      if (path.startsWith("/rw/rwakun")) return "Akun";
      return "Dashboard";
    }

    if (path.startsWith("/rt")) {
      if (path === "/rt/dashboard") return "Dashboard";
      if (path.includes("/rt/keloladata/datapenduduk")) return "Data Penduduk";
      if (path.includes("/rt/keloladata/datakartukeluarga")) return "Data Kartu Keluarga";
      if (path.includes("/rt/sirkulasipenduduk/datakelahiran")) return "Data Kelahiran";
      if (path.includes("/rt/sirkulasipenduduk/datakematian")) return "Data Kematian";
      if (path.includes("/rt/sirkulasipenduduk/datapendatang")) return "Data Pendatang";
      if (path.includes("/rt/sirkulasipenduduk/datapindah")) return "Data Pindah";
      if (path.includes("/rt/kelolalaporan/kelolalaporan")) return "Kelola Laporan";
      if (path.startsWith("/rt/akun")) return "Akun";
      return "Dashboard";
    }

    if (path.startsWith("/admin")) {
      if (path === "/admin/admindashboard") return "Dashboard";
      if (path.includes("/admin/kelola_data/data_penduduk")) return "Data Penduduk";
      if (path.includes("/admin/kelola_data/datakk")) return "Data Kartu Keluarga";
      if (path.includes("/admin/sirkulasi_penduduk/data_kelahiran")) return "Data Kelahiran";
      if (path.includes("/admin/sirkulasi_penduduk/data_kematian")) return "Data Kematian";
      if (path.includes("/admin/sirkulasi_penduduk/data_pendatang")) return "Data Pendatang";
      if (path.includes("/admin/sirkulasi_penduduk/data_pindah")) return "Data Pindah";
      if (path.includes("/admin/kelola_laporan/kelola_laporan")) return "Kelola Laporan";
      if (path.startsWith("/admin/akun")) return "Akun";
      return "Dashboard";
    }

    if (path.includes("/logout")) return "Logout";
    return "Dashboard";
  };

  const escapeLike = (s) => String(s || "").replace(/%/g, "\\%").replace(/_/g, "\\_").trim();

const fetchResults = async (keyword) => {
  const trimmed = String(keyword || "").trim();
  const thisFetchId = ++fetchIdRef.current;

  if (!trimmed) {
    if (thisFetchId === fetchIdRef.current) {
      setResults([]);
      setLoading(false);
      setHasFetched(false);
    }
    return;
  }

  setLoading(true);
  setHasFetched(false);
  const safe = escapeLike(trimmed);

  // Ambil RT/RW user
  const userRt = localStorage.getItem("userRt");
  const userRw = localStorage.getItem("userRw");

  try {
    const allResults = [];

    // ===== DATA PENDUDUK =====
    {
      let query = supabase
        .from("data_penduduk")
        .select("*")
        .or(`nik.ilike.%${safe}%,nama.ilike.%${safe}%,no_kk.ilike.%${safe}%`);

      if (role === "rt") query = query.eq("rt", userRt).eq("rw", userRw);
      if (role === "rw") query = query.eq("rw", userRw);

      const { data, error } = await query;
      if (thisFetchId !== fetchIdRef.current) return;
      if (!error && Array.isArray(data) && data.length > 0) {
        allResults.push(...data.map((r) => ({ ...r, sumber: "Penduduk" })));
      }
    }

    // ===== KARTU KELUARGA =====
    {
      let query = supabase
        .from("data_penduduk")
        .select("*")
        .or(`no_kk.ilike.%${safe}%,nama.ilike.%${safe}%`);
      if (role === "rt") query = query.eq("rt", userRt).eq("rw", userRw);
      if (role === "rw") query = query.eq("rw", userRw);

      const { data, error } = await query;
      if (thisFetchId !== fetchIdRef.current) return;
      if (!error && Array.isArray(data) && data.length > 0) {
        allResults.push(...data.map((r) => ({ ...r, sumber: "Kartu Keluarga" })));
      }
    }

    // ===== KELAHIRAN =====
    {
      let query = supabase
        .from("data_kelahiran")
        .select("*")
        .or(`nik.ilike.%${safe}%,nama.ilike.%${safe}%`);
      if (role === "rt") query = query.eq("rt", userRt).eq("rw", userRw);
      if (role === "rw") query = query.eq("rw", userRw);

      const { data, error } = await query;
      if (thisFetchId !== fetchIdRef.current) return;
      if (!error && Array.isArray(data) && data.length > 0) {
        allResults.push(...data.map((r) => ({ ...r, sumber: "Kelahiran" })));
      }
    }

    // ===== KEMATIAN =====
    {
      let query = supabase
        .from("data_kematian")
        .select("*")
        .or(`nik.ilike.%${safe}%,nama.ilike.%${safe}%`);
      if (role === "rt") query = query.eq("rt", userRt).eq("rw", userRw);
      if (role === "rw") query = query.eq("rw", userRw);

      const { data, error } = await query;
      if (thisFetchId !== fetchIdRef.current) return;
      if (!error && Array.isArray(data) && data.length > 0) {
        allResults.push(...data.map((r) => ({ ...r, sumber: "Kematian" })));
      }
    }

    // ===== PENDATANG =====
    {
      let query = supabase
        .from("data_pendatang")
        .select("*")
        .or(`nik.ilike.%${safe}%,nama.ilike.%${safe}%`);
      if (role === "rt") query = query.eq("rt", userRt).eq("rw", userRw);
      if (role === "rw") query = query.eq("rw", userRw);

      const { data, error } = await query;
      if (thisFetchId !== fetchIdRef.current) return;
      if (!error && Array.isArray(data) && data.length > 0) {
        allResults.push(...data.map((r) => ({ ...r, sumber: "Pendatang" })));
      }
    }

    // ===== PINDAH =====
    {
      let query = supabase
        .from("data_pindah")
        .select("*")
        .or(`nik.ilike.%${safe}%,nama.ilike.%${safe}%`);
      if (role === "rt") query = query.eq("rt", userRt).eq("rw", userRw);
      if (role === "rw") query = query.eq("rw", userRw);

      const { data, error } = await query;
      if (thisFetchId !== fetchIdRef.current) return;
      if (!error && Array.isArray(data) && data.length > 0) {
        allResults.push(...data.map((r) => ({ ...r, sumber: "Pindah" })));
      }
    }

    // ===== Deduplicate =====
    const seen = new Set();
    const deduped = [];
    for (const row of allResults) {
      const key = row.id ?? `${row.nik ?? ""}-${row.no_kk ?? ""}-${row.nama ?? ""}-${row.sumber}`;
      if (!seen.has(key)) {
        seen.add(key);
        deduped.push(row);
      }
    }

    if (thisFetchId !== fetchIdRef.current) return;

    setResults(deduped);
    setHasFetched(true);
  } catch (err) {
    console.error("Search error:", err);
    if (thisFetchId === fetchIdRef.current) {
      setResults([]);
      setHasFetched(true);
    }
  } finally {
    if (thisFetchId === fetchIdRef.current) setLoading(false);
  }
};

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      fetchIdRef.current += 1;
    };
  }, []);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchResults(value), 350);
  };

  const handleClearSearchAndFilter = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    fetchIdRef.current += 1;
    setSearch("");
    setResults([]);
    setHasFetched(false);
    setLoading(false);
  
    const currentPath = location.pathname;
  
    // === KHUSUS RW ===
    if (role === "rw") {
      // Jika sedang di halaman kelahiran per RT (search mode)
      if (currentPath.startsWith("/rw/rwsirkulasipenduduk/detailkelahiranperrt/search")) {
        const lastRt = localStorage.getItem("lastViewedRt");
        if (lastRt) {
          navigate(`/rw/rwsirkulasipenduduk/detailkelahiranperrt/${lastRt}`, { replace: true });
          return;
        }
      }
    }
  
    // Default behaviour (reset ke halaman tanpa query)
    navigate(location.pathname, { replace: true });
  };
  
  const handleSelectResult = (item) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    fetchIdRef.current += 1;
    setResults([]);
    setHasFetched(false);

    const sumber = item.sumber;
    const nik = item.nik;
    const no_kk = item.no_kk;
    const name = item.nama;
    const kw = nik || no_kk || name || "";

    // RT behavior
    if (role === "rt") {
      switch (sumber) {
        case "Penduduk":
          navigate(`/rt/keloladata/datapenduduk?keyword=${encodeURIComponent(kw)}`);
          break;
        case "Kartu Keluarga":
          navigate(`/rt/keloladata/datakartukeluarga?no_kk=${encodeURIComponent(no_kk || kw)}`);
          break;
        case "Kelahiran":
          navigate(`/rt/sirkulasipenduduk/datakelahiran?keyword=${encodeURIComponent(kw)}`);
          break;
        case "Kematian":
          navigate(`/rt/sirkulasipenduduk/datakematian?keyword=${encodeURIComponent(kw)}`);
          break;
        case "Pendatang":
          navigate(`/rt/sirkulasipenduduk/datapendatang?keyword=${encodeURIComponent(kw)}`);
          break;
        case "Pindah":
          navigate(`/rt/sirkulasipenduduk/datapindah?keyword=${encodeURIComponent(kw)}`);
          break;
        default:
          navigate(`/rt/keloladata/datapenduduk?keyword=${encodeURIComponent(kw)}`);
      }
      return;
    }

    // RW behavior
    if (role === "rw") {
      switch (sumber) {
        case "Penduduk":
          if (item.rt) {
            navigate(`/rw/rwkeloladata/detailperrt/${item.rt}?keyword=${encodeURIComponent(kw)}`);
          } else {
            navigate(`/rw/rwkeloladata/datapenduduk?keyword=${encodeURIComponent(kw)}`);
          }
          break;
        case "Kartu Keluarga":
          if (no_kk) {
            navigate(`/rw/rwkeloladata/detailkkperrt/search?no_kk=${encodeURIComponent(no_kk)}`);
          } else {
            navigate(`/rw/rwkeloladata/detailkkperrt/search?keyword=${encodeURIComponent(kw)}`);
          }
          break;
        case "Kelahiran":
          navigate(`/rw/rwsirkulasipenduduk/detailkelahiranperrt/search?keyword=${encodeURIComponent(kw)}`);
          break;
        case "Kematian":
          if (item.rt) {
            navigate(`/rw/rwsirkulasipenduduk/detailkematianperrt/${item.rt}?keyword=${encodeURIComponent(kw)}`);
          } else {
            navigate(`/rw/rwsirkulasipenduduk/detailkematianperrt/search?keyword=${encodeURIComponent(kw)}`);
          }
          break;
        case "Pendatang":
          if (item.rt) {
            navigate(`/rw/rwsirkulasipenduduk/detailpendatangperrt/${item.rt}?keyword=${encodeURIComponent(kw)}`);
          } else {
            navigate(`/rw/rwsirkulasipenduduk/detailpendatangperrt/search?keyword=${encodeURIComponent(kw)}`);
          }
          break;
        case "Pindah":
          if (item.rt) {
            navigate(`/rw/rwsirkulasipenduduk/detailpindahperrt/${item.rt}?keyword=${encodeURIComponent(kw)}`);
          } else {
            navigate(`/rw/rwsirkulasipenduduk/detailpindahperrt/search?keyword=${encodeURIComponent(kw)}`);
          }
          break;
        default:
          navigate(`/rw/rwkeloladata/datapenduduk?keyword=${encodeURIComponent(kw)}`);
      }
      return;
    }

    // ADMIN behavior: menuju ke halaman admin, prioritas no_kk jika ada
    if (role === "admin") {
      switch (sumber) {
        case "Penduduk":
          navigate(`/admin/kelola_data/data_penduduk?keyword=${encodeURIComponent(kw)}`);
          break;
        case "Kartu Keluarga":
          // PENTING: pakai no_kk kalau tersedia, kalau tidak pakai kw
          navigate(`/admin/kelola_data/datakk?no_kk=${encodeURIComponent(no_kk || kw)}`);
          break;
        case "Kelahiran":
          navigate(`/admin/sirkulasi_penduduk/data_kelahiran?keyword=${encodeURIComponent(kw)}`);
          break;
        case "Kematian":
          navigate(`/admin/sirkulasi_penduduk/data_kematian?keyword=${encodeURIComponent(kw)}`);
          break;
        case "Pendatang":
          navigate(`/admin/sirkulasi_penduduk/data_pendatang?keyword=${encodeURIComponent(kw)}`);
          break;
        case "Pindah":
          navigate(`/admin/sirkulasi_penduduk/data_pindah?keyword=${encodeURIComponent(kw)}`);
          break;
        default:
          navigate(`/admin/kelola_data/data_penduduk?keyword=${encodeURIComponent(kw)}`);
      }
      return;
    }
  };

  return (
    <header className="bg-green-800 text-white flex items-center justify-between px-3 md:px-6 py-3 md:py-4 shadow-md relative">
      <div className="flex items-center space-x-3 md:space-x-4">
        <button onClick={onToggleSidebar} className="p-2 rounded-lg hover:bg-green-700 transition-colors">
          <Menu className="w-5 h-5 md:w-6 md:h-6" />
        </button>
        <h1 className="text-base md:text-lg font-semibold truncate">{getTitle()}</h1>
      </div>

      <div className="hidden md:flex flex-1 max-w-md mx-4 md:mx-8 relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={handleSearchChange}
          placeholder="Cari NIK, No KK, Nama..."
          className="w-full pl-8 pr-10 py-2 bg-slate-100 border border-slate-500 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
        />

        {(search || new URLSearchParams(location.search).get("keyword") || new URLSearchParams(location.search).get("no_kk")) && (
          <button
            onClick={handleClearSearchAndFilter}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-green-700/20"
            title="Bersihkan"
          >
            <X className="w-4 h-4 text-slate-600" />
          </button>
        )}

        {search && !loading && results.length > 0 && (
          <div className="absolute top-12 left-0 w-full bg-white text-black rounded-lg shadow-lg max-h-60 overflow-y-auto z-50 border border-gray-300">
            {results.map((item, i) => (
              <div
                key={i}
                onClick={() => handleSelectResult(item)}
                className="px-4 py-2 hover:bg-gray-200 cursor-pointer flex justify-between items-center"
              >
                <div className="truncate text-left">
                  <div className="font-medium">{item.nama ?? (item.nik || item.no_kk)}</div>
                  <div className="text-xs text-gray-500">{item.nik ?? item.no_kk ?? ""}</div>
                </div>
                <div className="text-xs text-gray-500 italic ml-2">{item.sumber}</div>
              </div>
            ))}
          </div>
        )}

        {search && !loading && hasFetched && results.length === 0 && (
          <div className="absolute top-12 left-0 w-full bg-white text-black rounded-lg shadow-lg p-3 z-50 border border-gray-300">
            <p className="text-sm text-gray-500">Data tidak ditemukan</p>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
