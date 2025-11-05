import React, { useEffect, useState, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import supabase from "../../../supabaseClient";

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
const COLORS = {
  Penduduk: "#3b82f6",
  KK: "#06b6d4",
  Laki: "#f59e0b",
  Perempuan: "#ec4899",
  Lahir: "#10b981",
  Meninggal: "#ef4444",
  Pindah: "#8b5cf6",
  Pendatang: "#14b8a6",
};

// Helper ambil semua row (bypass limit 1000)
async function fetchAllRows(table, columns = "*", rw = null, chunkSize = 1000) {
  let from = 0;
  let allData = [];
  while (true) {
    let query = supabase.from(table).select(columns).range(from, from + chunkSize - 1);
    if (rw) query = query.eq("rw", rw);
    const { data, error } = await query;
    if (error) throw error;
    if (!data || data.length === 0) break;
    allData = allData.concat(data);
    if (data.length < chunkSize) break;
    from += chunkSize;
  }
  return allData;
}

function PopulationStatsChart() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const buildEmptyBuckets = useCallback(() => {
    return MONTH_NAMES.map((m) => ({
      month: m,
      Penduduk: 0,
      KK: 0,
      Perempuan: 0,
      Laki: 0,
      Lahir: 0,
      Meninggal: 0,
      Pindah: 0,
      Pendatang: 0,
    }));
  }, []);

  const fetchAggregates = useCallback(async () => {
    setLoading(true);
    try {
      const userRw = localStorage.getItem("userRw")?.trim();
      if (!userRw) {
        setLoading(false);
        return;
      }

      // 1) Ambil semua penduduk per RW
      const pendudukRows = await fetchAllRows("data_penduduk", "nik,no_kk,jk,tanggal_lahir", userRw);
      const totalPenduduk = pendudukRows.length;

      const kkSet = new Set(pendudukRows.map(r => r.no_kk).filter(Boolean));
      const totalKK = kkSet.size;

      let laki = 0, perempuan = 0;
      pendudukRows.forEach(r => {
        const jk = String(r.jk || "").toLowerCase();
        if (jk.includes("laki")) laki++;
        else if (jk.includes("perem")) perempuan++;
      });

      // 2) Ambil tabel lain
      const makeCountQuery = (tableName, column = "id") =>
        supabase.from(tableName).select(column, { count: "exact", head: true }).eq("rw", userRw);

      const [lahirRes, meninggalRes, pindahRes, pendatangRes] = await Promise.all([
        makeCountQuery("data_kelahiran", "id_kelahiran"),
        makeCountQuery("data_kematian", "id"),
        makeCountQuery("data_pindah", "id"),
        makeCountQuery("data_pendatang", "id"),
      ]);

      if (lahirRes.error) throw lahirRes.error;
      if (meninggalRes.error) throw meninggalRes.error;
      if (pindahRes.error) throw pindahRes.error;
      if (pendatangRes.error) throw pendatangRes.error;

      // 3) Buat bucket bulanan (sama semua bulan)
      const buckets = buildEmptyBuckets();
      const currentMonth = new Date().getMonth(); // bisa disesuaikan

      buckets[currentMonth] = {
        month: MONTH_NAMES[currentMonth],
        Penduduk: totalPenduduk,
        KK: totalKK,
        Perempuan: perempuan,
        Laki: laki,
        Lahir: lahirRes.count || 0,
        Meninggal: meninggalRes.count || 0,
        Pindah: pindahRes.count || 0,
        Pendatang: pendatangRes.count || 0,
      };

      setData(buckets);
    } catch (err) {
      console.error("Gagal fetch aggregate:", err);
    } finally {
      setLoading(false);
    }
  }, [buildEmptyBuckets]);

  useEffect(() => {
    fetchAggregates();

    const channel = supabase.channel("realtime:population-stats");
    ["data_penduduk","data_kelahiran","data_kematian","data_pindah","data_pendatang"].forEach(table => {
      channel.on("postgres_changes", { event: "*", schema: "public", table }, () => {
        fetchAggregates();
      });
    });
    channel.subscribe();

    return () => supabase.removeChannel(channel);
  }, [fetchAggregates]);

  return (
    <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-slate-800">Statistik Kependudukan</h3>
          <p className="text-sm text-slate-500">Per RW: {localStorage.getItem("userRw") || "-"}</p>
        </div>
      </div>

      <div className="h-96">
        {loading ? (
          <div className="flex items-center justify-center h-full text-sm text-gray-500">
            Memuat data...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "0.5rem" }} />
              <Legend wrapperStyle={{ paddingTop: "10px" }} />
              {Object.keys(COLORS).map((key) => (
                <Line key={key} type="monotone" dataKey={key} stroke={COLORS[key]} strokeWidth={2} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

export default PopulationStatsChart;
