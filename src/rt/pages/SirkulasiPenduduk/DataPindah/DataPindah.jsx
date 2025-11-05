// src/rt/pages/KelolaData/DataPindah.jsx
import React, { useState, useEffect, useRef } from "react";
import { useLocation, Link } from "react-router-dom";
import { Eye, Edit, Trash2, FileText, MessageCircle } from "lucide-react";
import supabase from "../../../../supabaseClient";

function DataPindah() {
  const [allData, setAllData] = useState([]);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [penduduk, setPenduduk] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true); // <-- loading state added
  const [showMessageId, setShowMessageId] = useState(null);
  
  const [formData, setFormData] = useState({
    nik: "",
    nama: "",
    tanggal_pindah: "",
    alasan: "",
  });

  // Autocomplete states
  const [searchPenduduk, setSearchPenduduk] = useState("");
  const [showPendudukDropdown, setShowPendudukDropdown] = useState(false);
  const pendudukDropdownRef = useRef(null);

  // Helper lowercase safe
  const safeLower = (v) => String(v || "").toLowerCase();

  // Location untuk ambil parameter
  const location = useLocation();

  const fetchData = async () => {
    try {
      setLoading(true); // mulai loading

      const params = new URLSearchParams(location.search);
      const keyword = params.get("keyword")?.trim() || "";

      const userRt = localStorage.getItem("userRt");
      const userRw = localStorage.getItem("userRw");

      // Query dasar dengan filter RT/RW
      let query = supabase
        .from("data_pindah")
        .select("*")
        .eq("rt", userRt)
        .eq("rw", userRw)
        .order("id", { ascending: true });

      // Filter keyword jika ada
      if (keyword) {
        query = query.or(`nik.ilike.*${keyword}*,nama.ilike.*${keyword}*`);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching data_pindah:", error);
        setAllData([]);
      } else {
        setAllData(data || []);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      setAllData([]);
    } finally {
      setLoading(false); // selesai loading
    }
  };

  // Jalankan setiap kali halaman atau query berubah
  useEffect(() => {
    fetchData();
  }, [location.search]);

  // Fetch data penduduk untuk autocomplete
  const fetchPenduduk = async () => {
    try {
      const { data, error } = await supabase
        .from("data_penduduk")
        .select("nik,nama")
        .order("nama", { ascending: true });

      if (error) {
        console.error("Error fetching penduduk:", error);
      } else {
        setPenduduk(data || []);
      }
    } catch (err) {
      console.error("Unexpected error fetching penduduk:", err);
    }
  };

  // Jalankan ulang setiap kali URL berubah
  useEffect(() => {
    fetchData();
    fetchPenduduk();
  }, [location.search]);

  // Close dropdown penduduk saat klik di luar
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (pendudukDropdownRef.current && !pendudukDropdownRef.current.contains(e.target)) {
        setShowPendudukDropdown(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const totalPages = Math.ceil(allData.length / entriesPerPage);
  const displayedData = allData.slice(
    (currentPage - 1) * entriesPerPage,
    currentPage * entriesPerPage
  );

  const handlePrevious = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  // Hapus satu data
  const handleHapus = async (id) => {
    const { error } = await supabase
      .from("data_pindah")
      .delete()
      .eq("id", id);

    if (error) {
      alert("Gagal menghapus data: " + error.message);
    } else {
      setAllData(allData.filter((item) => item.id !== id));
      alert("Data berhasil dihapus permanen!");
    }
  };

  const handleKembalikan = async (item) => {
    try {
      const newData = {
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
        desa: item.desa,
        kecamatan: item.kecamatan,
        kabupaten: item.kabupaten,
      };

      const { error: insertError } = await supabase
        .from("data_penduduk")
        .insert([newData]);

      if (insertError) throw insertError;

      const { error: deleteError } = await supabase
        .from("data_pindah")
        .delete()
        .eq("id", item.id);

      if (deleteError) throw deleteError;

      setAllData(allData.filter((data) => data.id !== item.id));
      alert("Data berhasil dikembalikan!");
    } catch (error) {
      alert("Gagal mengembalikan data: " + error.message);
    }
  };

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedData, setSelectedData] = useState(null);
  const [selectedAction, setSelectedAction] = useState("");

  const openDeleteModal = (item) => {
    setSelectedData(item);
    setIsDeleteModalOpen(true);
  };

  // Toggle pilih satu baris
  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Toggle pilih semua baris
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedIds([]);
      setSelectAll(false);
    } else {
      const allIds = displayedData.map((item) => item.id);
      setSelectedIds(allIds);
      setSelectAll(true);
    }
  };

