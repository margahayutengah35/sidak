// src/components/PopulationStatsChart.jsx
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

function ensureDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "number") return new Date(value);
  const parsed = new Date(value);
  return isNaN(parsed) ? null : parsed;
}

function PopulationStatsChart() {
  const [data, setData] = useState(() =>
    MONTH_NAMES.map((m) => ({
      month: m,
      Penduduk: 0,
      KK: 0,
      Perempuan: 0,
      Laki: 0,
      Lahir: 0,
      Meninggal: 0,
      Pindah: 0,
      Pendatang: 0,
    }))
  );
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

  const fetchAndAggregate = useCallback(async () => {
    setLoading(true);
    try {
      const rt = String(localStorage.getItem("userRt") || "").padStart(2, "0");
      const rw = String(localStorage.getItem("userRw") || "").padStart(2, "0");

      if (!rt || !rw) {
        setData(buildEmptyBuckets());
        setLoading(false);
        return;
      }

      // ambil data tiap tabel sesuai RT/RW
      const [pendudukRes, kelahiranRes, kematianRes, pindahRes, pendatangRes] =
        await Promise.all([
          supabase
            .from("data_penduduk")
            .select("id_penduduk, no_kk, jk, created_at")
            .eq("rt", rt)
            .eq("rw", rw)
            .order("created_at", { ascending: true, nullsFirst: true }),

          supabase
            .from("data_kelahiran")
            .select("id_kelahiran, tanggal_lahir")
            .eq("rt", rt)
            .eq("rw", rw),

          supabase
            .from("data_kematian")
            .select("id, tanggal_kematian")
            .eq("rt", rt)
            .eq("rw", rw),

          supabase
            .from("data_pindah")
            .select("id, tanggal_pindah")
            .eq("rt", rt)
            .eq("rw", rw),

          supabase
            .from("data_pendatang")
            .select("id, tanggal_datang")
            .eq("rt", rt)
            .eq("rw", rw),
        ]);

      if (pendudukRes.error) throw pendudukRes.error;
      if (kelahiranRes.error) throw kelahiranRes.error;
      if (kematianRes.error) throw kematianRes.error;
      if (pindahRes.error) throw pindahRes.error;
      if (pendatangRes.error) throw pendatangRes.error;

      const buckets = buildEmptyBuckets();

      // penduduk & gender
      (pendudukRes.data || []).forEach((row) => {
        const dt = ensureDate(row.created_at);
        const mi = dt ? dt.getMonth() : null;
        if (mi !== null && mi >= 0 && mi <= 11) {
          buckets[mi].Penduduk += 1;
          if (row.jk) {
            const jk = String(row.jk).toLowerCase();
            if (jk.startsWith("p")) buckets[mi].Perempuan += 1;
            else if (jk.startsWith("l")) buckets[mi].Laki += 1;
          }
        }
      });

      // KK unik
      const kkEarliest = new Map();
      (pendudukRes.data || []).forEach((row) => {
        const no_kk = row.no_kk || "";
        const dt = ensureDate(row.created_at);
        if (!no_kk) return;
        if (!kkEarliest.has(no_kk)) kkEarliest.set(no_kk, dt);
        else {
          const prev = kkEarliest.get(no_kk);
          if ((!prev && dt) || (dt && prev && dt < prev)) kkEarliest.set(no_kk, dt);
        }
      });
      kkEarliest.forEach((dt) => {
        const mi = dt ? dt.getMonth() : null;
        if (mi !== null && mi >= 0 && mi <= 11) buckets[mi].KK += 1;
      });

      // lahir
      (kelahiranRes.data || []).forEach((row) => {
        const dt = ensureDate(row.tanggal_lahir);
        const mi = dt ? dt.getMonth() : null;
        if (mi !== null && mi >= 0 && mi <= 11) buckets[mi].Lahir += 1;
      });

      // meninggal
      (kematianRes.data || []).forEach((row) => {
        const dt = ensureDate(row.tanggal_kematian);
        const mi = dt ? dt.getMonth() : null;
        if (mi !== null && mi >= 0 && mi <= 11) buckets[mi].Meninggal += 1;
      });

      // pindah
      (pindahRes.data || []).forEach((row) => {
        const dt = ensureDate(row.tanggal_pindah);
        const mi = dt ? dt.getMonth() : null;
        if (mi !== null && mi >= 0 && mi <= 11) buckets[mi].Pindah += 1;
      });

      // pendatang
      (pendatangRes.data || []).forEach((row) => {
        const dt = ensureDate(row.tanggal_datang);
        const mi = dt ? dt.getMonth() : null;
        if (mi !== null && mi >= 0 && mi <= 11) buckets[mi].Pendatang += 1;
      });

      setData(buckets);
    } catch (err) {
      console.error("Gagal fetch/aggregate data:", err);
      setData(buildEmptyBuckets());
    } finally {
      setLoading(false);
    }
  }, [buildEmptyBuckets]);

  useEffect(() => {
    fetchAndAggregate();

    // Realtime subscription
    const channel = supabase.channel("realtime:population-stats");
    const tables = ["data_penduduk","data_kelahiran","data_kematian","data_pindah","data_pendatang"];
    tables.forEach(table => {
      channel.on("postgres_changes", { event: "*", schema: "public", table }, () => {
        fetchAndAggregate();
      });
    });
    channel.subscribe();

    return () => supabase.removeChannel(channel);
  }, [fetchAndAggregate]);

  return (
    <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-slate-800">Statistik Kependudukan</h3>
          <p className="text-sm text-slate-500">Periode: Jan - Des (Realtime, sesuai RT/RW login)</p>
        </div>
      </div>

      <div className="h-96">
        {loading ? (
          <div className="flex items-center justify-center h-full text-sm text-gray-500">Memuat data...</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "0.5rem" }} />
              <Legend wrapperStyle={{ paddingTop: "10px" }} />
              <Line type="monotone" dataKey="Penduduk" stroke="#3b82f6" strokeWidth={2} />
              <Line type="monotone" dataKey="KK" stroke="#06b6d4" strokeWidth={2} />
              <Line type="monotone" dataKey="Laki" stroke="#f59e0b" strokeWidth={2} />
              <Line type="monotone" dataKey="Perempuan" stroke="#ec4899" strokeWidth={2} />
              <Line type="monotone" dataKey="Lahir" stroke="#10b981" strokeWidth={2} />
              <Line type="monotone" dataKey="Meninggal" stroke="#ef4444" strokeWidth={2} />
              <Line type="monotone" dataKey="Pindah" stroke="#8b5cf6" strokeWidth={2} />
              <Line type="monotone" dataKey="Pendatang" stroke="#14b8a6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

export default PopulationStatsChart;
