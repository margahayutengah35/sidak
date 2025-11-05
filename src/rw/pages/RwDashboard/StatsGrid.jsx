import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import supabase from "../../../supabaseClient";

const colorClasses = {
  blue: "bg-blue-500 text-white",
  green: "bg-green-500 text-white",
  yellow: "bg-yellow-400 text-slate-800",
  red: "bg-red-500 text-white",
  purple: "bg-purple-500 text-white",
};

// helper: normalize RT ke 2 digit
const normalizeRt = (rt) => {
  if (!rt) return "-";
  const n = Number(String(rt).trim());
  if (!isNaN(n)) return String(n).padStart(2, "0");
  return String(rt).trim();
};

function StatsGrid() {
  const navigate = useNavigate();
  const [rtStats, setRtStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchRtStats = async () => {
      setLoading(true);
      try {
        const userRw = localStorage.getItem("userRw")?.trim();
        if (!userRw) return;

        // 1. ambil jumlah penduduk per RT via RPC
        const { data: pendudukCounts, error: pendudukErr } = await supabase
          .rpc("get_penduduk_per_rt", { rw_input: userRw });

        if (pendudukErr) {
          console.error("Gagal ambil jumlah penduduk:", pendudukErr);
          if (mounted) setLoading(false);
          return;
        }

        // bikin map count
        const countsByRt = {};
        pendudukCounts.forEach((row) => {
          countsByRt[normalizeRt(row.rt)] = row.count;
        });

        // 2. ambil ketua RT dari users
        const { data: ketuaRows = [], error: ketuaErr } = await supabase
          .from("users")
          .select("nama, rt, role")
          .eq("rw", userRw);

        if (ketuaErr) {
          console.error("Gagal ambil ketua:", ketuaErr);
        }

        const ketuaMap = {};
        ketuaRows.forEach((u) => {
          if (u.role?.toUpperCase().startsWith("RT")) {
            ketuaMap[normalizeRt(u.rt)] = u.nama || "-";
          }
        });

        // 3. gabungkan hasilnya
        const stats = pendudukCounts.map((row) => ({
          rt: normalizeRt(row.rt),
          ketua: ketuaMap[normalizeRt(row.rt)] ?? "-",
          count: row.count,
        }));

        if (mounted) {
          setRtStats(stats);
          setLoading(false);
        }
      } catch (err) {
        console.error("Gagal fetch RT stats:", err);
        if (mounted) setLoading(false);
      }
    };

    fetchRtStats();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSelengkapnya = (rt) => {
  navigate(`/rw/rwkeloladata/detailperrt/${encodeURIComponent(rt)}`);
};


  if (loading) return <div>Loading statistik...</div>;
  if (!rtStats.length)
    return <div className="text-sm text-slate-500">Tidak ada data RT.</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {rtStats.map((item, index) => {
        const colors = ["blue", "green", "yellow", "red", "purple",];
        const color = colors[index % colors.length];
        return (
          <div
            key={item.rt}
            className={`${colorClasses[color]} rounded-2xl p-6 hover:shadow-xl transition-all duration-300 flex flex-col justify-between`}
          >
            <div className="flex flex-col mb-4">
              <p className="text-sm font-medium mb-1">RT {item.rt}</p>
              <p className="text-base font-semibold mb-3 truncate">
                {item.ketua}
              </p>
              <p className="text-3xl font-bold mb-2">{item.count}</p>
              <div className="text-sm italic">Jumlah penduduk</div>
            </div>
            <hr className="border-t border-white/40 mb-3" />
            <button
              onClick={() => handleSelengkapnya(item.rt)}
              className="flex items-center justify-center space-x-2 text-sm font-semibold mx-auto mt-auto cursor-pointer"
            >
              <span>Selengkapnya</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default StatsGrid;