const handleMultiConfirm = async () => {
  try {
    if (!selectedAction) {
      alert("Pilih salah satu aksi terlebih dahulu!");
      return;
    }

    if (selectedIds.length === 0) {
      alert("Pilih minimal satu data!");
      return;
    }

    const jenisUpdate = selectedAction === "hapus" ? "hapus" : "kembalikan";

    // 🔹 Ambil data yang dipilih
    const selectedItems = allData.filter((d) => selectedIds.includes(d.id));

    // 🔹 Siapkan insert ke data_pindah_update
    const insertData = selectedItems.map((item) => ({
      id_penduduk: item.id_penduduk,
      no_kk: item.no_kk,
      nik: item.nik,
      nama: item.nama,
      tempat_lahir: item.tempat_lahir || null,
      tanggal_lahir: item.tanggal_lahir || null,
      jk: item.jk || null,
      agama: item.agama || null,
      status_perkawinan: item.status_perkawinan || null,
      pendidikan: item.pendidikan || null,
      pekerjaan: item.pekerjaan || null,
      alamat: item.alamat || null,
      rt: item.rt || null,
      rw: item.rw || null,
      status_keluarga: item.status_keluarga || null,
      nik_ayah: item.nik_ayah || null,
      nama_ayah: item.nama_ayah || null,
      tanggal_lahir_ayah: item.tanggal_lahir_ayah || null,
      pekerjaan_ayah: item.pekerjaan_ayah || null,
      nik_ibu: item.nik_ibu || null,
      nama_ibu: item.nama_ibu || null,
      tanggal_lahir_ibu: item.tanggal_lahir_ibu || null,
      golongan_darah: item.golongan_darah || null,
      desa: item.desa || "Margahayu Tengah",
      kecamatan: item.kecamatan || "Margahayu",
      kabupaten: item.kabupaten || "Bandung",
      provinsi: item.provinsi || "Jawa Barat",
      kode_pos: item.kode_pos || "40225",
      tanggal_pindah: item.tanggal_pindah,
      alasan: item.alasan || null,
      alamat_pindah: item.alamat_pindah,
      rt_pindah: item.rt_pindah,
      rw_pindah: item.rw_pindah,
      desa_pindah: item.desa_pindah,
      kecamatan_pindah: item.kecamatan_pindah,
      kabupaten_pindah: item.kabupaten_pindah,
      provinsi_pindah: item.provinsi_pindah || "Jawa Barat",
      kodepos_pindah: item.kodepos_pindah || null,
      jenis_pindah: item.jenis_pindah || null,
      statuskk_tidakpindah: item.statuskk_tidakpindah || null,
      statuskk_pindah: item.statuskk_pindah || null,
      status_verifikasi: "menunggu persetujuan",
      alasan_penolakan: item.alasan_penolakan || null,
      jenis_update: jenisUpdate,
      created_at: new Date().toISOString(),
      alasan_lain: item.alasan_lain || null,
    }));

    const { error: insertError } = await supabase.from("data_pindah_update").insert(insertData);
    if (insertError) throw insertError;

    // 🔹 Update status_verifikasi di data_pindah
    const { error: updateError } = await supabase
      .from("data_pindah")
      .update({ status_verifikasi: "menunggu persetujuan" })
      .in("id_penduduk", selectedItems.map((item) => item.id_penduduk));
    if (updateError) throw updateError;

    // 🔹 Update state lokal
    setAllData((prev) =>
      prev.map((item) =>
        selectedIds.includes(item.id)
          ? { ...item, status_verifikasi: "menunggu persetujuan" }
          : item
      )
    );

    alert("Pengajuan telah dikirim dan menunggu persetujuan admin!");
    setIsMultiModalOpen(false);
    setSelectedAction("");
    setSelectedIds([]);
  } catch (err) {
    alert("Gagal mengirim pengajuan: " + err.message);
  }
};

  const [isMultiModalOpen, setIsMultiModalOpen] = useState(false);

  // Hapus banyak data sekaligus
  const handleDeleteMany = async () => {
    try {
      if (selectedIds.length === 0) {
        alert("Pilih data yang ingin dihapus!");
        return;
      }

      const { error } = await supabase
        .from("data_pindah")
        .delete()
        .in("id", selectedIds);

      if (error) throw error;

      // Update UI
      setAllData(allData.filter((item) => !selectedIds.includes(item.id)));
      setSelectedIds([]);
      setSelectAll(false);
      alert("Data berhasil dihapus!");
    } catch (error) {
      alert("Gagal menghapus data: " + error.message);
    }
  };

  // Hapus banyak data sekaligus
  const handleRestoreMany = async () => {
    try {
      // Ambil semua data yang dipilih dari displayedData
      const dataToRestore = displayedData.filter((item) =>
        selectedIds.includes(item.id)
      );

      // Siapkan format sesuai tabel data_penduduk
      const restoreData = dataToRestore.map((item) => ({
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
        desa: item.desa,
        kecamatan: item.kecamatan,
        kabupaten: item.kabupaten,
      }));

      // Insert data kembali ke data_penduduk
      const { error: insertError } = await supabase
        .from("data_penduduk")
        .insert(restoreData);

      if (insertError) throw insertError;

      // Hapus data dari data_pindah
      const { error: deleteError } = await supabase
        .from("data_pindah")
        .delete()
        .in("id", selectedIds);

      if (deleteError) throw deleteError;

      // Update tampilan UI
      setAllData(allData.filter((item) => !selectedIds.includes(item.id)));
      setSelectedIds([]);
      setSelectAll(false);
      alert("Data berhasil dikembalikan!");
    } catch (error) {
      alert("Gagal mengembalikan data: " + error.message);
    }
  };

