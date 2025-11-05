// src/pages/DataPenduduk.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Eye, FileText } from "lucide-react";
import supabase from "../../../supabaseClient"; // sesuaikan path jika perlu

const normalizeRt = (rt) => {
  if (rt === null || rt === undefined) return null;
  const n = Number(String(rt).trim());
  if (!isNaN(n)) return String(n).padStart(2, "0");
  return String(rt).trim();
};

function DataPenduduk() {
  const [rekap, setRekap] = useState([]); // { rt, namaKetua, jumlah }
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

        // 1) ambil jumlah penduduk per RT via RPC (menghindari limit 1000)
        const { data: pendudukCounts = [], error: pendudukErr } = await supabase
          .rpc("get_penduduk_per_rt", { rw_input: userRw });

        if (pendudukErr) {
          console.error("Gagal ambil jumlah penduduk via RPC:", pendudukErr);
        }

        // 2) ambil semua users di RW ini yang rolenya RT (ambil nama ketua)
        const { data: ketuaRows = [], error: ketuaErr } = await supabase
          .from("users")
          .select("nama, rt, role, rw")
          .eq("rw", userRw);

        if (ketuaErr) {
          console.error("Gagal ambil users:", ketuaErr);
        }

        // map ketua per RT (normalisasi)
        const ketuaMap = {};
        (ketuaRows || []).forEach((u) => {
          if (u.role && u.role.toUpperCase().startsWith("RT")) {
            const rtKey = normalizeRt(u.rt);
            if (rtKey && !ketuaMap[rtKey]) ketuaMap[rtKey] = u.nama || "-";
          }
        });

        // 3) gabungkan hasil RPC (pendudukCounts) dengan ketuaMap
        // pendudukCounts may contain { rt, count }
        const statsMap = new Map();
        (pendudukCounts || []).forEach((r) => {
          const rtKey = normalizeRt(r.rt);
          statsMap.set(rtKey, {
            rt: rtKey,
            jumlah: Number(r.count) || 0,
            namaKetua: ketuaMap[rtKey] ?? "-",
          });
        });

        // Pastikan RT yang ada di ketuaMap tapi belum di statsMap juga muncul (jumlah 0)
        Object.keys(ketuaMap).forEach((rtKey) => {
          if (!statsMap.has(rtKey)) {
            statsMap.set(rtKey, {
              rt: rtKey,
              jumlah: 0,
              namaKetua: ketuaMap[rtKey],
            });
          }
        });

        // convert to array and sort by RT ascending
        const result = Array.from(statsMap.values()).sort((a, b) =>
          a.rt.localeCompare(b.rt)
        );

        if (mounted) {
          setRekap(result);
          setLoading(false);
        }
      } catch (err) {
        console.error("Gagal fetch DataPenduduk:", err);
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
          <h1 className="text-lg font-semibold">Data Penduduk</h1>
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
          <h1 className="text-lg font-semibold">Data Penduduk RW {userRw}</h1>
          <div className="text-sm opacity-90">
            Rekap per RT — menampilkan RT, nama ketua RT, dan jumlah penduduk
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
              <th className="px-4 py-2 border text-center">Jumlah Penduduk</th>
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
                      to={`/rw/rwkeloladata/detailperrt/${row.rt}`}
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

export default DataPenduduk;
