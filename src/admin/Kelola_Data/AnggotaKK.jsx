import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../../supabaseClient";
import { Trash2 } from "lucide-react";

function AnggotaKK({ no_kk }) {
  const navigate = useNavigate();
  const [kkInfo, setKkInfo] = useState(null);   // Kepala keluarga (null jika tidak ada)
  const [kkMeta, setKkMeta] = useState(null);   // Data untuk No KK & alamat
  const [anggota, setAnggota] = useState([]);   // Anggota yang ditampilkan
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (no_kk) {
      fetchKKDetail(no_kk);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [no_kk]);

  const fetchKKDetail = async (kkNumber) => {
    setLoading(true);
    setErrorMsg("");
    try {
      const { data: pendudukKK, error } = await supabase
        .from("data_penduduk")
        .select(
          "id_penduduk, nik, nama, jk, status_keluarga, no_kk, alamat, desa, rt, rw, kecamatan, kabupaten, provinsi, kode_pos"
        )
        .eq("no_kk", kkNumber)
        .order("id_penduduk", { ascending: true });

      if (error) throw error;
      if (!pendudukKK || pendudukKK.length === 0)
        throw new Error("KK tidak ditemukan");

      const kepala = pendudukKK.find(
        (p) => String(p.status_keluarga || "").trim() === "Kepala Keluarga"
      );

      const meta = pendudukKK[0] || null;
      setKkMeta(meta);

      if (kepala) {
        setKkInfo(kepala);
        const anggotaList = pendudukKK
          .filter((p) => p.id_penduduk !== kepala.id_penduduk)
          .map((p) => ({
            id_penduduk: p.id_penduduk,
            hubungan: p.status_keluarga,
            data_penduduk: p,
          }));
        setAnggota(anggotaList);
      } else {
        setKkInfo(null);
        const anggotaList = pendudukKK.map((p) => ({
          id_penduduk: p.id_penduduk,
          hubungan: p.status_keluarga,
          data_penduduk: p,
        }));
        setAnggota(anggotaList);
      }
    } catch (error) {
      console.error("Error fetching KK detail:", error.message || error);
      setErrorMsg(`Gagal memuat data KK: ${error.message || error}`);
      setKkInfo(null);
      setKkMeta(null);
      setAnggota([]);
    } finally {
      setLoading(false);
    }
  };

  const handleHapus = async (id) => {
    const konfirmasi = window.confirm(
      "Apakah kamu yakin ingin menghapus anggota ini? Data penduduk juga akan ikut terhapus!"
    );
    if (!konfirmasi) return;

    try {
      const { error: anggotaError } = await supabase
        .from("anggota_kk")
        .delete()
        .eq("id_penduduk", id)
        .eq("no_kk", kkMeta?.no_kk || no_kk);

      if (anggotaError) throw anggotaError;

      const { error: pendudukError } = await supabase
        .from("data_penduduk")
        .delete()
        .eq("id_penduduk", id);

      if (pendudukError) throw pendudukError;

      setAnggota((prev) => prev.filter((a) => a.id_penduduk !== id));
      alert("Anggota dan data penduduk berhasil dihapus!");
    } catch (error) {
      console.error("Error menghapus anggota:", error.message || error);
      alert("Gagal menghapus anggota. Silakan cek console untuk detail.");
    }
  };

  if (loading) return <p>Loading...</p>;
  if (errorMsg) return <p className="text-red-500">{errorMsg}</p>;
  if (!kkMeta) return <p>Data KK tidak tersedia.</p>;

  return (
    <div className="p-6 bg-white rounded-lg shadow relative">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Anggota KK</h2>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
        >
          Tutup
        </button>
      </div>

      {/* Info KK */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="font-semibold text-gray-700">No KK</label>
          <input
            type="text"
            value={kkMeta.no_kk || ""}
            readOnly
            className="w-full border p-2 rounded bg-gray-50"
          />
        </div>

        {kkInfo ? (
          <div>
            <label className="font-semibold text-gray-700">Kepala Keluarga</label>
            <input
              type="text"
              value={kkInfo.nama || ""}
              readOnly
              className="w-full border p-2 rounded bg-gray-50"
            />
          </div>
        ) : null}

        <div className="col-span-1 sm:col-span-2">
          <label className="font-semibold text-gray-700">Alamat</label>
          <input
            type="text"
            value={`${kkMeta.alamat || ""}${kkMeta.rt ? `, RT ${kkMeta.rt}` : ""}${kkMeta.rw ? ` RW ${kkMeta.rw}` : ""}${kkMeta.desa ? `, ${kkMeta.desa}` : ""}${kkMeta.kecamatan ? `, ${kkMeta.kecamatan}` : ""}${kkMeta.kabupaten ? `, ${kkMeta.kabupaten}` : ""}${kkMeta.provinsi ? `, ${kkMeta.provinsi}` : ""}${kkMeta.kode_pos ? `, ${kkMeta.kode_pos}` : ""}`}
            readOnly
            className="w-full border p-2 rounded bg-gray-50"
          />
        </div>
      </div>

      {!kkInfo && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-700">
          Perhatian: KK ini tidak memiliki anggota dengan status "Kepala Keluarga".
        </div>
      )}

      {/* Tabel Anggota */}
      <div className="overflow-x-auto border rounded">
        <table className="min-w-full border-collapse">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="p-3 border text-center">No</th>
              <th className="p-3 border text-center">Nama</th>
              <th className="p-3 border text-center">Jk</th>
              <th className="p-3 border text-center">Hub Keluarga</th>
              <th className="p-3 border text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {anggota.length > 0 ? (
              anggota.map((a, idx) => (
                <tr key={a.id_penduduk} className="hover:bg-gray-50">
                  <td className="p-3 border text-center">{idx + 1}</td>
                  <td className="p-3 border text-center">{a.data_penduduk?.nama || "-"}</td>
                  <td className="p-3 border text-center">{a.data_penduduk?.jk || "-"}</td>
                  <td className="p-3 border text-center">{a.hubungan || "-"}</td>
                  <td className="p-3 border text-center">
                    <button
                      onClick={() => handleHapus(a.id_penduduk)}
                      className="bg-red-500 text-white p-2 rounded hover:bg-red-600 transition"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="text-center p-4 text-gray-500">
                  Tidak ada anggota KK
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AnggotaKK;
