import React, { useState, useEffect } from "react";
import { Check, X, Eye } from "lucide-react";
import supabase from "../../supabaseClient";

function Pindah_Update() {
  const [activeTab, setActiveTab] = useState("edit"); // "edit" | "add" | "delete"
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

  // === FETCH USULAN BERDASARKAN TAB ===
const fetchUsulan = async (tab) => {
  setLoading(true);

  try {
    let query = supabase.from("data_pindah_update").select("*");

    // Filter sesuai tab aktif
    if (tab === "edit") {
      query = query.eq("jenis_update", "edit");
    } else if (tab === "add") {
      query = query.eq("jenis_update", "tambah");
    } else if (tab === "delete") {
      // 🔹 Ambil semua yang jenisnya hapus atau kembalikan
      query = query.in("jenis_update", ["hapus", "kembalikan"]);
    }

    const { data, error } = await query.eq("status_verifikasi", "menunggu persetujuan");

    if (error) throw error;

    setUsulan(data || []);
  } catch (err) {
    console.error("Gagal memuat data:", err);
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    fetchUsulan(activeTab);
  }, [activeTab]);

  // === OPEN REJECT MODAL ===
  const openRejectModal = (item) => {
    setSelectedItem(item);
    setAlasanPenolakan("");
    setShowRejectModal(true);
  };

  // === VIEW EDIT PREVIEW ===
  const handleViewEditData = async (item) => {
    try {
      const { data: oldData, error: errorOld } = await supabase
        .from("data_pindah")
        .select("*")
        .eq("id_penduduk", item.id_penduduk)
        .single();
      if (errorOld && errorOld.code !== "PGRST116") throw errorOld;

      const { data: newData, error: errorNew } = await supabase
        .from("data_pindah_update")
        .select("*")
        .eq("id", item.id)
        .single();
      if (errorNew) throw errorNew;

      const pindahFields = [
        "alamat_pindah", "rt_pindah", "rw_pindah", "desa_pindah",
        "kecamatan_pindah", "kabupaten_pindah", "provinsi_pindah",
        "kodepos_pindah", "tanggal_pindah", "alasan", "alasan_lain",
        "jenis_pindah", "statuskk_pindah", "statuskk_tidakpindah",
      ];

      const oldFiltered = { nik: oldData?.nik, nama: oldData?.nama, no_kk: oldData?.no_kk };
      pindahFields.forEach((f) => (oldFiltered[f] = oldData?.[f] ?? "-"));

      const newFiltered = { nik: newData?.nik, nama: newData?.nama, no_kk: newData?.no_kk };
      pindahFields.forEach((f) => (newFiltered[f] = newData?.[f] ?? "-"));

      setEditPreviewData({ old: oldFiltered, new: newFiltered });
      setShowEditPreview(true);
    } catch (err) {
      console.error("Gagal ambil data edit:", err);
      alert("Gagal menampilkan data edit.");
    }
  };

  // === VIEW ADD PREVIEW ===
  const handleViewAddData = async (item) => {
    try {
      const { data, error } = await supabase
        .from("data_pindah_update")
        .select("*")
        .eq("id", item.id)
        .single();
      if (error) throw error;

      setAddPreviewData(data);
      setShowAddPreview(true);
    } catch (err) {
      console.error("Gagal ambil data tambah:", err);
      alert("Gagal menampilkan data tambah.");
    }
  };

  // === VIEW DELETE PREVIEW ===
  const handleViewDeleteData = async (item) => {
    try {
      const { data, error } = await supabase
        .from("data_pindah")
        .select("*")
        .eq("id_penduduk", item.id_penduduk)
        .single();
      if (error) throw error;

      setDeletePreviewData(data);
      setShowDeletePreview(true);
    } catch (err) {
      console.error("Gagal ambil data hapus:", err);
      alert("Gagal menampilkan data yang akan dihapus.");
    }
  };

  const [loadingId, setLoadingId] = useState(null);

  // === APPROVE (PANGGIL SESUAI TAB) ===
  const handleApprove = async (item) => {
    if (activeTab === "edit") return handleApproveEdit(item);
    if (activeTab === "add") return handleApproveAdd(item);
    if (activeTab === "delete") return handleApproveDelete(item);
  };

  // === APPROVE EDIT ===
  const handleApproveEdit = async (item) => {
    try {
      setLoadingId(item.id_penduduk);

      const { data: pindahData, error } = await supabase
        .from("data_pindah_update")
        .select("*")
        .eq("id", item.id)
        .single();
      if (error) throw error;

      const { error: errorUpdate } = await supabase
        .from("data_pindah")
        .update({
          alamat_pindah: pindahData.alamat_pindah,
          rt_pindah: pindahData.rt_pindah,
          rw_pindah: pindahData.rw_pindah,
          desa_pindah: pindahData.desa_pindah,
          kecamatan_pindah: pindahData.kecamatan_pindah,
          kabupaten_pindah: pindahData.kabupaten_pindah,
          provinsi_pindah: pindahData.provinsi_pindah,
          kodepos_pindah: pindahData.kodepos_pindah,
          tanggal_pindah: pindahData.tanggal_pindah,
          alasan: pindahData.alasan,
          alasan_lain: pindahData.alasan_lain,
          jenis_pindah: pindahData.jenis_pindah,
          statuskk_pindah: pindahData.statuskk_pindah,
          statuskk_tidakpindah: pindahData.statuskk_tidakpindah,
          status_verifikasi: "disetujui",
          updated_at: new Date(),
        })
        .eq("id_penduduk", pindahData.id_penduduk);
      if (errorUpdate) throw errorUpdate;

      // Hapus record usulan
      const { error: errorDeleteUpdate } = await supabase
        .from("data_pindah_update")
        .delete()
        .eq("id", item.id);
      if (errorDeleteUpdate) throw errorDeleteUpdate;

      alert("✅ Perubahan data berhasil disetujui!");
      await fetchUsulan(activeTab);
    } catch (err) {
      console.error("Gagal menyetujui edit:", err);
      alert("❌ Gagal menyetujui edit: " + (err.message || err));
    } finally {
      setLoadingId(null);
    }
  };

  // === APPROVE ADD ===
  const handleApproveAdd = async (item) => {
    try {
      setLoadingId(item.id_penduduk);

      // Ambil data usulan dari data_pindah_update
      const { data: newData, error: errorGet } = await supabase
        .from("data_pindah_update")
        .select("*")
        .eq("id", item.id)
        .single();
      if (errorGet) throw errorGet;

      // Masukkan ke data_pindah dengan status "disetujui"
      const insertPayload = {
        id_penduduk: newData.id_penduduk,
        no_kk: newData.no_kk,
        nik: newData.nik,
        nama: newData.nama,
        tempat_lahir: newData.tempat_lahir,
        tanggal_lahir: newData.tanggal_lahir,
        jk: newData.jk,
        agama: newData.agama,
        status_perkawinan: newData.status_perkawinan,
        pendidikan: newData.pendidikan,
        pekerjaan: newData.pekerjaan,
        alamat: newData.alamat,
        rt: newData.rt,
        rw: newData.rw,
        status_keluarga: newData.status_keluarga,
        nik_ayah: newData.nik_ayah,
        nama_ayah: newData.nama_ayah,
        nik_ibu: newData.nik_ibu,
        nama_ibu: newData.nama_ibu,
        desa: newData.desa,
        kecamatan: newData.kecamatan,
        kabupaten: newData.kabupaten,
        provinsi: newData.provinsi,
        golongan_darah: newData.golongan_darah,
        kode_pos: newData.kode_pos,
        tanggal_pindah: newData.tanggal_pindah,
        alasan: newData.alasan,
        alasan_lain: newData.alasan_lain,
        alamat_pindah: newData.alamat_pindah,
        rt_pindah: newData.rt_pindah,
        rw_pindah: newData.rw_pindah,
        desa_pindah: newData.desa_pindah,
        kecamatan_pindah: newData.kecamatan_pindah,
        kabupaten_pindah: newData.kabupaten_pindah,
        provinsi_pindah: newData.provinsi_pindah,
        kodepos_pindah: newData.kodepos_pindah,
        jenis_pindah: newData.jenis_pindah,
        statuskk_tidakpindah: newData.statuskk_tidakpindah,
        statuskk_pindah: newData.statuskk_pindah,
        status_verifikasi: "disetujui",
        created_at: new Date(),
        updated_at: new Date(),
      };

      const { error: errorInsert } = await supabase.from("data_pindah").insert([insertPayload]);
      if (errorInsert) throw errorInsert;

      // Hapus dari data_penduduk (karena dipindahkan)
      const { error: errorDeletePenduduk } = await supabase
        .from("data_penduduk")
        .delete()
        .eq("id_penduduk", newData.id_penduduk);
      if (errorDeletePenduduk) throw errorDeletePenduduk;

      // Hapus record usulan
      const { error: errorDeleteUpdate } = await supabase
        .from("data_pindah_update")
        .delete()
        .eq("id", item.id);
      if (errorDeleteUpdate) throw errorDeleteUpdate;

      alert("✅ Data berhasil disetujui!");
      await fetchUsulan(activeTab);
    } catch (err) {
      console.error("Gagal menyetujui tambah:", err);
      alert("❌ Gagal menyetujui tambah: " + (err.message || err));
    } finally {
      setLoadingId(null);
    }
  };

  // === APPROVE DELETE ===
const handleApproveDelete = async (item) => {
  try {
    setLoadingId(item.id_penduduk);

    // Ambil sekali dari data_pindah_update berdasarkan id usulan
    const { data: updateData, error: errUpdate } = await supabase
      .from("data_pindah_update")
      .select("*")
      .eq("id", item.id)
      .single();
    if (errUpdate) throw errUpdate;

    if (updateData.jenis_update === "hapus") {
      // Hapus permanen dari data_pindah
      const { error: errorDelete } = await supabase
        .from("data_pindah")
        .delete()
        .eq("id_penduduk", item.id_penduduk);
      if (errorDelete) throw errorDelete;

      // bersihkan usulan
      const { error: errorCleanup } = await supabase
        .from("data_pindah_update")
        .delete()
        .eq("id", item.id);
      if (errorCleanup) throw errorCleanup;

      alert("🗑️ Data berhasil dihapus permanen!");
    } else if (updateData.jenis_update === "kembalikan") {
      // mapping payload dengan fallback (pakai field pindah jika tidak ada di root)
      const payload = {
        no_kk: updateData.no_kk,
        nik: updateData.nik,
        nama: updateData.nama,
        tempat_lahir: updateData.tempat_lahir,
        tanggal_lahir: updateData.tanggal_lahir,
        jk: updateData.jk,
        agama: updateData.agama,
        status_perkawinan: updateData.status_perkawinan,
        pendidikan: updateData.pendidikan,
        pekerjaan: updateData.pekerjaan,
        // gunakan alamat asli jika ada, kalau nggak pakai alamat_pindah
        alamat: updateData.alamat ?? updateData.alamat_pindah ?? null,
        rt: updateData.rt ?? updateData.rt_pindah ?? null,
        rw: updateData.rw ?? updateData.rw_pindah ?? null,
        status_keluarga: updateData.status_keluarga ?? null,
        nik_ayah: updateData.nik_ayah ?? null,
        nama_ayah: updateData.nama_ayah ?? null,
        nik_ibu: updateData.nik_ibu ?? null,
        nama_ibu: updateData.nama_ibu ?? null,
        desa: updateData.desa ?? updateData.desa_pindah ?? "Margahayu Tengah",
        kecamatan: updateData.kecamatan ?? updateData.kecamatan_pindah ?? "Margahayu",
        kabupaten: updateData.kabupaten ?? updateData.kabupaten_pindah ?? "Bandung",
        provinsi: updateData.provinsi ?? updateData.provinsi_pindah ?? "Jawa Barat",
        kode_pos: updateData.kode_pos ?? updateData.kodepos_pindah ?? "40225",
        status_verifikasi: "disetujui",
        created_at: new Date(),
        updated_at: new Date(),
      };

      // INSERT dan ambil hasilnya untuk verifikasi
      const { data: insertedRow, error: errorInsert } = await supabase
        .from("data_penduduk")
        .insert([payload])
        .select()
        .single();
      if (errorInsert) throw errorInsert;

      // (opsional) cek insertedRow di console
      console.log("Inserted back to data_penduduk:", insertedRow);

      // Hapus dari data_pindah (karena sudah kembali)
      const { error: errorDeletePindah } = await supabase
        .from("data_pindah")
        .delete()
        .eq("id_penduduk", item.id_penduduk);
      if (errorDeletePindah) throw errorDeletePindah;

      // Hapus usulan
      const { error: errorCleanup } = await supabase
        .from("data_pindah_update")
        .delete()
        .eq("id", item.id);
      if (errorCleanup) throw errorCleanup;

      alert("✅ Data berhasil dikembalikan ke data penduduk!");
    } else {
      alert("⚠️ Jenis update tidak dikenali.");
    }

    // refresh list usulan
    await fetchUsulan(activeTab);
  } catch (err) {
    console.error("Gagal menyetujui hapus/kembalikan:", err);
    alert("❌ Gagal menyetujui hapus/kembalikan: " + (err.message || err));
  } finally {
    setLoadingId(null);
  }
};

  // === REJECT EDIT ===
  const handleRejectEdit = async () => {
    if (!alasanPenolakan.trim()) return alert("Isi alasan penolakan!");
    const item = selectedItem;
    try {
      await supabase
        .from("data_pindah")
        .update({ alasan_penolakan: alasanPenolakan.trim(), status_verifikasi: "disetujui", updated_at: new Date() })
        .eq("id_penduduk", item.id_penduduk);
      await supabase.from("data_pindah_update").delete().eq("id", item.id);
      alert("✅ Penolakan edit berhasil dikirim!");
      setShowRejectModal(false);
      await fetchUsulan(activeTab);
    } catch (err) {
      console.error(err);
      alert("❌ Gagal menolak edit");
    }
  };

  // === REJECT ADD ===
  const handleRejectAdd = async () => {
    if (!alasanPenolakan.trim()) return alert("Isi alasan penolakan!");
    const item = selectedItem;
    try {
      // Ambil data dari usulan
      const { data: usulan, error: errorGet } = await supabase
        .from("data_pindah_update")
        .select("id_penduduk")
        .eq("id", item.id)
        .single();
      if (errorGet) throw errorGet;

      // Update data_penduduk -> alasan_penolakan dan status_verifikasi
      const { error: errorUpdate } = await supabase
        .from("data_penduduk")
        .update({
          alasan_penolakan: alasanPenolakan.trim(),
          status_verifikasi: "disetujui",
          updated_at: new Date(),
        })
        .eq("id_penduduk", usulan.id_penduduk);
      if (errorUpdate) throw errorUpdate;

      // Hapus dari data_pindah_update
      const { error: errorDelete } = await supabase
        .from("data_pindah_update")
        .delete()
        .eq("id", item.id);
      if (errorDelete) throw errorDelete;

      alert("✅ Data berhasil ditolak!");
      setShowRejectModal(false);
      await fetchUsulan(activeTab);
    } catch (err) {
      console.error("Gagal menolak tambah:", err);
      alert("❌ Gagal menolak tambah: " + (err.message || err));
    }
  };

  // === REJECT DELETE ===
  const handleRejectDelete = async () => {
    if (!alasanPenolakan.trim()) return alert("Isi alasan penolakan!");
    const item = selectedItem;
    try {
      await supabase
        .from("data_pindah")
        .update({ alasan_penolakan: alasanPenolakan.trim(), status_verifikasi: "disetujui", updated_at: new Date() })
        .eq("id_penduduk", item.id_penduduk);
      await supabase.from("data_pindah_update").delete().eq("id", item.id);
      alert("✅ Penolakan hapus berhasil dikirim!");
      setShowRejectModal(false);
      await fetchUsulan(activeTab);
    } catch (err) {
      console.error(err);
      alert("❌ Gagal menolak hapus");
    }
  };

  // === RENDER MODAL PENOLAKAN ===
  const renderRejectModal = () =>
    showRejectModal && (
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowRejectModal(false)}></div>
        <div className="relative bg-white p-6 rounded-lg shadow-lg w-full max-w-md z-10">
          <h2 className="text-lg font-semibold mb-4 text-center text-red-600">Alasan Penolakan</h2>
          <textarea
            className="w-full border rounded-lg p-2 text-sm"
            rows="4"
            placeholder="Masukkan alasan penolakan..."
            value={alasanPenolakan}
            onChange={(e) => setAlasanPenolakan(e.target.value)}
          ></textarea>
          <div className="mt-4 flex justify-end space-x-2">
            <button onClick={() => setShowRejectModal(false)} className="px-3 py-1 bg-gray-300 rounded">
              Batal
            </button>
            <button
              onClick={() => {
                if (activeTab === "edit") handleRejectEdit();
                else if (activeTab === "add") handleRejectAdd();
                else if (activeTab === "delete") handleRejectDelete();
              }}
              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Kirim
            </button>
          </div>
        </div>
      </div>
    );

  // === PREVIEW FUNCTIONS (tidak berubah) ===
  const renderEditPreview = () =>
    showEditPreview &&
    editPreviewData && (
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowEditPreview(false)}></div>
        <div className="relative bg-white p-6 rounded-lg shadow-lg w-full max-w-4xl z-10 overflow-y-auto max-h-[90vh]">
          <h2 className="text-lg font-semibold mb-4 text-center">Perbandingan Data Lama vs Usulan Edit</h2>
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
                const oldVal = editPreviewData.old?.[key] ?? "-";
                const newVal = editPreviewData.new?.[key] ?? "-";
                const changed = oldVal !== newVal;
                return (
                  <tr key={key} className={changed ? "bg-yellow-50" : ""}>
                    <td className="border px-2 py-1 font-medium">{key}</td>
                    <td className="border px-2 py-1 text-gray-700">{oldVal}</td>
                    <td className="border px-2 py-1">{changed ? <span className="text-green-700 font-semibold">{newVal}</span> : newVal}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="flex justify-end mt-4">
            <button onClick={() => setShowEditPreview(false)} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
              Tutup
            </button>
          </div>
        </div>
      </div>
    );

  const renderAddPreview = () =>
    showAddPreview &&
    addPreviewData && (
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowAddPreview(false)}></div>
        <div className="relative bg-white p-6 rounded-lg shadow-lg w-full max-w-3xl z-10 overflow-y-auto max-h-[90vh]">
          <h2 className="text-lg font-semibold mb-4 text-center">Detail Usulan Data Pindah</h2>
          <table className="w-full border border-gray-300 text-sm">
            <tbody>
              {Object.entries(addPreviewData).map(([key, value]) => {
                if (["id", "jenis_update", "status_verifikasi", "created_at", "updated_at"].includes(key)) return null;
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
            <button onClick={() => setShowAddPreview(false)} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
              Tutup
            </button>
          </div>
        </div>
      </div>
    );

  const renderDeletePreview = () =>
    showDeletePreview &&
    deletePreviewData && (
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDeletePreview(false)}></div>
        <div className="relative bg-white p-6 rounded-lg shadow-lg w-full max-w-3xl z-10 overflow-y-auto max-h-[90vh]">
          <h2 className="text-lg font-semibold mb-4 text-center text-red-700">Detail Data </h2>
          <table className="w-full border border-gray-300 text-sm">
            <tbody>
              {Object.entries(deletePreviewData).map(([key, value]) => {
                if (["id_penduduk", "created_at", "updated_at", "status_verifikasi"].includes(key)) return null;
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
            <button onClick={() => setShowDeletePreview(false)} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
              Tutup
            </button>
          </div>
        </div>
      </div>
    );

  // === RENDER TABLE ===
  const renderTable = () => {
    if (loading) return <div>Memuat data...</div>;
    if (!usulan.length) return <div>Tidak ada usulan menunggu persetujuan.</div>;

    return (
      <table className="w-full border-collapse border">
        <thead>
          <tr className="bg-green-600 text-white">
            <th className="border px-2 py-1">NIK</th>
            <th className="border px-2 py-1">Nama</th>
            <th className="border px-2 py-1">Alamat Pindah</th>
            <th className="border px-2 py-1">Tanggal Pindah</th>

            {/* ✅ Tambahkan kolom Jenis Hapus khusus tab delete */}
            {activeTab === "delete" && (
              <th className="border px-2 py-1">Jenis Hapus</th>
            )}

            <th className="border px-2 py-1">Aksi</th>
          </tr>
        </thead>

        <tbody>
          {usulan.map((item) => (
            <tr key={item.id}>
              <td className="border px-2 py-1">{item.nik}</td>
              <td className="border px-2 py-1">{item.nama}</td>
              <td className="border px-2 py-1">{item.alamat_pindah}</td>
              <td className="border px-2 py-1">{item.tanggal_pindah}</td>

              {/* ✅ Isi kolom Jenis Hapus */}
              {activeTab === "delete" && (
                <td className="border px-2 py-1 text-center font-medium">
                  {item.jenis_update === "hapus"
                    ? "Hapus Permanen"
                    : item.jenis_update === "kembalikan"
                    ? "Kembalikan Data"
                    : "-"}
                </td>
              )}

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
      <h1 className="text-xl font-semibold mb-4">Persetujuan Data Pindah</h1>

      <div className="flex mb-4 space-x-2">
        {Object.keys(tabToJenis).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded ${activeTab === tab ? "bg-green-600 text-white" : "bg-gray-200"}`}
          >
            {tab === "edit" ? "Edit Data" : tab === "add" ? "Tambah Pindah" : "Hapus Data"}
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

export default Pindah_Update;
