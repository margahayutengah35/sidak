import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import supabase from "../../supabaseClient"; // sesuaikan path kalau perlu

const colorClasses = {
  blue: "bg-blue-500 text-white",
  green: "bg-green-500 text-white",
  yellow: "bg-yellow-400 text-slate-800",
  red: "bg-red-500 text-white",
  purple: "bg-purple-500 text-white",
};

// helper: normalize RW ke 2 digit
const normalizeRw = (rw) => {
  if (rw === null || typeof rw === "undefined" || String(rw).trim() === "")
    return "-";
  const n = Number(String(rw).trim());
  if (!isNaN(n)) return String(n).padStart(2, "0");
  return String(rw).trim();
};

function StatsGrid() {
  const navigate = useNavigate();
  const [rwStats, setRwStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchRwStats = async () => {
      setLoading(true);
      try {
        // 1) ambil semua ketua RW dari users
        const { data: ketuaRows = [], error: ketuaErr } = await supabase
          .from("users")
          .select("nama, rw, role");

        if (ketuaErr) {
          console.error("Gagal ambil ketua RW:", ketuaErr);
        }

        const ketuaMap = {};
        ketuaRows.forEach((u) => {
          if (u?.role && String(u.role).toUpperCase().startsWith("RW")) {
            ketuaMap[normalizeRw(u.rw)] = u.nama || "-";
          }
        });

        // 2) Coba RPC dulu (paling efisien, tanpa limit)
        const countsByRw = {};
        try {
          const { data: rpcData, error: rpcErr } = await supabase.rpc(
            "get_penduduk_per_rw" // pastikan function ini ada di DB jika ingin memanfaatkan RPC
          );

          if (!rpcErr && Array.isArray(rpcData) && rpcData.length) {
            rpcData.forEach((r) => {
              // asumsi rpcData row: { rw: ..., count: ... }
              const key = normalizeRw(r.rw);
              countsByRw[key] = Number(r.count ?? 0);
            });
          } else {
            // 3) Kalau RPC tidak ada atau mengembalikan kosong/error, fallback ke pagination
            const pageSize = 1000;
            let from = 0;
            while (true) {
              const to = from + pageSize - 1;
              const { data: pageRows, error: pageErr } = await supabase
                .from("data_penduduk")
                .select("rw")
                .range(from, to);

              if (pageErr) {
                console.error("Gagal ambil halaman data_penduduk:", pageErr);
                break; // stop pagination on error
              }

              if (!pageRows || pageRows.length === 0) break;

              pageRows.forEach((p) => {
                const key = normalizeRw(p.rw);
                countsByRw[key] = (countsByRw[key] || 0) + 1;
              });

              if (pageRows.length < pageSize) break; // last page
              from += pageSize;
            }
          }
        } catch (rpcCatchErr) {
          console.error("Error saat panggil RPC / fallback pagination:", rpcCatchErr);
          // jika RPC throw, coba pagination juga
          const pageSize = 1000;
          let from = 0;
          while (true) {
            const to = from + pageSize - 1;
            const { data: pageRows, error: pageErr } = await supabase
              .from("data_penduduk")
              .select("rw")
              .range(from, to);

            if (pageErr) {
              console.error("Gagal ambil halaman data_penduduk (fallback):", pageErr);
              break;
            }
            if (!pageRows || pageRows.length === 0) break;

            pageRows.forEach((p) => {
              const key = normalizeRw(p.rw);
              countsByRw[key] = (countsByRw[key] || 0) + 1;
            });

            if (pageRows.length < pageSize) break;
            from += pageSize;
          }
        }

        // 4) gabungkan daftar RW dari ketuaMap dan countsByRw
        const allRwKeys = new Set([
          ...Object.keys(ketuaMap),
          ...Object.keys(countsByRw),
        ]);

        const stats = Array.from(allRwKeys)
          .filter((k) => k !== "-" && k !== "") // singkirkan placeholder
          .sort((a, b) => {
            const na = Number(a);
            const nb = Number(b);
            if (!isNaN(na) && !isNaN(nb)) return na - nb;
            return String(a).localeCompare(String(b));
          })
          .map((rw) => ({
            rw,
            ketua: ketuaMap[rw] ?? "-",
            count: countsByRw[rw] ?? 0,
          }));

        if (mounted) {
          setRwStats(stats);
          setLoading(false);
        }
      } catch (err) {
        console.error("Gagal fetch RW stats keseluruhan:", err);
        if (mounted) setLoading(false);
      }
    };

    fetchRwStats();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <div>Loading statistik RW...</div>;
  if (!rwStats.length)
    return <div className="text-sm text-slate-500">Tidak ada data RW.</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {rwStats.map((item, index) => {
        const colors = ["blue", "green", "yellow", "red", "purple"];
        const color = colors[index % colors.length];
        return (
          <div
            key={item.rw}
            className={`${colorClasses[color]} rounded-2xl p-6 hover:shadow-xl transition-all duration-300 flex flex-col justify-between`}
          >
            <div className="flex flex-col mb-4">
              <p className="text-sm font-medium mb-1">RW {item.rw}</p>
              <p className="text-base font-semibold mb-3 truncate">{item.ketua}</p>
              <p className="text-3xl font-bold mb-2">{item.count}</p>
              <div className="text-sm italic">Jumlah penduduk</div>
            </div>
            <hr className="border-t border-white/40 mb-3" />
          </div>
        );
      })}
    </div>
  );
}

export default StatsGrid;
