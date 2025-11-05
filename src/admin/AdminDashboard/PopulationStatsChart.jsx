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
import supabase from "../../supabaseClient";

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];

/** Fetch all rows (bypass default row limits) */
async function fetchAllRows(table, columns = "*", chunkSize = 1000) {
  let from = 0;
  let all = [];
  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .range(from, from + chunkSize - 1);

    if (error) {
      // bubble up error
      throw error;
    }
    if (!data || data.length === 0) break;

    all = all.concat(data);
    if (data.length < chunkSize) break;
    from += chunkSize;
  }
  return all;
}

/** Try to find a date-like value in a row */
function findDateValue(row = {}) {
  if (!row || typeof row !== "object") return null;
  const dateCandidates = [
    "created_at",
    "createdat",
    "tanggal",
    "tgl",
    "date",
    "tanggal_lahir",
    "tanggal_kelahiran",
    "tgl_lahir",
    "tgl_kelahiran",
    "tanggal_meninggal",
    "tanggal_pindah",
    "tanggal_datang",
    "waktu",
    "tanggal_kk",
    "tgl_kk",
  ];
  for (const c of dateCandidates) {
    if (Object.prototype.hasOwnProperty.call(row, c) && row[c]) return row[c];
  }
  // fallback: try to find any ISO-like date string in any string field
  const keys = Object.keys(row);
  for (const k of keys) {
    const v = row[k];
    if (typeof v === "string" && /\d{4}-\d{2}-\d{2}/.test(v)) return v;
  }
  // no date found
  return null;
}
function toDate(val) {
  if (!val) return null;
  if (val instanceof Date) return val;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

function buildEmptyBuckets() {
  return MONTH_NAMES.map((m) => ({
    month: m,
    Penduduk: 0,
    KK: 0,
    Laki: 0,
    Perempuan: 0,
    Lahir: 0,
    Meninggal: 0,
    Pindah: 0,
    Pendatang: 0,
  }));
}

/** robust extractor for KK identifier from various table shapes */
function getKkFromRow(row = {}) {
  if (!row || typeof row !== "object") return null;
  const candidates = ["no_kk","nomor_kk","nomorkk","nomor","kk","no_kk_str"];
  for (const c of candidates) {
    if (Object.prototype.hasOwnProperty.call(row, c) && row[c]) {
      return String(row[c]);
    }
  }
  // maybe it's nested or labeled differently; try keys that contain 'kk'
  for (const k of Object.keys(row)) {
    if (k.toLowerCase().includes("kk") && row[k]) return String(row[k]);
  }
  return null;
}

export default function PopulationStatsChart() {
  const [data, setData] = useState(buildEmptyBuckets());
  const [loading, setLoading] = useState(true);

  const fetchAggregates = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch ALL rows from relevant tables (schema-tolerant)
      const [
        pendudukRes,
        lahirRes,
        meninggalRes,
        pindahRes,
        pendatangRes,
        kkTableRes, // optional table that stores KK records explicitly
      ] = await Promise.all([
        fetchAllRows("data_penduduk", "*").catch((e) => { console.warn("data_penduduk fetch error:", e); return []; }),
        fetchAllRows("data_kelahiran", "*").catch((e) => { console.warn("data_kelahiran fetch error:", e); return []; }),
        fetchAllRows("data_kematian", "*").catch((e) => { console.warn("data_kematian fetch error:", e); return []; }),
        fetchAllRows("data_pindah", "*").catch((e) => { console.warn("data_pindah fetch error:", e); return []; }),
        fetchAllRows("data_pendatang", "*").catch((e) => { console.warn("data_pendatang fetch error:", e); return []; }),
      ]);

      // Build empty monthly buckets
      const buckets = buildEmptyBuckets();

      // --- Compute global totals (same approach as SpinChart) ---
      const totalPenduduk = Array.isArray(pendudukRes) ? pendudukRes.length : 0;

      // Global unique KK: gather from penduduk rows AND from data_kartu_keluarga table (if present)
      const globalKKSet = new Set();
      if (Array.isArray(pendudukRes)) {
        pendudukRes.forEach((r) => {
          const kk = getKkFromRow(r);
          if (kk) globalKKSet.add(kk);
        });
      }
      if (Array.isArray(kkTableRes)) {
        kkTableRes.forEach((r) => {
          const kk = getKkFromRow(r);
          if (kk) globalKKSet.add(kk);
        });
      }
      const totalKK = globalKKSet.size;

      // Global gender totals
      let totalPerempuan = 0, totalLaki = 0;
      if (Array.isArray(pendudukRes)) {
        pendudukRes.forEach((r) => {
          const jk = (r.jk ?? r.gender ?? r.sex ?? "").toString().toLowerCase();
          if (jk.includes("perem") || jk === "female" || jk === "f") totalPerempuan++;
          else if (jk.includes("laki") || jk === "male" || jk === "m") totalLaki++;
        });
      }

      // Global event totals (count all rows, like SpinChart)
      const totalLahir = Array.isArray(lahirRes) ? lahirRes.length : 0;
      const totalMeninggal = Array.isArray(meninggalRes) ? meninggalRes.length : 0;
      const totalPindah = Array.isArray(pindahRes) ? pindahRes.length : 0;
      const totalPendatang = Array.isArray(pendatangRes) ? pendatangRes.length : 0;

      // --- Fill month buckets using dated rows; collect undated rows to distribute ---
      // For penduduk: we'll keep kk sets per month and also track undated rows for later distribution
      const kkSetPerMonth = Array.from({ length: 12 }, () => new Set());
      const undatedPenduduk = []; // store rows without any date

      if (Array.isArray(pendudukRes)) {
        pendudukRes.forEach((row) => {
          const dateVal = findDateValue(row);
          const d = toDate(dateVal);
          if (!d) {
            undatedPenduduk.push(row);
            return;
          }
          const idx = d.getMonth();
          buckets[idx].Penduduk += 1;

          // KK: now include ANY no_kk found (no status check)
          const kk = getKkFromRow(row);
          if (kk) kkSetPerMonth[idx].add(kk);

          // genders
          const jk = (row.jk ?? row.gender ?? row.sex ?? "").toString().toLowerCase();
          if (jk.includes("laki") || jk === "male" || jk === "m") buckets[idx].Laki += 1;
          else if (jk.includes("perem") || jk === "female" || jk === "f") buckets[idx].Perempuan += 1;
        });

        // assign KK counts from dated rows
        kkSetPerMonth.forEach((s, i) => {
          buckets[i].KK = s.size;
        });
      }

      // If there's an explicit KK table, try to place those KK into months if they have dates
      const undatedKKFromKKTable = [];
      if (Array.isArray(kkTableRes)) {
        kkTableRes.forEach((row) => {
          const kk = getKkFromRow(row);
          if (!kk) return;
          const dateVal = findDateValue(row);
          const d = toDate(dateVal);
          if (!d) {
            undatedKKFromKKTable.push(kk);
            return;
          }
          const idx = d.getMonth();
          kkSetPerMonth[idx].add(kk);
        });
        // reassign after adding kk table dated ones
        kkSetPerMonth.forEach((s, i) => {
          buckets[i].KK = s.size;
        });
      }

      // For events: collect undated rows similarly
      const undatedLahir = [];
      const undatedMeninggal = [];
      const undatedPindah = [];
      const undatedPendatang = [];

      const aggregateDated = (rows, targetKey, undatedCollector) => {
        if (!Array.isArray(rows)) return;
        rows.forEach((row) => {
          const dateVal = findDateValue(row);
          const d = toDate(dateVal);
          if (!d) {
            undatedCollector.push(row);
            return;
          }
          const idx = d.getMonth();
          buckets[idx][targetKey] = (buckets[idx][targetKey] || 0) + 1;
        });
      };

      aggregateDated(lahirRes, "Lahir", undatedLahir);
      aggregateDated(meninggalRes, "Meninggal", undatedMeninggal);
      aggregateDated(pindahRes, "Pindah", undatedPindah);
      aggregateDated(pendatangRes, "Pendatang", undatedPendatang);

      // --- Now distribute undated rows evenly across months so that monthly sums add up to global totals ---
      const distributeEvenly = (items, targetKey) => {
        if (!Array.isArray(items) || items.length === 0) return;
        let i = 0;
        items.forEach(() => {
          buckets[i % 12][targetKey] = (buckets[i % 12][targetKey] || 0) + 1;
          i += 1;
        });
      };

      // Distribute undated penduduk rows (count and genders and KK)
      if (undatedPenduduk.length > 0 || undatedKKFromKKTable.length > 0) {
        // distribute counts from undatedPenduduk
        distributeEvenly(undatedPenduduk, "Penduduk");

        // distribute genders from undated rows
        const undatedMale = [];
        const undatedFemale = [];
        undatedPenduduk.forEach((row) => {
          const jk = (row.jk ?? row.gender ?? row.sex ?? "").toString().toLowerCase();
          if (jk.includes("laki") || jk === "male" || jk === "m") undatedMale.push(row);
          else if (jk.includes("perem") || jk === "female" || jk === "f") undatedFemale.push(row);
        });
        distributeEvenly(undatedMale, "Laki");
        distributeEvenly(undatedFemale, "Perempuan");

        // collect unique undated KK from undatedPenduduk and undatedKKFromKKTable
        const undatedKKsSet = new Set();
        undatedPenduduk.forEach((r) => {
          const kk = getKkFromRow(r);
          if (kk) undatedKKsSet.add(kk);
        });
        if (Array.isArray(undatedKKFromKKTable)) {
          undatedKKFromKKTable.forEach((kk) => {
            if (kk) undatedKKsSet.add(kk);
          });
        }
        const undatedKKArray = Array.from(undatedKKsSet);

        // distribute unique undated KK evenly across months (add to kkSetPerMonth)
        undatedKKArray.forEach((kk, idx) => {
          kkSetPerMonth[idx % 12].add(kk);
        });

        // reassign KK counts
        kkSetPerMonth.forEach((s, i) => {
          buckets[i].KK = s.size;
        });

        // If there are still global KK not assigned (edge cases), ensure total KK still equal to global total
        const assignedKKTotal = kkSetPerMonth.reduce((acc, s) => acc + s.size, 0);
        if (assignedKKTotal < totalKK) {
          const diff = totalKK - assignedKKTotal;
          buckets[11].KK = (buckets[11].KK || 0) + diff;
        }
      }

      // Distribute undated events evenly
      distributeEvenly(undatedLahir, "Lahir");
      distributeEvenly(undatedMeninggal, "Meninggal");
      distributeEvenly(undatedPindah, "Pindah");
      distributeEvenly(undatedPendatang, "Pendatang");

      // --- Final safety step: ensure that the sum of monthly buckets equals the global totals (adjust small diffs) ---
      const sumBuckets = (key) => buckets.reduce((s, b) => s + (b[key] || 0), 0);

      // For Penduduk
      const sumPenduduk = sumBuckets("Penduduk");
      if (sumPenduduk !== totalPenduduk) {
        const diff = totalPenduduk - sumPenduduk;
        buckets[11].Penduduk += diff; // tuck the difference into last month
      }

      // For genders
      const sumLaki = sumBuckets("Laki");
      if (sumLaki !== totalLaki) {
        buckets[11].Laki += (totalLaki - sumLaki);
      }
      const sumPerempuan = sumBuckets("Perempuan");
      if (sumPerempuan !== totalPerempuan) {
        buckets[11].Perempuan += (totalPerempuan - sumPerempuan);
      }

      // For events
      if (sumBuckets("Lahir") !== totalLahir) buckets[11].Lahir += (totalLahir - sumBuckets("Lahir"));
      if (sumBuckets("Meninggal") !== totalMeninggal) buckets[11].Meninggal += (totalMeninggal - sumBuckets("Meninggal"));
      if (sumBuckets("Pindah") !== totalPindah) buckets[11].Pindah += (totalPindah - sumBuckets("Pindah"));
      if (sumBuckets("Pendatang") !== totalPendatang) buckets[11].Pendatang += (totalPendatang - sumBuckets("Pendatang"));

      // Ensure KK monthly sum equals totalKK (if slight discrepancy, adjust last month)
      const sumKK = sumBuckets("KK");
      if (sumKK !== totalKK) {
        buckets[11].KK += (totalKK - sumKK);
      }

      setData(buckets);
      console.log("PopulationStatsChart buckets:", buckets, {
        totalPenduduk, totalKK, totalLahir, totalMeninggal, totalPindah, totalPendatang, totalLaki, totalPerempuan,
      });
    } catch (err) {
      console.error("Gagal fetch data (PopulationStatsChart):", err);
      setData(buildEmptyBuckets());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAggregates();

    // realtime subscription — mirror tables used in SpinChart
    const channel = supabase.channel("realtime:population-stats");
    const tables = ["data_penduduk","data_kelahiran","data_kematian","data_pindah","data_pendatang",];
    tables.forEach((table) => {
      channel.on("postgres_changes", { event: "*", schema: "public", table }, (payload) => {
        console.log("Realtime change on", table, payload);
        fetchAggregates();
      });
    });

    try {
      channel.subscribe();
      console.log("Subscribed to realtime:population-stats");
    } catch (e) {
      console.warn("subscribe() error:", e);
    }

    return () => {
      try {
        supabase.removeChannel(channel);
        console.log("Realtime channel removed");
      } catch (e) {
        console.warn("removeChannel error:", e);
      }
    };
  }, [fetchAggregates]);

  return (
    <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-slate-800">Statistik Kependudukan</h3>
          <p className="text-sm text-slate-500">Periode: Jan - Des (Realtime) </p>
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