const handleConfirm = async () => {
  try {
    if (!selectedAction) {
      alert("Pilih salah satu aksi terlebih dahulu!");
      return;
    }

    const jenisUpdate = selectedAction === "hapus" ? "hapus" : "kembalikan";

    // 🔹 Insert ke data_pindah_update semua field
    const { error: insertError } = await supabase.from("data_pindah_update").insert([
      {
        id_penduduk: selectedData.id_penduduk,
        no_kk: selectedData.no_kk,
        nik: selectedData.nik,
        nama: selectedData.nama,
        tempat_lahir: selectedData.tempat_lahir || null,
        tanggal_lahir: selectedData.tanggal_lahir || null,
        jk: selectedData.jk || null,
        agama: selectedData.agama || null,
        status_perkawinan: selectedData.status_perkawinan || null,
        pendidikan: selectedData.pendidikan || null,
        pekerjaan: selectedData.pekerjaan || null,
        alamat: selectedData.alamat || null,
        rt: selectedData.rt || null,
        rw: selectedData.rw || null,
        status_keluarga: selectedData.status_keluarga || null,
        nik_ayah: selectedData.nik_ayah || null,
        nama_ayah: selectedData.nama_ayah || null,
        tanggal_lahir_ayah: selectedData.tanggal_lahir_ayah || null,
        pekerjaan_ayah: selectedData.pekerjaan_ayah || null,
        nik_ibu: selectedData.nik_ibu || null,
        nama_ibu: selectedData.nama_ibu || null,
        tanggal_lahir_ibu: selectedData.tanggal_lahir_ibu || null,
        golongan_darah: selectedData.golongan_darah || null,
        desa: selectedData.desa || "Margahayu Tengah",
        kecamatan: selectedData.kecamatan || "Margahayu",
        kabupaten: selectedData.kabupaten || "Bandung",
        provinsi: selectedData.provinsi || "Jawa Barat",
        kode_pos: selectedData.kode_pos || "40225",
        tanggal_pindah: selectedData.tanggal_pindah,
        alasan: selectedData.alasan || null,
        alamat_pindah: selectedData.alamat_pindah,
        rt_pindah: selectedData.rt_pindah,
        rw_pindah: selectedData.rw_pindah,
        desa_pindah: selectedData.desa_pindah,
        kecamatan_pindah: selectedData.kecamatan_pindah,
        kabupaten_pindah: selectedData.kabupaten_pindah,
        provinsi_pindah: selectedData.provinsi_pindah || "Jawa Barat",
        kodepos_pindah: selectedData.kodepos_pindah || null,
        jenis_pindah: selectedData.jenis_pindah || null,
        statuskk_tidakpindah: selectedData.statuskk_tidakpindah || null,
        statuskk_pindah: selectedData.statuskk_pindah || null,
        status_verifikasi: "menunggu persetujuan", // paksa selalu menunggu
        alasan_penolakan: selectedData.alasan_penolakan || null,
        jenis_update: jenisUpdate,
        created_at: new Date().toISOString(),
        alasan_lain: selectedData.alasan_lain || null,
      },
    ]);

    if (insertError) throw insertError;

    // 🔹 Update status_verifikasi di tabel data_pindah agar UI langsung ⏳
    const { error: updateError } = await supabase
      .from("data_pindah")
      .update({ status_verifikasi: "menunggu persetujuan" })
      .eq("id_penduduk", selectedData.id_penduduk);

    if (updateError) throw updateError;

    setAllData((prevData) =>
      prevData.map((item) =>
        item.id_penduduk === selectedData.id_penduduk
          ? { ...item, status_verifikasi: "menunggu persetujuan" }
          : item
      )
    );

    alert("Pengajuan telah dikirim dan menunggu persetujuan admin!");
    setIsDeleteModalOpen(false);
    setSelectedAction("");
  } catch (err) {
    alert("Gagal mengirim pengajuan: " + err.message);
  }
};

  const openMultiActionModal = () => {
    if (selectedIds.length === 0) {
      alert("Pilih data yang ingin dihapus atau dikembalikan!");
      return;
    }
    setIsMultiModalOpen(true);
  };

