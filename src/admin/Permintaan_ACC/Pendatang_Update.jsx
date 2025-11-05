// src/rt/pages/KelolaData/Pendatang_Update.jsx
import React, { useState, useEffect } from "react";
import { Check, X, Eye, Edit, Trash2, MessageCircle } from "lucide-react";
import supabase from "../../supabaseClient";

function Pendatang_Update() {
  const [activeTab, setActiveTab] = useState("edit"); // urutan: edit | add | delete
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

  const [showMessageId, setShowMessageId] = useState(null);
  const [loadingId, setLoadingId] = useState(null);

  const tabToJenis = {
    edit: "edit",
    add: "tambah",
    delete: "hapus",
  };

  // === FETCH USULAN BERDASARKAN TAB ===
  const fetchUsulan = async (tab) => {
    setLoading(true);
    try {
      let query = supabase.from("data_pendatang_update").select("*");

      if (tab === "edit") query = query.eq("jenis", "edit");
      else if (tab === "add") query = query.eq("jenis", "tambah");
      else if (tab === "delete") query = query.eq("jenis", "hapus");

      // hanya menampilkan yang menunggu persetujuan
      const { data, error } = await query.eq("status_verifikasi", "menunggu persetujuan");
      if (error) throw error;

      setUsulan(data || []);
    } catch (err) {
      console.error("Gagal memuat data:", err);
      setUsulan([]);
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
      // old data dari data_pendatang (main table)
      const { data: oldData, error: errOld } = await supabase
        .from("data_pendatang")
        .select("*")
        .eq("id", item.id_pendatang)
        .maybeSingle();
      if (errOld && errOld.code !== "PGRST116") throw errOld;

      // new data dari data_pendatang_update
      const { data: newData, error: errNew } = await supabase
        .from("data_pendatang_update")
        .select("*")
        .eq("id", item.id)
        .single();
      if (errNew) throw errNew;

      const fields = [
        "no_kk",
        "nik",
        "nama",
        "tempat_lahir",
        "tanggal_lahir",
        "jk",
        "agama",
        "status_perkawinan",
        "pendidikan",
        "pekerjaan",
        "alamat",
        "rt",
        "rw",
        "desa",
        "kecamatan",
        "kabupaten",
        "provinsi",
        "kode_pos",
        "nik_ayah",
        "nama_ayah",
        "nik_ibu",
        "nama_ibu",
        "golongan_darah",
      ];

      const oldFiltered = {};
      const newFiltered = {};
      fields.forEach((f) => {
        oldFiltered[f] = oldData?.[f] ?? "-";
        newFiltered[f] = newData?.[f] ?? "-";
      });

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
        .from("data_pendatang_update")
        .select("*")
        .eq("id", item.id)
        .single();
        if (error) throw error;

        // Hapus field yang tidak ingin ditampilkan
        const { jenis_update, alasan_penolakan, ...filteredData } = data;

        setAddPreviewData(filteredData);
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
        .from("data_pendatang")
        .select("*")
        .eq("id", item.id_pendatang)
        .maybeSingle();
      if (error) throw error;

      setDeletePreviewData(data);
      setShowDeletePreview(true);
    } catch (err) {
      console.error("Gagal ambil data hapus:", err);
      alert("Gagal menampilkan data yang akan dihapus.");
    }
  };

  // === APPROVE (PANGGIL SESUAI TAB) ===
  const handleApprove = async (item) => {
    if (activeTab === "edit") return handleApproveEdit(item);
    if (activeTab === "add") return handleApproveAdd(item);
    if (activeTab === "delete") return handleApproveDelete(item);
  };

  // === APPROVE EDIT ===
const handleApproveEdit = async (item) => {
  try {
    setLoadingId(item.id);

    // 1️⃣ Ambil data usulan dari data_pendatang_update
    const { data: updateRow, error } = await supabase
      .from("data_pendatang_update")
      .select("*")
      .eq("id", item.id)
      .single();
    if (error) throw error;

    // 2️⃣ Siapkan payload data yang akan diupdate
    const payload = {
      no_kk: updateRow.no_kk,
      nik: updateRow.nik,
      nama: updateRow.nama,
      tempat_lahir: updateRow.tempat_lahir,
      tanggal_lahir: updateRow.tanggal_lahir,
      jk: updateRow.jk,
      agama: updateRow.agama,
      status_perkawinan: updateRow.status_perkawinan,
      pendidikan: updateRow.pendidikan,
      pekerjaan: updateRow.pekerjaan,
      alamat: updateRow.alamat,
      rt: updateRow.rt,
      rw: updateRow.rw,
      status_keluarga: updateRow.status_keluarga,
      nik_ayah: updateRow.nik_ayah,
      nama_ayah: updateRow.nama_ayah,
      nik_ibu: updateRow.nik_ibu,
      nama_ibu: updateRow.nama_ibu,
      golongan_darah: updateRow.golongan_darah,
      desa: updateRow.desa,
      kecamatan: updateRow.kecamatan,
      kabupaten: updateRow.kabupaten,
      provinsi: updateRow.provinsi,
      kode_pos: updateRow.kode_pos,
      updated_at: new Date(),
    };

    // 3️⃣ Update tabel utama data_pendatang
    if (updateRow.id_pendatang) {
      const { error: errUpd } = await supabase
        .from("data_pendatang")
        .update(payload)
        .eq("id", updateRow.id_pendatang);
      if (errUpd) throw errUpd;
    }

    // 4️⃣ Update status verifikasi data_pendatang
    await supabase
      .from("data_pendatang")
      .update({
        status_verifikasi: "disetujui",
        alasan_penolakan: null,
      })
      .eq("id", updateRow.id_pendatang);

    // 5️⃣ Sinkronkan ke data_penduduk
    // Coba update data_penduduk dengan NIK yang sama (karena unique key)
    const { data: existingPenduduk } = await supabase
      .from("data_penduduk")
      .select("id_penduduk")
      .eq("nik", updateRow.nik)
      .single();

    if (existingPenduduk) {
      // Jika sudah ada → update
      const { error: errUpdPenduduk } = await supabase
        .from("data_penduduk")
        .update({
          ...payload,
          status_verifikasi: "disetujui",
          alasan_penolakan: null,
          updated_at: new Date(),
        })
        .eq("nik", updateRow.nik);
      if (errUpdPenduduk) throw errUpdPenduduk;
    } else {
      // Jika belum ada → insert baru ke data_penduduk
      const { error: errInsPenduduk } = await supabase
        .from("data_penduduk")
        .insert([
          {
            ...payload,
            status_verifikasi: "disetujui",
            alasan_penolakan: null,
            created_at: new Date(),
          },
        ]);
      if (errInsPenduduk) throw errInsPenduduk;
    }

    // 6️⃣ Hapus usulan dari data_pendatang_update
    const { error: errDel } = await supabase
      .from("data_pendatang_update")
      .delete()
      .eq("id", item.id);
    if (errDel) throw errDel;

    // 7️⃣ Update tampilan tanpa refresh (optional)
    setAllData((prev) => prev.filter((x) => x.id !== item.id));

    alert("✅ Data berhasil disetujui!");
    fetchUsulan(activeTab);
  } catch (err) {
    console.error("Gagal menyetujui edit:", err);
    alert("❌ Gagal menyetujui edit: " + (err.message || err));
  } finally {
    setLoadingId(null);
  }
};
const [allData, setAllData] = useState([]);

  // === APPROVE ADD ===
  const handleApproveAdd = async (item) => {
    try {
      setLoadingId(item.id);

      // Ambil data usulan
      const { data: newData, error } = await supabase
        .from("data_pendatang_update")
        .select("*")
        .eq("id", item.id)
        .single();
      if (error) throw error;

      // 1️⃣ Masukkan/konfirmasi ke data_pendatang utama
      const pendatangPayload = {
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
        desa: newData.desa ?? "Margahayu Tengah",
        kecamatan: newData.kecamatan ?? "Margahayu",
        kabupaten: newData.kabupaten ?? "Bandung",
        provinsi: newData.provinsi ?? "Jawa Barat",
        kode_pos: newData.kode_pos ?? "40225",
        tanggal_datang: newData.tanggal_datang,
        golongan_darah: newData.golongan_darah,
        status_verifikasi: "disetujui",
        alasan_penolakan: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Jika ada id_pendatang (artinya row utama sudah ada), update. Jika tidak ada, insert.
      if (newData.id_pendatang) {
        const { error: errUpd } = await supabase
          .from("data_pendatang")
          .update(pendatangPayload)
          .eq("id", newData.id_pendatang);
        if (errUpd) throw errUpd;
      } else {
        const { data: inserted, error: errInsert } = await supabase
          .from("data_pendatang")
          .insert([pendatangPayload])
          .select();
        if (errInsert) throw errInsert;

        // jika insert berhasil, kita bisa dapatkan id baru — tapi tidak wajib
      }

      // 2️⃣ Mapping ke data_penduduk (input permanen ke penduduk)
      const nik = newData.nik?.toString().trim();
      if (nik) {
        const pendudukPayload = {
          no_kk: newData.no_kk,
          nik,
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
          status_keluarga: newData.status_keluarga ?? null,
          nik_ayah: newData.nik_ayah,
          nama_ayah: newData.nama_ayah,
          nik_ibu: newData.nik_ibu,
          nama_ibu: newData.nama_ibu,
          desa: newData.desa ?? "Margahayu Tengah",
          kecamatan: newData.kecamatan ?? "Margahayu",
          kabupaten: newData.kabupaten ?? "Bandung",
          provinsi: newData.provinsi ?? "Jawa Barat",
          kode_pos: newData.kode_pos ?? "40225",
          golongan_darah: newData.golongan_darah,
          status_verifikasi: "disetujui",
          alasan_penolakan: null,
          created_at: new Date(),
          updated_at: new Date(),
        };

        // cek apakah sudah ada di data_penduduk
        const { data: existingPenduduk, error: errCheck } = await supabase
          .from("data_penduduk")
          .select("*")
          .eq("nik", nik)
          .maybeSingle();
        if (errCheck) throw errCheck;

        if (existingPenduduk) {
          const { error: errUpdPend } = await supabase
            .from("data_penduduk")
            .update(pendudukPayload)
            .eq("nik", nik);
          if (errUpdPend) throw errUpdPend;
        } else {
          const { error: errInsertPend } = await supabase
            .from("data_penduduk")
            .insert([pendudukPayload]);
          if (errInsertPend) throw errInsertPend;
        }
      }

      // 3️⃣ Hapus usulan
      const { error: errDelete } = await supabase
        .from("data_pendatang_update")
        .delete()
        .eq("id", item.id);
      if (errDelete) throw errDelete;

      alert("✅ Usulan pendatang berhasil disetujui!");
      fetchUsulan(activeTab);
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
      setLoadingId(item.id);

      // ambil dulu row usulan untuk memastikan id_pendatang target
      const { data: upd, error: errUpd } = await supabase
        .from("data_pendatang_update")
        .select("*")
        .eq("id", item.id)
        .single();
      if (errUpd) throw errUpd;

      // hapus di tabel utama (pakai id_pendatang jika ada, atau nik)
      if (upd.id_pendatang) {
        const { error: errDel } = await supabase.from("data_pendatang").delete().eq("id", upd.id_pendatang);
        if (errDel) throw errDel;
      } else {
        const { error: errDel } = await supabase.from("data_pendatang").delete().eq("nik", upd.nik);
        if (errDel) throw errDel;
      }

      // hapus usulan
      const { error: errDelete } = await supabase
        .from("data_pendatang_update")
        .delete()
        .eq("id", item.id);
      if (errDelete) throw errDelete;

      alert("🗑️ Data pendatang berhasil dihapus!");
      fetchUsulan(activeTab);
    } catch (err) {
      console.error("Gagal menyetujui hapus:", err);
      alert("❌ Gagal menyetujui hapus: " + (err.message || err));
    } finally {
      setLoadingId(null);
    }
  };

  // === REJECT ===
    const handleReject = async () => {
    if (!alasanPenolakan.trim()) return alert("Isi alasan penolakan!");
    if (!selectedItem) return alert("Tidak ada data yang dipilih!");

    try {
        const item = selectedItem;

        // 1️⃣ Ambil data usulan dari data_pendatang_update
        const { data: usulan, error: errUsulan } = await supabase
        .from("data_pendatang_update")
        .select("*")
        .eq("id", item.id)
        .single();

        if (errUsulan) throw errUsulan;
        if (!usulan) {
        alert("Data usulan tidak ditemukan!");
        return;
        }

        // 2️⃣ Pastikan id_pendatang tersedia (karena update ke tabel utama)
        if (!usulan.id_pendatang) {
        alert("❌ Data utama (id_pendatang) tidak ditemukan!");
        return;
        }

        // 3️⃣ Update data utama di tabel data_pendatang
        const { error: errUpdate } = await supabase
        .from("data_pendatang")
        .update({
            jenis: usulan.jenis, // ✅ kirim jenis usulan (edit/hapus/tambah)
            status_verifikasi: "disetujui", // ✅ ubah status jadi ditolak
            alasan_penolakan: alasanPenolakan.trim(),
            updated_at: new Date(),
        })
        .eq("id", usulan.id_pendatang); // ✅ pakai id_pendatang (bukan id)

        if (errUpdate) throw errUpdate;

        // 4️⃣ Hapus data usulan dari tabel data_pendatang_update
        const { error: errDelete } = await supabase
        .from("data_pendatang_update")
        .delete()
        .eq("id", item.id);

        if (errDelete) throw errDelete;

        // 5️⃣ Notifikasi & reset UI
        alert("✅ Usulan ditolak dan data utama diperbarui!");
        setShowRejectModal(false);
        setAlasanPenolakan("");
        setSelectedItem(null);
        fetchUsulan(activeTab);
    } catch (err) {
        console.error("Gagal menolak:", err);
        alert("❌ Gagal menolak: " + (err.message || err));
    }
    };

  const handleOpenRejectModal = (item) => {
    setSelectedItem(item);
    setAlasanPenolakan("");
    setShowRejectModal(true);
  };

  // === RENDER MODAL PENOLAKAN ===
  const renderRejectModal = () =>
    showRejectModal && (
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={() => {
            setShowRejectModal(false);
            setAlasanPenolakan("");
            setSelectedItem(null);
          }}
        ></div>

        <div className="relative bg-white p-6 rounded-lg shadow-lg w-full max-w-md z-10">
          <h2 className="text-lg font-semibold mb-4 text-center text-red-600">Alasan Penolakan</h2>
          <textarea
            className="w-full border rounded-lg p-2 text-sm"
            rows="4"
            placeholder="Masukkan alasan penolakan..."
            value={alasanPenolakan}
            onChange={(e) => setAlasanPenolakan(e.target.value)}
          />
          <div className="mt-4 flex justify-end space-x-2">
            <button
              onClick={() => {
                setShowRejectModal(false);
                setAlasanPenolakan("");
                setSelectedItem(null);
              }}
              className="px-3 py-1 bg-gray-300 rounded"
            >
              Batal
            </button>
            <button onClick={handleReject} className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700">Kirim</button>
          </div>
        </div>
      </div>
    );

  // === PREVIEW MODAL FUNCTIONS ===
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
            <button onClick={() => setShowEditPreview(false)} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Tutup</button>
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
          <h2 className="text-lg font-semibold mb-4 text-center">Detail Usulan Pendatang</h2>
          <table className="w-full border border-gray-300 text-sm">
            <tbody>
              {Object.entries(addPreviewData).map(([key, value]) => {
                if (["id","jenis","status_verifikasi","created_at","updated_at","id_pendatang","alasan_penolakan"].includes(key)) return null;
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
            <button onClick={() => setShowAddPreview(false)} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Tutup</button>
          </div>
        </div>
      </div>
    );

const renderDeletePreview = () =>
  showDeletePreview &&
  deletePreviewData && (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* Background hitam transparan */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => setShowDeletePreview(false)}
      ></div>

      {/* Konten modal */}
      <div className="relative bg-white p-6 rounded-lg shadow-lg w-full max-w-3xl z-10 overflow-y-auto max-h-[90vh]">
        <h2 className="text-lg font-semibold mb-4 text-center text-red-700">
          Detail Data Pendatang
        </h2>

        <table className="w-full border border-gray-300 text-sm">
          <tbody>
            {Object.entries(deletePreviewData || {}).map(([key, value]) => {
              // Skip kolom yang tidak ingin ditampilkan
              if (
                [
                  "id",
                  "created_at",
                  "updated_at",
                  "status_verifikasi",
                  "jenis",
                  "alasan_penolakan",
                  "jenis_update",
                ].includes(key)
              )
                return null;

              return (
                <tr key={key}>
                  <td className="border px-2 py-1 font-medium capitalize">
                    {key.replaceAll("_", " ")}
                  </td>
                  <td className="border px-2 py-1">
                    {value === null || value === "" ? "-" : value}
                  </td>
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

  // === RENDER TABLE ===
  const renderTable = () => {
    if (loading) return <div>Memuat data...</div>;
    if (!usulan.length) return <div>Tidak ada usulan menunggu persetujuan.</div>;

    return (
      <table className="w-full border-collapse text-center">
        <thead>
          <tr className="bg-green-600 text-white">
            <th className="border px-2 py-1">NIK</th>
            <th className="border px-2 py-1">No KK</th>
            <th className="border px-2 py-1">Nama</th>
            <th className="border px-2 py-1">Tanggal Datang</th>
            <th className="border px-2 py-1">JK</th>
            <th className="border px-2 py-1">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {usulan.map((item) => (
            <tr key={item.id} className="hover:bg-gray-100">
              <td className="border px-2 py-1">{item.nik}</td>
              <td className="border px-2 py-1">{item.no_kk}</td>
              <td className="border px-2 py-1">{item.nama}</td>
              <td className="border px-2 py-1">{item.tanggal_datang}</td>
              <td className="border px-2 py-1">{item.jk}</td>
              <td className="border px-2 py-1">
                <div className="inline-flex gap-1 justify-center items-center">
                  <button
                    onClick={() => {
                      if (activeTab === "edit") handleViewEditData(item);
                      else if (activeTab === "add") handleViewAddData(item);
                      else handleViewDeleteData(item);
                    }}
                    className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                    title="Lihat Data"
                  >
                    <Eye size={16} />
                  </button>

                  <button
                    onClick={() => handleApprove(item)}
                    className="p-1 bg-green-600 text-white rounded hover:bg-green-700"
                    title="Setujui"
                    disabled={loadingId === item.id}
                  >
                    <Check size={16} />
                  </button>

                  <button
                    onClick={() => handleOpenRejectModal(item)}
                    className="p-1 bg-red-600 text-white rounded hover:bg-red-700"
                    title="Tolak"
                  >
                    <X size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h1 className="text-xl font-semibold mb-4">Persetujuan Data Pendatang</h1>

      {/* Urutan tab: Edit → Tambah → Hapus */}
      <div className="flex mb-4 space-x-2">
        <button onClick={() => setActiveTab("edit")} className={`px-4 py-2 rounded ${activeTab === "edit" ? "bg-green-600 text-white" : "bg-gray-200 text-gray-800"}`}>Edit Data</button>
        <button onClick={() => setActiveTab("add")} className={`px-4 py-2 rounded ${activeTab === "add" ? "bg-green-600 text-white" : "bg-gray-200 text-gray-800"}`}>Tambah Pendatang</button>
        <button onClick={() => setActiveTab("delete")} className={`px-4 py-2 rounded ${activeTab === "delete" ? "bg-green-600 text-white" : "bg-gray-200 text-gray-800"}`}>Hapus Data</button>
      </div>

      {renderTable()}
      {renderRejectModal()}
      {renderEditPreview()}
      {renderAddPreview()}
      {renderDeletePreview()}
    </div>
  );
}

export default Pendatang_Update;
