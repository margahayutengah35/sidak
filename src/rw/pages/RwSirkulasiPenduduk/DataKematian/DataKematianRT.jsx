// src/rt/pages/KelolaData/DataKematianRT.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Eye, FileText } from "lucide-react";
import supabase from "../../../../supabaseClient";

// Normalisasi RT -> "01", "02", dst
const normalizeRt = (rt) => {
  if (rt === null || rt === undefined) return null;
  const n = Number(String(rt).trim());
  if (!isNaN(n)) return String(n).padStart(2, "0");
  return String(rt).trim();
};

function DataKematianRT() {
  const [rekap, setRekap] = useState([]);
  const [loading, setLoading] = useState(true);

  const userRw = localStorage.getItem("userRw")?.trim();
  const userRole = (localStorage.getItem("userRole") || "").trim().toUpperCase();

  useEffect(() => {
    let mounted = true;

    const fetch = async () => {
      setLoading(true);
      try {
        if (!userRw || userRole !== "RW") {
          if (mounted) {
            setRekap([]);
            setLoading(false);
          }
          return;
        }

        // 1) Coba pakai RPC kalau ada
        let kematianCounts = [];
        try {
          const { data: rpcData = [], error: rpcErr } = await supabase.rpc(
            "get_kematian_per_rt",
            { rw_input: userRw }
          );

          if (rpcErr) {
            console.warn("RPC get_kematian_per_rt error, fallback query biasa:", rpcErr);
          } else if (rpcData && Array.isArray(rpcData) && rpcData.length > 0) {
            kematianCounts = rpcData; // ekspektasi { rt, count }
          }
        } catch (e) {
          console.warn("RPC get_kematian_per_rt gagal:", e);
        }

        // 2) Jika RPC kosong, fallback query biasa
        if (kematianCounts.length === 0) {
          const { data: rows = [], error } = await supabase
            .from("data_kematian")
            .select("rt")
            .eq("rw", userRw);

          if (error) {
            console.error("Gagal ambil kematian:", error);
          }

          // hitung jumlah kematian per RT
          const kematianMap = {};
          (rows || []).forEach((row) => {
            const rtKey = normalizeRt(row.rt) ?? "";
            if (!kematianMap[rtKey]) kematianMap[rtKey] = 0;
            kematianMap[rtKey]++;
          });

          kematianCounts = Object.keys(kematianMap).map((rtKey) => ({
            rt: rtKey,
            count: kematianMap[rtKey],
          }));
        }

        // 3) Ambil data users RT (nama ketua RT)
        const { data: ketuaRows = [], error: ketuaErr } = await supabase
          .from("users")
          .select("nama, rt, role, rw")
          .eq("rw", userRw);

        if (ketuaErr) {
          console.error("Gagal ambil users:", ketuaErr);
        }

        const ketuaMap = {};
        (ketuaRows || []).forEach((u) => {
          if (u.role && u.role.toUpperCase().startsWith("RT")) {
            const rtKey = normalizeRt(u.rt);
            if (rtKey && !ketuaMap[rtKey]) ketuaMap[rtKey] = u.nama || "-";
          }
        });

        // 4) Gabungkan hasil
        const statsMap = new Map();
        (kematianCounts || []).forEach((r) => {
          const rtKey = normalizeRt(r.rt);
          statsMap.set(rtKey, {
            rt: rtKey,
            jumlah: Number(r.count) || 0,
            namaKetua: ketuaMap[rtKey] ?? "-",
          });
        });

        // RT yang ada di ketuaMap tapi belum ada kematian → jumlah 0
        Object.keys(ketuaMap).forEach((rtKey) => {
          if (!statsMap.has(rtKey)) {
            statsMap.set(rtKey, {
              rt: rtKey,
              jumlah: 0,
              namaKetua: ketuaMap[rtKey],
            });
          }
        });

        const result = Array.from(statsMap.values()).sort((a, b) =>
          a.rt.localeCompare(b.rt)
        );

        if (mounted) {
          setRekap(result);
          setLoading(false);
        }
      } catch (err) {
        console.error("Gagal fetch DataKematian:", err);
        if (mounted) {
          setRekap([]);
          setLoading(false);
        }
      }
    };

    fetch();
    return () => {
      mounted = false;
    };
  }, [userRw, userRole]);

  if (userRole !== "RW") {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <div className="flex items-center bg-green-500 text-white px-4 py-3 rounded-t-lg">
          <FileText className="w-5 h-5 mr-2" />
          <h1 className="text-lg font-semibold">Data Kematian</h1>
        </div>
        <div className="p-6 text-sm text-slate-600">
          Halaman ini hanya untuk pengguna dengan role <strong>RW</strong>.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow relative">
      {/* Header */}
      <div className="flex items-center bg-green-500 text-white px-4 py-3 rounded-t-lg mb-4">
        <FileText className="w-5 h-5 mr-2" />
        <div>
          <h1 className="text-lg font-semibold">Data Kematian RW {userRw}</h1>
          <div className="text-sm opacity-90">
            Rekap per RT — menampilkan RT, nama ketua RT, dan jumlah kematian
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-200">
          <thead className="bg-green-700 text-white">
            <tr>
              <th className="px-2 py-2 border text-center">No</th>
              <th className="px-4 py-2 border text-center">RT</th>
              <th className="px-4 py-2 border text-center">Nama Ketua RT</th>
              <th className="px-4 py-2 border text-center">Jumlah Kematian</th>
              <th className="px-4 py-2 border text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="text-center py-8 text-gray-500">
                  Memuat data...
                </td>
              </tr>
            ) : rekap.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-8 text-gray-500">
                  Tidak ada data
                </td>
              </tr>
            ) : (
              rekap.map((row, idx) => (
                <tr key={row.rt} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border text-center">{idx + 1}</td>
                  <td className="px-4 py-2 border text-center">RT {row.rt}</td>
                  <td className="px-4 py-2 border text-center">{row.namaKetua}</td>
                  <td className="px-4 py-2 border text-center">{row.jumlah}</td>
                  <td className="px-4 py-2 border text-center">
                    <Link
                      to={`/rw/rwsirkulasipenduduk/detailkematianperrt/${row.rt}`}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-full inline-flex items-center"
                    >
                      <Eye className="w-4 h-4" />
                      <span className="sr-only">Lihat detail RT {row.rt}</span>
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DataKematianRT;
