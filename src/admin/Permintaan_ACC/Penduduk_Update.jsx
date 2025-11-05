import React, { useState, useEffect } from "react";
import { Check, X, Eye } from "lucide-react";
import supabase from "../../supabaseClient";

function Penduduk_Update() {
  const [activeTab, setActiveTab] = useState("edit");
  const [usulan, setUsulan] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [alasanPenolakan, setAlasanPenolakan] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);

  const [showEditPreview, setShowEditPreview] = useState(false);
  const [editPreviewData, setEditPreviewData] = useState(null);

  const [showAddPreview, setShowAddPreview] = useState(false);
  const [addPreviewData, setAddPreviewData] = useState(null);

  const [showDeletePreview, setShowDeletePreview] = useState(false);
  const [deletePreviewData, setDeletePreviewData] = useState(null);

  const tabToJenis = {
    edit: "edit",
    add: "tambah",
    delete: "hapus",
  };

  // === FETCH DATA USULAN BERDASARKAN TAB ===
  const fetchUsulan = async (tab) => {
    setLoading(true);
    const jenis = tabToJenis[tab];
    const { data, error } = await supabase
      .from("data_penduduk_update")
      .select("*")
      .eq("jenis_update", jenis)
      .eq("status_verifikasi", "menunggu persetujuan");

    if (error) console.error(error);
    setUsulan(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsulan(activeTab);
  }, [activeTab]);

  // === BUKA MODAL PENOLAKAN ===
  const openRejectModal = (item) => {
    setSelectedItem(item);
    setAlasanPenolakan("");
    setShowRejectModal(true);
  };

  // === BUKA PREVIEW EDIT ===
  const handleViewEditData = async (item) => {
    const { data: oldData } = await supabase
      .from("data_penduduk")
      .select("*")
      .eq("id_penduduk", item.id_penduduk)
      .single();

    setEditPreviewData({ old: oldData, new: item });
    setShowEditPreview(true);
  };

  // === BUKA PREVIEW TAMBAH ===
  const handleViewAddData = async (item) => {
    const { data, error } = await supabase
      .from("data_penduduk_update")
      .select("*")
      .eq("nik", item.nik)
      .eq("jenis_update", "tambah")
      .single();

    if (error) {
      console.error("Gagal ambil data tambah:", error);
      alert("❌ Tidak dapat menampilkan data!");
      return;
    }

    setAddPreviewData(data);
    setShowAddPreview(true);
  };

  // === BUKA PREVIEW HAPUS (DETAIL DATA YANG AKAN DIHAPUS) ===
  const handleViewDeleteData = async (item) => {
    const { data, error } = await supabase
      .from("data_penduduk")
      .select("*")
      .eq("id_penduduk", item.id_penduduk)
      .single();

    if (error || !data) {
      console.error("Gagal ambil data hapus:", error);
      alert("❌ Tidak dapat menampilkan data penduduk yang akan dihapus!");
      return;
    }

    setDeletePreviewData(data);
    setShowDeletePreview(true);
  };

  // === SETUJUI ===
const handleApprove = async (item) => {
  try {
    // 🔹 1. Proses berdasarkan jenis update
    if (item.jenis_update === "tambah") {
      // Cukup ubah status_verifikasi di data_penduduk
      await supabase
        .from("data_penduduk")
        .update({
          status_verifikasi: "disetujui",
          jenis_update: item.jenis_update, // ✅ kirim jenis_update juga
          alasan_penolakan: null,
          updated_at: new Date(),
        })
        .eq("id_penduduk", item.id_penduduk);
    } 
    else if (item.jenis_update === "edit") {
      await supabase
        .from("data_penduduk")
        .update({
          no_kk: item.no_kk,
          nik: item.nik,
          nama: item.nama,
          tempat_lahir: item.tempat_lahir,
          tanggal_lahir: item.tanggal_lahir,
          jk: item.jk,
          agama: item.agama,
          status_perkawinan: item.status_perkawinan,
          pendidikan: item.pendidikan,
          pekerjaan: item.pekerjaan,
          alamat: item.alamat,
          rt: item.rt,
          rw: item.rw,
          status_keluarga: item.status_keluarga,
          nik_ayah: item.nik_ayah,
          nama_ayah: item.nama_ayah,
          nik_ibu: item.nik_ibu,
          nama_ibu: item.nama_ibu,
          golongan_darah: item.golongan_darah,
          desa: item.desa,
          kecamatan: item.kecamatan,
          kabupaten: item.kabupaten,
          provinsi: item.provinsi,
          kode_pos: item.kode_pos,
          status_verifikasi: "disetujui",
          jenis_update: item.jenis_update, // ✅ kirim juga
          alasan_penolakan: null,
          updated_at: new Date(),
        })
        .eq("id_penduduk", item.id_penduduk);
    } 
    else if (item.jenis_update === "hapus") {
      // Hapus data dari tabel utama
      await supabase
        .from("data_penduduk")
        .delete()
        .eq("id_penduduk", item.id_penduduk);
    }

    // 🔹 2. Hapus usulan dari data_penduduk_update
    await supabase
      .from("data_penduduk_update")
      .delete()
      .eq("id", item.id);

    alert("✅ Usulan berhasil disetujui dan dihapus dari daftar!");
    await fetchUsulan(activeTab);
  } catch (err) {
    console.error("❌ Error saat menyetujui:", err);
    alert("❌ Gagal menyetujui data!");
  }
};

  // === TOLAK ===
