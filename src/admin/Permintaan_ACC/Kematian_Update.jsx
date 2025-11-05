// src/pages/Kematian_Update.jsx
import React, { useState, useEffect } from "react";
import { Check, X, Eye } from "lucide-react";
import supabase from "../../supabaseClient";

function Kematian_Update() {
  const [activeTab, setActiveTab] = useState("edit"); // "edit" | "add" | "delete"
  const [usulan, setUsulan] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modal states
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [alasanPenolakan, setAlasanPenolakan] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);

  const [showEditPreview, setShowEditPreview] = useState(false);
  const [editPreviewData, setEditPreviewData] = useState(null);

  const [showAddPreview, setShowAddPreview] = useState(false);
  const [addPreviewData, setAddPreviewData] = useState(null);

  const [showDeletePreview, setShowDeletePreview] = useState(false);
  const [deletePreviewData, setDeletePreviewData] = useState(null);

  const [loadingId, setLoadingId] = useState(null);

  // Map tab ke jenis
  const tabToJenis = {
    edit: "edit",
    add: "tambah",
    delete: "hapus",
  };

  // === FETCH USULAN BERDASARKAN TAB ===
  const fetchUsulan = async (tab) => {
    setLoading(true);
    try {
      let query = supabase.from("data_kematian_update").select("*");

      if (tab === "edit") query = query.eq("jenis_update", "edit");
      else if (tab === "add") query = query.in("jenis_update", ["tambah", "tambah kematian"]);
      else if (tab === "delete") query = query.in("jenis_update", ["hapus", "kembalikan"]);

      const { data, error } = await query.eq("status_verifikasi", "menunggu persetujuan");
      if (error) throw error;

      setUsulan(data || []);
    } catch (err) {
      console.error("Gagal memuat data:", err);
      alert("Gagal memuat usulan. Cek console untuk detail.");
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

  // utility untuk render key/value rows di preview
  const renderKeyValueRows = (obj = {}) =>
    Object.entries(obj).map(([k, v]) => (
      <div key={k} className="flex justify-between border-b py-1 text-xs">
        <div className="capitalize text-gray-700 mr-2">{k.replace(/_/g, " ")}</div>
        <div className="text-gray-900">{v === null || v === undefined ? "-" : String(v)}</div>
      </div>
    ));

  // === VIEW EDIT (Perbandingan Lama vs Baru) ===
  const handleViewEditData = async (item) => {
    try {
      let query = supabase.from("data_kematian").select("*");
      if (item.id_penduduk) query = query.eq("id_penduduk", item.id_penduduk);
      else query = query.eq("nik", item.nik);

      const { data: oldData, error: errOld } = await query.maybeSingle();
      if (errOld) throw errOld;
      if (!oldData) return alert("❌ Data lama tidak ditemukan!");

      const { data: newData, error: errNew } = await supabase
        .from("data_kematian_update")
        .select("*")
        .eq("id", item.id)
        .maybeSingle();

      if (errNew) throw errNew;
      if (!newData) return alert("❌ Data usulan tidak ditemukan!");

      setEditPreviewData({ old: oldData, new: newData });
      setShowEditPreview(true);
    } catch (error) {
      console.error("Gagal memuat data edit:", error);
      alert("Terjadi kesalahan saat memuat data perbandingan edit!");
    }
  };

  // === VIEW ADD ===
  const handleViewAddData = async (item) => {
    try {
      const { data, error } = await supabase
        .from("data_kematian_update")
        .select("*")
        .eq("id", item.id)
        .single();

      if (error) throw error;
      setAddPreviewData(data);
      setShowAddPreview(true);
    } catch (err) {
      console.error("Gagal ambil data tambah:", err);
      alert("Gagal menampilkan preview tambah.");
    }
  };

  // === VIEW DELETE ===
  const handleViewDeleteData = async (item) => {
    try {
      let data;
      if (item.jenis_update === "hapus") {
        // Data ada di data_kematian
        const { data: oldData, error } = await supabase
          .from("data_kematian")
          .select("*")
          .eq("nik", item.nik)
          .maybeSingle();
        if (error) throw error;
        if (!oldData) return alert("❌ Data kematian tidak ditemukan!");
        data = oldData;
      } else if (item.jenis_update === "kembalikan") {
        // Data kembalikan tersimpan di data_kematian_update (usulan kembalikan)
        const { data: updateData, error } = await supabase
          .from("data_kematian_update")
          .select("*")
          .eq("id", item.id)
          .maybeSingle();
        if (error) throw error;
        if (!updateData) return alert("❌ Data kembalikan tidak ditemukan!");
        data = updateData;
      } else {
        return alert("Jenis tidak dikenali!");
      }

      setDeletePreviewData(data);
      setShowDeletePreview(true);
    } catch (error) {
      console.error("Gagal memuat data hapus:", error);
      alert("Terjadi kesalahan saat memuat data hapus!");
    }
  };

  // === CEK DUPLIKAT NIK ===
  const checkDuplicateNik = async (nik) => {
    const { data, error } = await supabase
      .from("data_kematian")
      .select("nik")
      .eq("nik", nik)
      .maybeSingle(); // maybeSingle agar tidak throw 404
    if (error) throw error;
    return !!data;
  };

  // === APPROVE ADD ===
  const handleApproveAdd = async (item) => {
    try {
      setLoadingId(item.id);

      // Ambil data usulan
      const { data: usulanRow, error: errGet } = await supabase
        .from("data_kematian_update")
        .select("*")
        .eq("id", item.id)
        .single();
      if (errGet || !usulanRow) throw new Error("Data usulan tidak ditemukan!");

      // Cek apakah NIK sudah ada di data_kematian
      const { data: existingData } = await supabase
        .from("data_kematian")
        .select("*")
        .eq("nik", usulanRow.nik)
        .maybeSingle();

      if (existingData) {
        // Jika NIK sudah ada, update seluruh field yang relevan + status_verifikasi
        const updateData = { ...usulanRow, status_verifikasi: "disetujui" };
        delete updateData.id;
        const { error: errUpdate } = await supabase
          .from("data_kematian")
          .update(updateData)
          .eq("nik", usulanRow.nik);
        if (errUpdate) throw errUpdate;
      } else {
        // Insert data baru (kirim semua field dari usulan)
        const insertData = { ...usulanRow, status_verifikasi: "disetujui" };
        delete insertData.id;
        const { error: errInsert } = await supabase
          .from("data_kematian")
          .insert([insertData]);
        if (errInsert) throw errInsert;
      }

      // Hapus usulan dari data_kematian_update
      const { error: errDeleteUpdate } = await supabase
        .from("data_kematian_update")
        .delete()
        .eq("id", item.id);
      if (errDeleteUpdate) throw errDeleteUpdate;

      // Hapus dari data_penduduk (karena dipindahkan ke kematian)
      const { error: errDeletePenduduk } = await supabase
        .from("data_penduduk")
        .delete()
        .eq("nik", usulanRow.nik);
      if (errDeletePenduduk) throw errDeletePenduduk;

      alert("✅ Data berhasil disetujui!");
      await fetchUsulan(activeTab);
    } catch (err) {
      console.error(err);
      alert("❌ Gagal menyetujui: " + (err.message || JSON.stringify(err)));
    } finally {
      setLoadingId(null);
    }
  };

  // === APPROVE EDIT ===
  const handleApproveEdit = async (item) => {
    try {
      setLoadingId(item.id);

      const { data: usulanRow, error: errGet } = await supabase
        .from("data_kematian_update")
        .select("*")
        .eq("id", item.id)
        .single();
      if (errGet || !usulanRow) throw new Error("Data usulan tidak ditemukan!");

      const updateData = { ...usulanRow, status_verifikasi: "disetujui" };
      delete updateData.id;
      // Keep id_penduduk if available; if you want to avoid overwriting id_penduduk remove it
      const { error: updateError } = await supabase
        .from("data_kematian")
        .update(updateData)
        .eq("nik", item.nik);
      if (updateError) throw updateError;

      // Hapus usulan
      const { error: errDelete } = await supabase
        .from("data_kematian_update")
        .delete()
        .eq("id", item.id);
      if (errDelete) throw errDelete;

      alert("✅ Usulan edit disetujui dan data berhasil diperbarui!");
      await fetchUsulan(activeTab);
    } catch (err) {
      console.error(err);
      alert("❌ Gagal menyetujui edit: " + (err.message || JSON.stringify(err)));
    } finally {
      setLoadingId(null);
    }
  };

  // === APPROVE DELETE ===
  const handleApproveDelete = async (item) => {
    try {
      setLoadingId(item.id);

      if (item.jenis_update === "hapus") {
        // Hapus data dari data_kematian
        const { error: errDeleteKematian } = await supabase
          .from("data_kematian")
          .delete()
          .eq("nik", item.nik);
        if (errDeleteKematian) throw errDeleteKematian;

        // Hapus data dari data_kematian_update
        const { error: errDeleteUpdate } = await supabase
          .from("data_kematian_update")
          .delete()
          .eq("id", item.id);
        if (errDeleteUpdate) throw errDeleteUpdate;

        alert("✅ Data kematian berhasil dihapus!");
      } else if (item.jenis_update === "kembalikan") {
        // Untuk kembalikan: ambil data dari data_kematian (yang akan dikembalikan)
        const { data: dataKematian, error: errData } = await supabase
          .from("data_kematian")
          .select("*")
          .eq("nik", item.nik)
          .maybeSingle();
        if (errData) throw errData;
        if (!dataKematian) {
          // Jika data_kematian tidak ada (misal usulan menyertakan seluruh field), fallback ambil usulan
          const { data: updateRow, error: errUpdateRow } = await supabase
            .from("data_kematian_update")
            .select("*")
            .eq("id", item.id)
            .maybeSingle();
          if (errUpdateRow) throw errUpdateRow;
          if (!updateRow) throw new Error("Data kembalikan tidak ditemukan di keduanya!");
          // gunakan updateRow sebagai sumber
          const insertDataFromUpdate = {
            ...updateRow,
            status_verifikasi: "disetujui",
            jenis_update: "tambah",
          };
          delete insertDataFromUpdate.id;
          const { error: errInsertFromUpdate } = await supabase
            .from("data_penduduk")
            .insert([insertDataFromUpdate]);
          if (errInsertFromUpdate) throw errInsertFromUpdate;
        } else {
          // Insert ke data_penduduk dengan field-field penting
          const insertData = {
            nik: dataKematian.nik,
            nama: dataKematian.nama,
            no_kk: dataKematian.no_kk || null,
            tempat_lahir: dataKematian.tempat_lahir || null,
            tanggal_lahir: dataKematian.tanggal_lahir || null,
            jk: dataKematian.jk || null,
            agama: dataKematian.agama || null,
            status_perkawinan: dataKematian.status_perkawinan || null,
            pendidikan: dataKematian.pendidikan || null,
            pekerjaan: dataKematian.pekerjaan || null,
            alamat: dataKematian.alamat || null,
            rt: dataKematian.rt || null,
            rw: dataKematian.rw || null,
            status_keluarga: dataKematian.status_keluarga || null,
            nik_ayah: dataKematian.nik_ayah || null,
            nama_ayah: dataKematian.nama_ayah || null,
            nik_ibu: dataKematian.nik_ibu || null,
            nama_ibu: dataKematian.nama_ibu || null,
            desa: dataKematian.desa || null,
            kecamatan: dataKematian.kecamatan || null,
            kabupaten: dataKematian.kabupaten || null,
            provinsi: dataKematian.provinsi || null,
            kode_pos: dataKematian.kode_pos || null,
            pekerjaan_ayah: dataKematian.pekerjaan_ayah || null,
            tanggal_lahir_ayah: dataKematian.tanggal_lahir_ayah || null,
            tanggal_lahir_ibu: dataKematian.tanggal_lahir_ibu || null,
            status_verifikasi: "disetujui",
            updated_at: new Date().toISOString(),
          };

          const { error: errInsert } = await supabase
            .from("data_penduduk")
            .insert([insertData]);
          if (errInsert) throw errInsert;
        }

        // Hapus data dari data_kematian (jika ada)
        const { error: errDelK } = await supabase
          .from("data_kematian")
          .delete()
          .eq("nik", item.nik);
        if (errDelK) {
          // non-fatal: log only
          console.warn("Gagal hapus dari data_kematian (non fatal):", errDelK);
        }

        // Hapus usulan dari data_kematian_update
        const { error: errDeleteUpdate2 } = await supabase
          .from("data_kematian_update")
          .delete()
          .eq("id", item.id);
        if (errDeleteUpdate2) throw errDeleteUpdate2;

        alert("✅ Data berhasil dikembalikan ke data penduduk!");
      }

      await fetchUsulan(activeTab); // refresh tabel
    } catch (err) {
      console.error(err);
      alert("❌ Gagal memproses: " + (err.message || JSON.stringify(err)));
    } finally {
      setLoadingId(null);
      // close any open previews for cleanliness
      setShowDeletePreview(false);
    }
  };

  const handleApprove = (item) => {
    if (activeTab === "add") return handleApproveAdd(item);
    if (activeTab === "edit") return handleApproveEdit(item);
    if (activeTab === "delete") return handleApproveDelete(item);
  };

  // === REJECT ===
  const handleReject = async () => {
    if (!alasanPenolakan.trim()) return alert("Isi alasan penolakan!");
    const item = selectedItem;
    if (!item) return alert("Tidak ada data yang dipilih!");

    try {
      setLoadingId(item.id);

      const alasan = alasanPenolakan.trim();
      const now = new Date().toISOString();

      // === 1️⃣ Jika jenis_update = "tambah kematian" ===
      if (item.jenis_update === "tambah kematian") {
        const { data: existing, error: errExist } = await supabase
          .from("data_kematian")
          .select("*")
          .eq("nik", item.nik)
          .maybeSingle();
        if (errExist) throw errExist;

        const payload = {
          ...item,
          alasan_penolakan: alasan,
          status_verifikasi: "disetujui",
          updated_at: now,
        };
        delete payload.id;

        if (existing) {
          const { error } = await supabase
            .from("data_kematian")
            .update(payload)
            .eq("nik", item.nik);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("data_kematian")
            .insert([payload]);
          if (error) throw error;
        }

        await supabase.from("data_kematian_update").delete().eq("id", item.id);
        alert("✅ Data berhasil ditolak!");

      // === 2️⃣ Jika jenis_update = "tambah" ===
      } else if (item.jenis_update === "tambah") {
        const { error } = await supabase
          .from("data_penduduk")
          .update({
            status_verifikasi: "disetujui",
            jenis_update: "hapus",
            alasan_penolakan: alasan,
            updated_at: now,
          })
          .eq("nik", item.nik);
        if (error) throw error;

        await supabase.from("data_kematian_update").delete().eq("id", item.id);
        alert("✅ Data berhasil ditolak!");

      // === 3️⃣ Jika jenis_update = "edit", "hapus", atau "kembalikan" ===
      } else if (
        ["edit", "hapus", "kembalikan"].includes(item.jenis_update)
      ) {
        const { error } = await supabase
          .from("data_kematian")
          .update({
            alasan_penolakan: alasan,
            jenis_update: item.jenis_update,
            status_verifikasi: "disetujui",
            updated_at: now,
          })
          .eq("nik", item.nik);
        if (error) throw error;

        await supabase.from("data_kematian_update").delete().eq("id", item.id);
        alert("✅ Data berhasil ditolak!");

      // === 4️⃣ Jika jenis lain (fallback) ===
      } else {
        const { error } = await supabase
          .from("data_kematian")
          .update({
            alasan_penolakan: alasan,
            jenis_update: item.jenis_update || null,
            status_verifikasi: "disetujui",
            updated_at: now,
          })
          .eq("nik", item.nik);
        if (error) throw error;

        await supabase.from("data_kematian_update").delete().eq("id", item.id);
        alert("✅ Data berhasil ditolak!");
      }

      // === Refresh tabel & reset modal ===
      setShowRejectModal(false);
      await fetchUsulan(activeTab);
    } catch (err) {
      console.error("❌ Gagal menolak:", err);
      alert("❌ Gagal menolak usulan: " + (err.message || JSON.stringify(err)));
    } finally {
      setLoadingId(null);
    }
  };

  // === RENDER MODALS ===
  const renderRejectModal = () =>
    showRejectModal && (
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={() => setShowRejectModal(false)}
        />
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
          />
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

  // Preview modals (Edit / Add / Delete)
  // === EDIT PREVIEW DATA KEMATIAN ===
  const renderEditPreviewKematian = () =>
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
              {["nik", "nama", "tanggal_kematian", "tempat_kematian", "sebab"].map((key) => {
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

  // === ADD PREVIEW DATA KEMATIAN ===
  const renderAddPreviewKematian = () =>
    showAddPreview &&
    addPreviewData && (
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowAddPreview(false)}></div>
        <div className="relative bg-white p-6 rounded-lg shadow-lg w-full max-w-3xl z-10 overflow-y-auto max-h-[90vh]">
          <h2 className="text-lg font-semibold mb-4 text-center">Detail Usulan Data Kematian</h2>
          <table className="w-full border border-gray-300 text-sm">
            <tbody>
              {["nik", "nama", "tanggal_kematian", "tempat_kematian", "sebab"].map((key) => (
                <tr key={key}>
                  <td className="border px-2 py-1 font-medium">{key}</td>
                  <td className="border px-2 py-1">{addPreviewData[key] ?? "-"}</td>
                </tr>
              ))}
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

  // === DELETE PREVIEW DATA KEMATIAN ===
  const renderDeletePreviewKematian = () =>
    showDeletePreview &&
    deletePreviewData && (
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDeletePreview(false)}></div>
        <div className="relative bg-white p-6 rounded-lg shadow-lg w-full max-w-3xl z-10 overflow-y-auto max-h-[90vh]">
          <h2 className="text-lg font-semibold mb-4 text-center text-red-700">Detail Data Kematian</h2>
          <table className="w-full border border-gray-300 text-sm">
            <tbody>
              {["nik", "nama", "tanggal_kematian", "tempat_kematian", "sebab"].map((key) => (
                <tr key={key}>
                  <td className="border px-2 py-1 font-medium">{key}</td>
                  <td className="border px-2 py-1">{deletePreviewData[key] ?? "-"}</td>
                </tr>
              ))}
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
            <th className="border px-2 py-1">Tanggal Kematian</th>
            <th className="border px-2 py-1">Tempat</th>
            <th className="border px-2 py-1">Sebab</th>
            <th className="border px-2 py-1">Jenis</th>
            <th className="border px-2 py-1">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {usulan.map((item) => (
            <tr key={item.id}>
              <td className="border px-2 py-1">{item.nik}</td>
              <td className="border px-2 py-1">{item.nama}</td>
              <td className="border px-2 py-1">{item.tanggal_kematian}</td>
              <td className="border px-2 py-1">{item.tempat_kematian}</td>
              <td className="border px-2 py-1">{item.sebab}</td>
              <td className="border px-2 py-1">
                {item.jenis_update === "hapus" ? "Hapus Data" : item.jenis_update === "kembalikan" ? "Kembalikan Data" : item.jenis_update}
              </td>
              <td className="border px-2 py-1 flex gap-1 justify-center">
                {activeTab === "edit" && (
                  <button
                    onClick={() => handleViewEditData(item)}
                    className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                    title="Lihat Perbandingan"
                  >
                    <Eye size={16} />
                  </button>
                )}
                {activeTab === "add" && (
                  <button
                    onClick={() => handleViewAddData(item)}
                    className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                    title="Lihat Detail Tambah"
                  >
                    <Eye size={16} />
                  </button>
                )}
                {activeTab === "delete" && (
                  <button
                    onClick={() => {
                      setSelectedItem(item);
                      handleViewDeleteData(item);
                    }}
                    className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                    title={item.jenis_update === "kembalikan" ? "Lihat Data yang Akan Dikembalikan" : "Lihat Data yang Akan Dihapus"}
                  >
                    <Eye size={16} />
                  </button>
                )}

                <button
                  onClick={() => {
                    setSelectedItem(item);
                    handleApprove(item);
                  }}
                  className="p-1 bg-green-600 text-white rounded hover:bg-green-700"
                  title="Setujui"
                  disabled={loadingId === item.id}
                >
                  <Check size={16} />
                </button>

                <button
                  onClick={() => {
                    setSelectedItem(item);
                    openRejectModal(item);
                  }}
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

  // === MAIN RENDER ===
  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h1 className="text-xl font-semibold mb-4">Persetujuan Data Kematian</h1>

      <div className="flex mb-4 space-x-2">
        {Object.keys(tabToJenis).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded ${activeTab === tab ? "bg-green-600 text-white" : "bg-gray-200"}`}
          >
            {tab === "edit" ? "Edit Data" : tab === "add" ? "Tambah Kematian" : "Hapus Data"}
          </button>
        ))}
      </div>

      {renderTable()}

      {/* Modals: reject + previews */}
      {renderRejectModal()}          {/* Modal untuk alasan penolakan */}
      {renderEditPreviewKematian()}  {/* Modal untuk preview edit */}
      {renderAddPreviewKematian()}   {/* Modal untuk preview tambah */}
      {renderDeletePreviewKematian()}{/* Modal untuk preview hapus/kembalikan */}

    </div>
  );
}

export default Kematian_Update;