// Fungsi handle Tutup popup
const handleCloseMessage = async (id) => {
  try {
    // Hapus alasan penolakan di database
    const { error } = await supabase
      .from("data_pindah")
      .update({ alasan_penolakan: null })
      .eq("id", id);

    if (error) throw error;

    // Update state lokal -> icon & popup hilang langsung
    setShowMessageId(null);
    setAllData((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, alasan_penolakan: null } : item
      )
    );
  } catch (err) {
    console.error("Gagal hapus alasan penolakan:", err.message);
  }
};

const handleDeleteRejected = async (id) => {
  if (!id) return;

  try {
    // update kolom alasan_penolakan jadi null di Supabase
    await supabase
      .from("data_pindah") // ⬅️ pastikan nama tabel sesuai
      .update({ alasan_penolakan: null })
      .eq("id", id);

    // perbarui state lokal biar tampilan langsung berubah
    setAllData((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, alasan_penolakan: null } : item
      )
    );

    setShowMessageId(null); // tutup popup
  } catch (error) {
    console.error("Gagal menghapus alasan penolakan:", error);
  }
};

  return (
    <div className="p-6 bg-white rounded-lg shadow relative">
      {/* Header */}
      <div className="flex items-center bg-green-500 text-white px-4 py-3 rounded-t-lg">
        <FileText className="w-5 h-5 mr-2" />
        <h1 className="text-lg font-semibold">Data Pindah</h1>
      </div>

      {/* Show entries & Tambah Data */}
      <div className="flex justify-between items-center mt-4 mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-sm">Show</span>
          <select
            value={entriesPerPage}
            onChange={(e) => setEntriesPerPage(Number(e.target.value))}
            className="appearance-none bg-gray-200 border rounded px-2 py-1 text-sm pr-6 focus:outline-none"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span className="text-sm">entries</span>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => openMultiActionModal()}
            disabled={selectedIds.length === 0}
            className="flex items-center bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            <Trash2 className="w-5 h-5 mr-2" /> Hapus / Kembalikan Terpilih
          </button>
        </div>
      </div>

      {/* Tabel */}
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-200">
          <thead className="bg-green-700 text-white">
            <tr>
              <th className="px-4 py-2 border text-center">
                <input
                  type="checkbox"
                  checked={selectedIds.length === displayedData.length && displayedData.length > 0}
                  onChange={toggleSelectAll}
                />
              </th>
              <th className="px-4 py-2 border">No</th>
              <th className="px-4 py-2 border">NIK</th>
              <th className="px-4 py-2 border">No KK</th>
              <th className="px-4 py-2 border">Nama</th>
              <th className="px-4 py-2 border">Tanggal Pindah</th>
              <th className="px-4 py-2 border">Alamat Pindah</th>
              <th className="px-4 py-2 border">Alasan</th>
              <th className="px-4 py-2 border">Aksi</th>
            </tr>
          </thead>
         <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="text-center py-6 text-gray-600">
                  <div className="inline-flex items-center">
                    {/* simple spinner */}
                    <svg
                      className="animate-spin h-5 w-5 mr-3"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      ></path>
                    </svg>
                    Memuat...
                  </div>
                </td>
              </tr>
            ) : (
              <> 
                {[...displayedData]
                  .sort((a, b) => b.id - a.id)
                  .map((item, index) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 border text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(item.id)}
                          onChange={() => toggleSelect(item.id)}
                        />
                      </td>
                      <td className="px-4 py-2 border text-center">
                        {(currentPage - 1) * entriesPerPage + index + 1}
                      </td>
                      <td className="px-4 py-2 border">{item.nik}</td>
                      <td className="px-4 py-2 border">{item.no_kk}</td>
                      <td className="px-4 py-2 border">{item.nama}</td>
                      <td className="px-4 py-2 border">{item.tanggal_pindah}</td>

                      {/* Alamat Pindah */}
                      <td className="px-4 py-2 border">
                        {[
                          item.alamat_pindah,
                          item.rt_pindah ? `RT ${item.rt_pindah}` : "",
                          item.rw_pindah ? `RW ${item.rw_pindah}` : "",
                          item.desa_pindah,
                          item.kecamatan_pindah,
                          item.kabupaten_pindah,
                          item.provinsi_pindah,
                          item.kodepos_pindah
                        ]
                          .filter(Boolean) // hapus yg null/undefined/kosong
                          .join(", ")}
                      </td>
                      <td className="px-4 py-2 border">
                        {item.alasan && item.alasan.toLowerCase().includes("lainnya")
                          ? (item.alasan_lain && item.alasan_lain.trim() !== "" ? item.alasan_lain : "Lainnya")
                          : item.alasan}
                      </td>
                      <td className="px-4 py-2 border text-center relative overflow-visible">
                        <div className="flex justify-center items-center space-x-2">

                          {/* Status menunggu persetujuan */}
                          {item.status_verifikasi?.toLowerCase() === "menunggu persetujuan" && (
                            <span
                              title="Menunggu persetujuan admin"
                              className="text-yellow-500 animate-pulse ml-1"
                            >
                              ⏳
                            </span>
                          )}

                          {/* Pesan penolakan */}
                          {(item.alasan_penolakan ||
                            (item.status_verifikasi &&
                              item.status_verifikasi.toLowerCase() === "ditolak")) && (
                            <div className="relative inline-block">
                              <button
                                onClick={() =>
                                  setShowMessageId((prev) => (prev === item.id ? null : item.id))
                                }
                                title="Lihat alasan penolakan"
                                className="text-red-600 hover:text-red-800 p-2 rounded-full z-20"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </button>

                              {/* POPUP INLINE */}
                              {showMessageId === item.id && (
                                <div className="absolute top-full mt-1 left-5/2 -translate-x-1/2 min-w-[11rem] bg-white border border-gray-300 rounded-xl shadow-md z-50 p-3 text-center">
                                  <h3 className="font-semibold text-gray-800 text-sm mb-2">
                                    Alasan dari admin:{" "}
                                    <span className="font-normal text-gray-700">
                                      <br />{item.alasan_penolakan || "-"}
                                    </span>
                                  </h3>

                                  <button
                                    onClick={() => handleDeleteRejected(item.id)}
                                    className="mt-2 w-full bg-red-600 text-white text-sm py-1 rounded hover:bg-red-700 transition font-medium"
                                  >
                                    Tutup
                                  </button>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Lihat detail */}
                          <Link
                            to={`/rt/sirkulasipenduduk/datapindah/${item.id}`}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-full"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>

                          {/* Edit */}
                          <Link
                            to={`/rt/sirkulasipenduduk/datapindah/editpindah/${item.id}`}
                            className="p-2 text-yellow-600 hover:bg-yellow-100 rounded-full"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>

                          {/* Hapus */}
                          <button
                            onClick={() => openDeleteModal(item)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-full"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                {displayedData.length === 0 && (
                  <tr>
                    <td colSpan={9} className="text-center py-4 text-gray-500">
                      Tidak ada data
                    </td>
                  </tr>
                )}
              </>
            )}
          </tbody>

        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <span className="text-sm">
          {loading ? (
            "Memuat..."
          ) : (
            <>
              Showing {(currentPage - 1) * entriesPerPage + 1} to {Math.min(currentPage * entriesPerPage, allData.length)} of {allData.length} entries
            </>
          )}
        </span>
        <div className="space-x-2 flex items-center">
          <button
            onClick={handlePrevious}
            disabled={currentPage === 1 || loading}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
            <button
              key={num}
              onClick={() => setCurrentPage(num)}
              disabled={loading}
              className={`px-3 py-1 rounded ${
                currentPage === num ? "bg-blue-500 text-white" : "bg-gray-200"
              }`}
            >
              {num}
            </button>
          ))}
          <button
            onClick={handleNext}
            disabled={currentPage === totalPages || totalPages === 0 || loading}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {isDeleteModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          {/* Background hitam */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsDeleteModalOpen(false)}
          />

          {/* Konten modal */}
          <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md p-6 z-10">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Pilih Aksi</h2>
            <p className="text-gray-600 mb-4">
              Apa yang ingin dilakukan dengan data <b>{selectedData?.nama}</b>?
            </p>

            {/* Pilihan Radio */}
            <div className="space-y-3 mb-6">
              <label className="flex items-center gap-3">
                <input
                  type="radio"
                  name="aksi"
                  value="hapus"
                  checked={selectedAction === "hapus"}
                  onChange={(e) => setSelectedAction(e.target.value)}
                  className="w-4 h-4"
                />
                <span className="text-red-600 font-medium">Hapus Permanen</span>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="radio"
                  name="aksi"
                  value="kembalikan"
                  checked={selectedAction === "kembalikan"}
                  onChange={(e) => setSelectedAction(e.target.value)}
                  className="w-4 h-4"
                />
                <span className="text-green-600 font-medium">Kembalikan ke Data Penduduk</span>
              </label>
            </div>

            {/* Tombol aksi */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
              >
                Batal
              </button>
              <button
                onClick={handleConfirm}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Konfirmasi
              </button>
            </div>
          </div>
        </div>
      )}

      {isMultiModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          {/* Background hitam */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsMultiModalOpen(false)}
          />

          {/* Konten modal */}
          <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md p-6 z-10">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Pilih Aksi</h2>
            <p className="text-gray-600 mb-4">
              Anda memilih <b>{selectedIds.length}</b> data. Apa yang ingin dilakukan?
            </p>

            {/* Radio Pilihan */}
            <div className="space-y-3 mb-6">
              <label className="flex items-center gap-3">
                <input
                  type="radio"
                  name="multiAction"
                  value="hapus"
                  checked={selectedAction === "hapus"}
                  onChange={(e) => setSelectedAction(e.target.value)}
                  className="w-4 h-4"
                />
                <span className="text-red-600 font-medium">Hapus Permanen</span>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="radio"
                  name="multiAction"
                  value="kembalikan"
                  checked={selectedAction === "kembalikan"}
                  onChange={(e) => setSelectedAction(e.target.value)}
                  className="w-4 h-4"
                />
                <span className="text-green-600 font-medium">Kembalikan ke Data Penduduk</span>
              </label>
            </div>

            {/* Tombol Aksi */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsMultiModalOpen(false)}
                className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
              >
                Batal
              </button>
              <button
                onClick={handleMultiConfirm}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Konfirmasi
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default DataPindah;