const handleReject = async () => {
  const item = selectedItem;
  if (!alasanPenolakan.trim()) {
    alert("Isi alasan penolakan!");
    return;
  }

  try {
    // 🔹 1. Update data_penduduk: jangan hapus, cukup update status, jenis, dan alasan
    await supabase
      .from("data_penduduk")
      .update({
        status_verifikasi: "disetujui",
        jenis_update: item.jenis_update, // tetap kirim jenis update
        alasan_penolakan: alasanPenolakan.trim(),
        updated_at: new Date(),
      })
      .eq("id_penduduk", item.id_penduduk);

    // 🔹 2. Hapus usulan dari data_penduduk_update saja
    await supabase
      .from("data_penduduk_update")
      .delete()
      .eq("id", item.id);

    alert(
      `✅ Data berhasil ditolak!`
    );
    setShowRejectModal(false);
    fetchUsulan(activeTab);
  } catch (err) {
    console.error("❌ Gagal menolak data:", err);
    alert("❌ Gagal menolak data!");
  }
};


  // === MODAL PENOLAKAN ===
  const renderRejectModal = () =>
    showRejectModal && (
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={() => setShowRejectModal(false)}
        ></div>
        <div className="relative bg-white p-6 rounded-lg shadow-lg w-full max-w-md z-10">
          <h2 className="text-lg font-semibold mb-4 text-center text-red-600">
            Alasan Penolakan
          </h2>
          <textarea
            className="w-full border rounded-lg p-2 text-sm"
            rows="4"
            placeholder="Masukkan alasan penolakan..."
            value={alasanPenolakan}
            onChange={(e) => setAlasanPenolakan(e.target.value)}
          ></textarea>
          <div className="mt-4 flex justify-end space-x-2">
            <button
              onClick={() => setShowRejectModal(false)}
              className="px-3 py-1 bg-gray-300 rounded"
            >
              Batal
            </button>
            <button
              onClick={handleReject}
              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Kirim
            </button>
          </div>
        </div>
      </div>
    );

  // === MODAL PERBANDINGAN EDIT ===
  const renderEditPreview = () =>
    showEditPreview &&
    editPreviewData && (
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={() => setShowEditPreview(false)}
        ></div>
        <div className="relative bg-white p-6 rounded-lg shadow-lg w-full max-w-4xl z-10 overflow-y-auto max-h-[90vh]">
          <h2 className="text-lg font-semibold mb-4 text-center">
            Perbandingan Data Lama vs Baru
          </h2>
          <table className="w-full border border-gray-300 text-sm">
            <thead>
              <tr className="bg-green-600 text-white">
                <th className="border px-2 py-1">Field</th>
                <th className="border px-2 py-1">Data Lama</th>
                <th className="border px-2 py-1">Data Baru</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(editPreviewData.new).map((key) => {
                if (
                  [
                    "id",
                    "id_penduduk",
                    "created_at",
                    "updated_at",
                    "status_verifikasi",
                    "jenis_update",
                  ].includes(key)
                )
                  return null;

                const oldVal = editPreviewData.old?.[key] ?? "-";
                const newVal = editPreviewData.new?.[key] ?? "-";
                const changed = oldVal !== newVal;

                return (
                  <tr key={key} className={changed ? "bg-yellow-50" : ""}>
                    <td className="border px-2 py-1 font-medium">{key}</td>
                    <td className="border px-2 py-1 text-gray-700">{oldVal}</td>
                    <td className="border px-2 py-1">
                      {changed ? (
                        <span className="text-green-700 font-semibold">
                          {newVal}
                        </span>
                      ) : (
                        newVal
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="flex justify-end mt-4">
            <button
              onClick={() => setShowEditPreview(false)}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    );

  // === MODAL TAMBAH (LIHAT DATA BARU) ===
  const renderAddPreview = () =>
    showAddPreview &&
    addPreviewData && (
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={() => setShowAddPreview(false)}
        ></div>
        <div className="relative bg-white p-6 rounded-lg shadow-lg w-full max-w-3xl z-10 overflow-y-auto max-h-[90vh]">
          <h2 className="text-lg font-semibold mb-4 text-center">
            Detail Data Penduduk Baru
          </h2>
          <table className="w-full border border-gray-300 text-sm">
            <tbody>
              {Object.entries(addPreviewData).map(([key, value]) => {
                if (
                  [
                    "id",
                    "jenis_update",
                    "status_verifikasi",
                    "created_at",
                    "updated_at",
                  ].includes(key)
                )
                  return null;
                return (
                  <tr key={key}>
                    <td className="border px-2 py-1 font-medium">{key}</td>
                    <td className="border px-2 py-1">{value ?? "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="flex justify-end mt-4">
            <button
              onClick={() => setShowAddPreview(false)}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    );

  // === MODAL DETAIL DATA HAPUS ===
  const renderDeletePreview = () =>
    showDeletePreview &&
    deletePreviewData && (
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={() => setShowDeletePreview(false)}
        ></div>
        <div className="relative bg-white p-6 rounded-lg shadow-lg w-full max-w-3xl z-10 overflow-y-auto max-h-[90vh]">
          <h2 className="text-lg font-semibold mb-4 text-center text-red-700">
            Detail Data yang Akan Dihapus
          </h2>
          <table className="w-full border border-gray-300 text-sm">
            <tbody>
              {Object.entries(deletePreviewData).map(([key, value]) => {
                if (
                  [
                    "id_penduduk",
                    "created_at",
                    "updated_at",
                    "status_verifikasi",
                  ].includes(key)
                )
                  return null;
                return (
                  <tr key={key}>
                    <td className="border px-2 py-1 font-medium">{key}</td>
                    <td className="border px-2 py-1">{value ?? "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="flex justify-end mt-4">
            <button
              onClick={() => setShowDeletePreview(false)}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    );

  // === RENDER TABEL ===
  const renderTable = () => {
    if (loading) return <div>Memuat data...</div>;
    if (!usulan.length) return <div>Tidak ada usulan menunggu persetujuan.</div>;

    return (
      <table className="w-full border-collapse border">
        <thead>
          <tr className="bg-green-600 text-white">
            <th className="border px-2 py-1">No KK</th>
            <th className="border px-2 py-1">NIK</th>
            <th className="border px-2 py-1">Nama</th>
            <th className="border px-2 py-1">RT / RW</th>
            <th className="border px-2 py-1">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {usulan.map((item) => (
            <tr key={item.id}>
              <td className="border px-2 py-1">{item.no_kk || "-"}</td>
              <td className="border px-2 py-1">{item.nik}</td>
              <td className="border px-2 py-1">{item.nama}</td>
              <td className="border px-2 py-1">
                {item.rt} / {item.rw}
              </td>
              <td className="border px-2 py-1 flex gap-1 justify-center">
                {activeTab === "edit" && (
                  <button
                    onClick={() => handleViewEditData(item)}
                    className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                    title="Lihat Perubahan"
                  >
                    <Eye size={16} />
                  </button>
                )}
                {activeTab === "add" && (
                  <button
                    onClick={() => handleViewAddData(item)}
                    className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                    title="Lihat Data Baru"
                  >
                    <Eye size={16} />
                  </button>
                )}
                {activeTab === "delete" && (
                  <button
                    onClick={() => handleViewDeleteData(item)}
                    className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                    title="Lihat Detail Data"
                  >
                    <Eye size={16} />
                  </button>
                )}
                <button
                  onClick={() => handleApprove(item)}
                  className="p-1 bg-green-600 text-white rounded hover:bg-green-700"
                  title="Setujui"
                >
                  <Check size={16} />
                </button>
                <button
                  onClick={() => openRejectModal(item)}
                  className="p-1 bg-red-600 text-white rounded hover:bg-red-700"
                  title="Tolak"
                >
                  <X size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h1 className="text-xl font-semibold mb-4">Persetujuan Data Penduduk</h1>

      <div className="flex mb-4 space-x-2">
        {Object.keys(tabToJenis).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded ${
              activeTab === tab ? "bg-green-600 text-white" : "bg-gray-200"
            }`}
          >
            {tab === "edit"
              ? "Edit Data"
              : tab === "add"
              ? "Tambah Data"
              : "Hapus Data"}
          </button>
        ))}
      </div>

      {renderTable()}
      {renderRejectModal()}
      {renderEditPreview()}
      {renderAddPreview()}
      {renderDeletePreview()}
    </div>
  );
}

export default Penduduk_Update; 