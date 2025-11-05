// src/components/SpinChart.jsx
import React, { useEffect, useState, useCallback } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import supabase from "../../supabaseClient"; // sesuaikan path

const COLORS = [
  "#0088FE", "#00C49F", "#FFBB28", "#FF8042",
  "#A569BD", "#E74C3C", "#1ABC9C", "#F39C12"
];

// Helper untuk ambil semua row (bypass limit 1000 Supabase)
async function fetchAllRows(table, columns = "*", chunkSize = 1000) {
  let from = 0;
  let allData = [];
  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .range(from, from + chunkSize - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;

    allData = allData.concat(data);
    if (data.length < chunkSize) break;
    from += chunkSize;
  }
  return allData;
}

function SpinChart() {
  const [counts, setCounts] = useState({
    Penduduk: 0,
    KK: 0,
    Perempuan: 0,
    Laki: 0,
    Lahir: 0,
    Meninggal: 0,
    Pindah: 0,
    Pendatang: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchCounts = useCallback(async () => {
    setLoading(true);
    try {
      // 1) penduduk (ambil semua row)
      const pendudukRows = await fetchAllRows("data_penduduk", "nik, no_kk, jk");
      const totalPenduduk = pendudukRows.length;

      // hitung KK unik
      const kkSet = new Set(pendudukRows.map((r) => r.no_kk).filter(Boolean));
      const totalKK = kkSet.size;

      // hitung gender
      let perempuan = 0;
      let laki = 0;
      pendudukRows.forEach((r) => {
        const jk = String(r.jk || "").toLowerCase();
        if (jk.includes("perem")) perempuan++;
        else if (jk.includes("laki")) laki++;
      });

      // 2) tabel lain (cukup count saja, lebih efisien)
      const [kelahiranRes, kematianRes, pindahRes, pendatangRes] = await Promise.all([
        supabase.from("data_kelahiran").select("id_kelahiran", { count: "exact", head: true }),
        supabase.from("data_kematian").select("id", { count: "exact", head: true }),
        supabase.from("data_pindah").select("id", { count: "exact", head: true }),
        supabase.from("data_pendatang").select("id", { count: "exact", head: true }),
      ]);

      if (kelahiranRes.error) throw kelahiranRes.error;
      if (kematianRes.error) throw kematianRes.error;
      if (pindahRes.error) throw pindahRes.error;
      if (pendatangRes.error) throw pendatangRes.error;

      setCounts({
        Penduduk: totalPenduduk,
        KK: totalKK,
        Perempuan: perempuan,
        Laki: laki,
        Lahir: kelahiranRes.count || 0,
        Meninggal: kematianRes.count || 0,
        Pindah: pindahRes.count || 0,
        Pendatang: pendatangRes.count || 0,
      });
    } catch (err) {
      console.error("Gagal mengambil counts:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCounts();

    // realtime subscription
    const channel = supabase.channel("realtime:spinchart");
    const tables = ["data_penduduk","data_kelahiran","data_kematian","data_pindah","data_pendatang"];

    tables.forEach((table) => {
      channel.on("postgres_changes", { event: "*", schema: "public", table }, () => {
        fetchCounts();
      });
    });

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchCounts]);

  const pieData = [
    { name: "Penduduk", value: counts.Penduduk },
    { name: "Kartu Keluarga", value: counts.KK },
    { name: "Perempuan", value: counts.Perempuan },
    { name: "Laki-laki", value: counts.Laki },
    { name: "Lahir", value: counts.Lahir },
    { name: "Meninggal", value: counts.Meninggal },
    { name: "Pindah", value: counts.Pindah },
    { name: "Pendatang", value: counts.Pendatang },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-6 flex flex-col h-[480px]">
      <div className="mb-4">
        <h3 className="text-xl font-bold text-slate-800">Spin Chart Kependudukan</h3>
        <p className="text-sm text-slate-500">Distribusi data (Realtime)</p>
      </div>

      <div className="flex-1">
        {loading ? (
          <div className="flex items-center justify-center h-full text-sm text-gray-500">
            Memuat data...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={110}
                innerRadius={60}
                dataKey="value"
                label
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-slate-700">
        {pieData.map((entry, index) => (
          <div key={index} className="flex items-center space-x-2">
            <span
              className="inline-block w-4 h-4 rounded"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            <span className="text-sm">
              {entry.name}: <strong>{entry.value}</strong>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SpinChart;
