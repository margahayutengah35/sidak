// src/rt/pages/KelolaData/DataKematian.jsx
import React, { useState, useEffect, useRef } from "react";
import { useLocation, Link } from "react-router-dom";
import { Eye, Edit, Trash2, FileText, UserPlus, MessageCircle } from "lucide-react";
import supabase from "../../../../supabaseClient";

function DataKematian() {
  const [allData, setAllData] = useState([]);
  const [entriesPerPage, setEntriesPerPage] = useState(500);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isMultiModalOpen, setIsMultiModalOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState("");
  const [loading, setLoading] = useState(false);
  const [showMessageId, setShowMessageId] = useState(null);

  // Modal tambah
  const [isModalOpen, setIsModalOpen] = useState(false);

  const location = useLocation();
  const pendudukDropdownRef = useRef(null);

  const userRt = localStorage.getItem("userRt") || "";
  const userRw = localStorage.getItem("userRw") || "";

  const initialForm = {
    no_kk: "",
    nik: "",
    nama: "",
    tempat_lahir: "",
    tanggal_lahir: "",
    jk: "",
    golongan_darah: "",
    agama: "",
    status_perkawinan: "",
    pendidikan: "",
    pekerjaan: "",
    alamat: "",
    rt: userRt,
    rw: userRw,
    status_keluarga: "",
    nik_ayah: "",
    nama_ayah: "",
    nik_ibu: "",
    nama_ibu: "",
    desa: "Margahayu Tengah",
    kecamatan: "Margahayu",
    kabupaten: "Bandung",
    provinsi: "Jawa Barat",
    kode_pos: "40225",
    // fields khusus kematian
    tanggal_kematian: "",
    hari_kematian: "",
    pukul_kematian: "",
    sebab: "",
    tempat_kematian: "",
  };
  const [formData, setFormData] = useState(initialForm);

  // dropdown/search states used in modal
  const [inputManual, setInputManual] = useState(false);
  const [searchJK, setSearchJK] = useState("");
  const [showJKDropdown, setShowJKDropdown] = useState(false);
  const jkOptions = ["Laki-laki", "Perempuan"];

  const [searchAgama, setSearchAgama] = useState("");
  const [showAgamaDropdown, setShowAgamaDropdown] = useState(false);
  const agamaOptions = [
    "Islam",
    "Kristen",
    "Katolik",
    "Hindu",
    "Buddha",
    "Konghucu",
    "Lainnya",
  ];

  const [searchAlamat, setSearchAlamat] = useState("");
  const [showAlamatDropdown, setShowAlamatDropdown] = useState(false);
  const alamatOptions = [
    "Jl. Sadang",
    "Kp. Sadang",
    "Pasantren",
    "Kp. Pasantren",
    "Kopo Bihbul",
    "Jl. Kopo Bihbul",
    "Nata Endah",
    "Komp. Nata Endah",
    "Taman Kopo Indah",
    "Komp. Taman Kopo Indah",
    "Bbk. Tasikmalaya",
    "Kp. Bbk. Tasikmalaya",
    "Sekeloa Girang",
    "Jl. Sekeloa Girang",
    "Perum Linggahara",
    "Kp. Margamulya",
    "Komp. Nata Endah Gg. Margamulya",
  ];

  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [searchStatus, setSearchStatus] = useState("");
  const statusOptions = ["Kepala Keluarga", "Istri", "Anak", "Lainnya"];

  // penduduk dropdown visibility (dipakai di useEffect close outside click)
  const [showPendudukDropdown, setShowPendudukDropdown] = useState(false);

  // --- Modal Pesan Penolakan ---
  const [showMessage, setShowMessage] = useState(false);
  const [messageContent, setMessageContent] = useState("");

  // fungsi buka modal pesan
  const handleShowMessage = (pesan) => {
    setMessageContent(pesan || "Tidak ada pesan penolakan dari admin.");
    setShowMessage(true);
  };

  // fungsi tutup modal
  const handleCloseMessage = () => {
    setShowMessage(false);
  };

  // -------------------------
  // Fetch utama data_kematian
  // -------------------------
  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(location.search);
      const keyword = (params.get("keyword") || "").trim();

      const userRtLocal = localStorage.getItem("userRt");
      const userRwLocal = localStorage.getItem("userRw");

      let allResults = [];

      if (keyword) {
        const fields = ["nik", "no_kk", "nama"];
        for (let field of fields) {
          const { data, error } = await supabase
            .from("data_kematian")
            .select("*")
            .eq("rt", userRtLocal)
            .eq("rw", userRwLocal)
            .ilike(field, `%${keyword}%`);

          if (!error && data && data.length > 0) allResults.push(...data);
        }

        // Hapus duplikat berdasarkan id
        allResults = Array.from(new Set(allResults.map((x) => x.id))).map(
          (id) => allResults.find((x) => x.id === id)
        );
      } else {
        const { data, error } = await supabase
          .from("data_kematian")
          .select("*")
          .eq("rt", userRtLocal)
          .eq("rw", userRwLocal)
          .order("id", { ascending: true });
        if (!error && data) allResults = data;
      }

      setAllData(allResults || []);
      // reset page to 1 on new fetch (search change)
      setCurrentPage(1);
    } catch (err) {
      console.error("Unexpected error:", err);
      setAllData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]); // fetch ulang jika query string berubah

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (pendudukDropdownRef.current && !pendudukDropdownRef.current.contains(e.target)) {
        setShowPendudukDropdown(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Ensure currentPage within bounds when data or entriesPerPage change
  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(allData.length / entriesPerPage));
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [allData, entriesPerPage]);

  // Reset selection when displayedData changes (avoid stale selections)
  useEffect(() => {
    setSelectedIds([]);
    setSelectAll(false);
  }, [allData, currentPage, entriesPerPage]);

  // Pagination helpers
  const totalPages = Math.max(1, Math.ceil(allData.length / entriesPerPage));
  const displayedData = allData.slice((currentPage - 1) * entriesPerPage, currentPage * entriesPerPage);
  const handlePrevious = () => setCurrentPage((p) => Math.max(1, p - 1));
  const handleNext = () => setCurrentPage((p) => Math.min(totalPages, p + 1));

  // Select / delete
  const toggleSelect = (id) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const toggleSelectAll = () => {
    if (loading) return; // jangan bisa select saat loading
    const idsOnPage = displayedData.map((d) => d.id).filter(Boolean);
    if (selectAll) {
      setSelectedIds([]);
      setSelectAll(false);
    } else {
      setSelectedIds(idsOnPage);
      setSelectAll(true);
    }
  };

  // Modal multi-konfirmasi
const handleMultiConfirm = async () => {
  if (!selectedAction) return alert("Pilih aksi terlebih dahulu!");
  if (selectedIds.length === 0) return alert("Tidak ada data yang dipilih!");

  try {
    setLoading(true);

    // Ambil items yang dipilih dari allData
    const items = selectedIds.map(id => allData.find(x => x.id === id)).filter(Boolean);
    if (items.length === 0) {
      setLoading(false);
      return alert("Data yang dipilih tidak ditemukan.");
    }

    const jenisAction = selectedAction === "hapus" ? "hapus" : "kembalikan";

    // Ambil daftar id_penduduk dari items (untuk cek duplikat di data_kematian_update)
    const pendudukIds = items.map(i => i.id_penduduk).filter(Boolean);
    let existingIds = [];
    if (pendudukIds.length > 0) {
      const { data: existingRes, error: errExisting } = await supabase
        .from("data_kematian_update")
        .select("id_penduduk")
        .in("id_penduduk", pendudukIds);
      if (errExisting) throw errExisting;
      existingIds = (existingRes || []).map(r => r.id_penduduk).filter(Boolean);
    }

    // 1️⃣ Update status_verifikasi & jenis_update di data_kematian
    const { error: updateError } = await supabase
      .from("data_kematian")
      .update({
        status_verifikasi: "menunggu persetujuan",
        jenis_update: jenisAction,
      })
      .in("id", selectedIds);
    if (updateError) throw updateError;

    // 2️⃣ Siapkan payload untuk insert ke data_kematian_update
    const toInsert = [];
    for (const it of items) {
      if (it.id_penduduk && existingIds.includes(it.id_penduduk)) continue;

      const { id: _skipId, created_at: _skipCreated, updated_at: _skipUpdated, ...rest } = it;

      toInsert.push({
        ...rest,
        id_penduduk: it.id_penduduk || null,
        status_verifikasi: "menunggu persetujuan",
        jenis_update:
          jenisAction === "hapus" ? "hapus" : "kembalikan",
      });
    }

    // 3️⃣ Insert batch ke data_kematian_update (jika ada)
    if (toInsert.length > 0) {
      const { error: insertUpdateError } = await supabase
        .from("data_kematian_update")
        .insert(toInsert);
      if (insertUpdateError) throw insertUpdateError;
    } else {
      alert(
        "Beberapa/semua data sudah pernah diusulkan sebelumnya; yang tersisa sudah dikirim sebelumnya."
      );
    }

    // 4️⃣ Update UI lokal
    setAllData(prev =>
      prev.map(x =>
        selectedIds.includes(x.id)
          ? {
              ...x,
              status_verifikasi: "menunggu persetujuan",
              jenis_update: selectedAction,
            }
          : x
      )
    );

    alert(`Data berhasil dikirim untuk persetujuan admin (${selectedAction}).`);
    setSelectedIds([]);
    setSelectedAction("");
    setIsMultiModalOpen(false);
  } catch (err) {
    console.error("Gagal mengirim persetujuan:", err);
    alert("Gagal mengirim persetujuan: " + (err.message || JSON.stringify(err)));
  } finally {
    setLoading(false);
  }
};

  const openDeleteModal = (item) => {
    setSelectedIds([item.id]);
    setSelectedAction("");
    setIsMultiModalOpen(true);
  };

  // Helper date/time
  function getNamaHari(dateString) {
    if (!dateString) return "";
    const [y, m, d] = dateString.split("-");
    const dt = new Date(Number(y), Number(m) - 1, Number(d));
    const hariArray = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    return hariArray[dt.getDay()] || "";
  }

  function formatDateToDDMMYYYY(dateString) {
    if (!dateString) return "";
    const [y, m, d] = dateString.split("-");
    return `${String(d).padStart(2, "0")}-${String(m).padStart(2, "0")}-${y}`;
  }

  function formatTimeHHMM(timeString) {
    if (!timeString) return "";
    const parts = timeString.split(":");
    return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}`;
  }

  // Simpan data kematian (insert ke data_kematian)
  const handleSimpan = async (e) => {
    e?.preventDefault?.();

    try {
      if (!formData.nik || !formData.nama || !formData.tanggal_kematian) {
        return alert("NIK, Nama, dan Tanggal Kematian wajib diisi!");
      }

      const payload = { ...formData };
      Object.keys(payload).forEach((k) => {
        if (payload[k] === "") payload[k] = null;
      });

      payload.rt = payload.rt || userRt || null;
      payload.rw = payload.rw || userRw || null;
      payload.status_verifikasi = "menunggu persetujuan";

      // Data yang akan dikirim ke dua tabel
      const insertData = {
        id_penduduk: payload.id_penduduk || null,
        nik: payload.nik,
        nama: payload.nama,
        no_kk: payload.no_kk || null,
        tempat_lahir: payload.tempat_lahir || null,
        tanggal_lahir: payload.tanggal_lahir || null,
        jk: payload.jk || null,
        agama: payload.agama || null,
        status_perkawinan: payload.status_perkawinan || null,
        pendidikan: payload.pendidikan || null,
        pekerjaan: payload.pekerjaan || null,
        alamat: payload.alamat || null,
        rt: payload.rt,
        rw: payload.rw,
        status_keluarga: payload.status_keluarga || null,
        nik_ayah: payload.nik_ayah || null,
        nama_ayah: payload.nama_ayah || null,
        nik_ibu: payload.nik_ibu || null,
        nama_ibu: payload.nama_ibu || null,
        desa: payload.desa || "Margahayu Tengah",
        kecamatan: payload.kecamatan || "Margahayu",
        kabupaten: payload.kabupaten || "Bandung",
        provinsi: payload.provinsi || "Jawa Barat",
        kode_pos: payload.kode_pos || "40225",
        tanggal_kematian: payload.tanggal_kematian,
        hari_kematian: payload.hari_kematian || null,
        pukul_kematian: payload.pukul_kematian || null,
        tempat_kematian: payload.tempat_kematian || null,
        sebab: payload.sebab || null,
        status_verifikasi: "menunggu persetujuan",
        alasan_penolakan: null,
        jenis_update: "tambah"
      };

      // 1. Insert ke tabel data_kematian
      const { data: dataKematian, error: errorKematian } = await supabase
        .from("data_kematian")
        .insert([insertData])
        .select();

      if (errorKematian) throw errorKematian;

      // 2. Insert ke tabel data_kematian_update
      const { data: dataUpdate, error: errorUpdate } = await supabase
        .from("data_kematian_update")
        .insert([{ ...insertData, jenis_update: "tambah kematian" }])
        .select();

      if (errorUpdate) throw errorUpdate;

      alert("Data kematian berhasil dikirim untuk persetujuan admin!");
      setIsModalOpen(false);

      // Refresh data
      await fetchData();

      // Reset form
      setFormData(initialForm);
      setSearchJK("");
      setSearchAgama("");
      setSearchAlamat("");
      setShowJKDropdown(false);
      setShowAgamaDropdown(false);
      setShowAlamatDropdown(false);
      setShowStatusDropdown(false);
      setInputManual(false);
    } catch (err) {
      console.error("Gagal menyimpan data kematian:", err);
      alert("Gagal menyimpan data: " + (err.message || JSON.stringify(err)));
    }
  };

  // Hapus data terkait pesan penolakan langsung tanpa alert
const handleDeleteRejected = async (id, jenis_update) => {
  if (!id) return;

  try {
    const jenisLower = (jenis_update || "").toString().toLowerCase();

    // Untuk edit, hapus, atau kembalikan → reset alasan_penolakan
    if (jenisLower === "edit" || jenisLower === "hapus" || jenisLower === "kembalikan") {
      await supabase
        .from("data_kematian")
        .update({ alasan_penolakan: null })
        .eq("id", id);

      setAllData((prev) =>
        prev.map((x) =>
          x.id === id ? { ...x, alasan_penolakan: null } : x
        )
      );

      setShowMessage(false);
      setShowMessageId(null);
      return;
    }

    // Untuk tambah / tambah kematian → hapus data
    if (jenisLower === "tambah" || jenisLower === "tambah kematian") {
      const { error } = await supabase.from("data_kematian").delete().eq("id", id);
      if (error) throw error;

      setAllData((prev) => prev.filter((r) => r.id !== id));
      setShowMessageId(null);
      setShowMessage(false);
      return;
    }

    setShowMessage(false);
    setShowMessageId(null);
  } catch (err) {
    console.error("Gagal menghapus data:", err);
  }
};
 
  return (
    <div className="p-6 bg-white rounded-lg shadow relative">
      {/* Header */}
      <div className="flex items-center bg-green-500 text-white px-4 py-3 rounded-t-lg">
        <FileText className="w-5 h-5 mr-2" />
        <h1 className="text-lg font-semibold">Data Kematian</h1>
      </div>

      {/* Controls */}
      <div className="flex justify-between items-center mt-4 mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-sm">Show</span>
          <select
            value={entriesPerPage}
            onChange={(e) => {
              setEntriesPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="appearance-none bg-gray-200 border rounded px-2 py-1 text-sm pr-6 focus:outline-none"
          >
            <option value={500}>500</option>
            <option value={550}>550</option>
            <option value={600}>600</option>
            <option value={650}>650</option>
          </select>
          <span className="text-sm">entries</span>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => setIsMultiModalOpen(true)}
            disabled={selectedIds.length === 0}
            className="flex items-center bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            <Trash2 className="w-5 h-5 mr-2" /> Hapus / Kembalikan
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            <UserPlus className="w-5 h-5 mr-2" /> Tambah Data Kematian
          </button>
        </div>
      </div>

      {/* TABEL */}
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-200">
          <thead className="bg-green-700 text-white">
            <tr>
              <th className="px-4 py-2 border text-center">
                <input
                  type="checkbox"
                  disabled={loading}
                  checked={!loading && displayedData.length > 0 && selectedIds.length === displayedData.filter(d => d.id).length}
                  onChange={toggleSelectAll}
                />
              </th>
              <th className="px-4 py-2 border">No</th>
              <th className="px-4 py-2 border">NIK</th>
              <th className="px-4 py-2 border">No KK</th>
              <th className="px-4 py-2 border">Nama</th>
              <th className="px-4 py-2 border">Hari / Tanggal / Pukul</th>
              <th className="px-4 py-2 border">Sebab</th>
              <th className="px-4 py-2 border">Tempat Kematian</th>
              <th className="px-4 py-2 border">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="text-center py-6 text-gray-600">
                  <div className="inline-flex items-center">
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
                  .map((item, index) => {
                    const hari = item.hari_kematian || getNamaHari(item.tanggal_kematian);
                    const tanggal = item.tanggal_kematian
                      ? formatDateToDDMMYYYY(item.tanggal_kematian)
                      : "";
                    const pukul = item.pukul_kematian
                      ? formatTimeHHMM(item.pukul_kematian)
                      : "";
                    const combined =
                      hari || tanggal || pukul
                        ? `${hari}${tanggal ? `, ${tanggal}` : ""}${pukul ? ` - ${pukul}` : ""}`
                        : "-";

                    return (
                      <tr key={item.id ?? index} className="hover:bg-gray-50">
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
                        <td className="px-4 py-2 border">{combined}</td>
                        <td className="px-4 py-2 border">{item.sebab}</td>
                        <td className="px-4 py-2 border">{item.tempat_kematian}</td>
                        <td className="px-4 py-2 border text-center relative overflow-visible">
                          <div className="flex justify-center items-center space-x-2">

                            {/* ICON MENUNGGU PERSUTUJUAN */}
                            {item.status_verifikasi?.toLowerCase() === "menunggu persetujuan" && (
                              <div title="Menunggu Persetujuan" className="text-orange-500 p-2 rounded-full text-lg animate-pulse">
                                ⏳
                              </div>
                            )}

                            {/* ICON PESAN / PENOLAKAN */}
{(item.alasan_penolakan || (item.status_verifikasi && item.status_verifikasi.toLowerCase() === "ditolak")) && (
  <div className="relative inline-block">
    <button
      title="Lihat alasan penolakan"
      onClick={() =>
        setShowMessageId(prev => (prev === item.id ? null : item.id))
      }
      className="text-red-500 hover:text-red-700 p-2 rounded-full z-20"
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
          onClick={() => handleDeleteRejected(item.id, item.jenis_update)}
          className="mt-2 w-full bg-red-600 text-white text-sm py-1 rounded hover:bg-red-700 transition font-medium"
        >
          Tutup
        </button>
      </div>
    )}
  </div>
)}
                            {/* LIHAT DETAIL */}
                            <Link
                              to={`/rt/sirkulasipenduduk/datakematian/${item.id}`}
                              className="p-2 text-blue-600 hover:bg-blue-100 rounded-full"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>

                            {/* EDIT */}
                            <Link
                              to={`/rt/sirkulasipenduduk/datakematian/editkematian/${item.id}`}
                              className="p-2 text-yellow-600 hover:bg-yellow-100 rounded-full"
                            >
                              <Edit className="w-4 h-4" />
                            </Link>

                            {/* HAPUS */}
                            <button
                              onClick={() => openDeleteModal(item)}
                              className="p-2 text-red-600 hover:bg-red-100 rounded-full"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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
              Showing {allData.length === 0 ? 0 : (currentPage - 1) * entriesPerPage + 1} to {Math.min(currentPage * entriesPerPage, allData.length)} of {allData.length} entries
            </>
          )}
        </span>
        <div className="space-x-2 flex items-center">
          <button onClick={handlePrevious} disabled={loading || currentPage === 1} className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50">Previous</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
            <button key={num} onClick={() => setCurrentPage(num)} disabled={loading} className={`px-3 py-1 rounded ${currentPage === num ? "bg-blue-500 text-white" : "bg-gray-200"}`}>
              {num}
            </button>
          ))}
          <button onClick={handleNext} disabled={loading || currentPage === totalPages || totalPages === 0} className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50">Next</button>
        </div>
      </div>

      {/* Modal Tambah Data */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white rounded-lg shadow-lg w-full max-w-3xl p-6 z-10 overflow-y-auto max-h-[90vh]">
            <h2 className="text-xl font-semibold mb-4">Tambah Data Kematian</h2>

            <form onSubmit={handleSimpan} className="grid grid-cols-2 gap-4">
              {/* Hari / Tanggal / Pukul / Sebab / Tempat */}
              <div className="col-span-2 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Hari</label>
                  <input type="text" value={formData.hari_kematian || ""} readOnly className="border rounded px-3 py-2 w-full bg-gray-100" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Tanggal Kematian</label>
                  <input
                    type="date"
                    value={formData.tanggal_kematian || ""}
                    onChange={(e) => {
                      const tanggal = e.target.value || "";
                      if (!tanggal) {
                        setFormData((prev) => ({ ...prev, tanggal_kematian: "", hari_kematian: "" }));
                        return;
                      }
                      const [y, m, d] = tanggal.split("-");
                      const dt = new Date(Number(y), Number(m) - 1, Number(d));
                      const hariArray = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
                      const namaHari = hariArray[dt.getDay()] || "";
                      setFormData((prev) => ({ ...prev, tanggal_kematian: tanggal, hari_kematian: namaHari }));
                    }}
                    className="border rounded px-3 py-2 w-full"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Pukul</label>
                  <input type="time" value={formData.pukul_kematian || ""} onChange={(e) => setFormData((prev) => ({ ...prev, pukul_kematian: e.target.value }))} className="border rounded px-3 py-2 w-full" required />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Sebab Kematian</label>
                  <input type="text" placeholder="Contoh: Sakit, Kecelakaan, dll" value={formData.sebab || ""} onChange={(e) => setFormData((prev) => ({ ...prev, sebab: e.target.value }))} className="border rounded px-3 py-2 w-full" required />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Tempat Kematian</label>
                  <input type="text" placeholder="Contoh: RS, Klinik, dll" value={formData.tempat_kematian || ""} onChange={(e) => setFormData((prev) => ({ ...prev, tempat_kematian: e.target.value }))} className="border rounded px-3 py-2 w-full" required />
                </div>
              </div>

              {/* Data penduduk */}
              <input type="text" placeholder="Masukkan No KK" value={formData.no_kk || ""} onChange={(e) => setFormData({ ...formData, no_kk: e.target.value })} className="border rounded px-3 py-2" />

              <input type="text" placeholder="NIK" value={formData.nik || ""} onChange={(e) => setFormData({ ...formData, nik: e.target.value })} className="border rounded px-3 py-2" />

              <input type="text" placeholder="Nama" value={formData.nama || ""} onChange={(e) => setFormData({ ...formData, nama: e.target.value })} className="border rounded px-3 py-2" />

              <input type="date" placeholder="Tanggal Lahir" value={formData.tanggal_lahir || ""} onChange={(e) => setFormData({ ...formData, tanggal_lahir: e.target.value })} className="border rounded px-3 py-2" />

              {/* Jenis Kelamin (searchable) */}
              <div className="relative w-full">
                <input type="text" placeholder="-- Pilih Jenis Kelamin --" value={searchJK || formData.jk || ""} onChange={(e) => { setSearchJK(e.target.value); setShowJKDropdown(true); }} onClick={() => setShowJKDropdown(true)} onFocus={() => setShowJKDropdown(true)} onBlur={() => setTimeout(() => setShowJKDropdown(false), 200)} className="border rounded px-3 py-2 w-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-400" />
                {showJKDropdown && (
                  <ul className="absolute z-10 w-full bg-white border rounded shadow max-h-40 overflow-y-auto">
                    {jkOptions.filter((item) => item.toLowerCase().includes((searchJK || "").toLowerCase())).map((item, index) => (
                      <li key={index} onMouseDown={() => { setFormData({ ...formData, jk: item }); setSearchJK(item); setShowJKDropdown(false); }} className="px-3 py-2 hover:bg-green-100 cursor-pointer">{item}</li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Agama */}
              <div className="relative w-full">
                <input type="text" placeholder="-- Pilih Agama --" value={searchAgama || formData.agama || ""} onChange={(e) => { setSearchAgama(e.target.value); setShowAgamaDropdown(true); }} onClick={() => setShowAgamaDropdown(true)} onFocus={() => setShowAgamaDropdown(true)} onBlur={() => setTimeout(() => setShowAgamaDropdown(false), 200)} className="border rounded px-3 py-2 w-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-400" />
                {showAgamaDropdown && (
                  <ul className="absolute z-10 w-full bg-white border rounded shadow max-h-40 overflow-y-auto">
                    {agamaOptions.filter((item) => item.toLowerCase().includes((searchAgama || "").toLowerCase())).map((item, index) => (
                      <li key={index} onMouseDown={() => { setFormData({ ...formData, agama: item }); setSearchAgama(item); setShowAgamaDropdown(false); }} className="px-3 py-2 hover:bg-green-100 cursor-pointer">{item}</li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Alamat (searchable) */}
              <div className="relative w-full">
                <input type="text" placeholder="-- Pilih / Ketik Alamat --" value={searchAlamat || formData.alamat || ""} onChange={(e) => { setSearchAlamat(e.target.value); setFormData({ ...formData, alamat: e.target.value }); setShowAlamatDropdown(true); }} onClick={() => setShowAlamatDropdown(true)} onFocus={() => setShowAlamatDropdown(true)} onBlur={() => setTimeout(() => setShowAlamatDropdown(false), 200)} className="border rounded px-3 py-2 w-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-400" />
                {showAlamatDropdown && (
                  <ul className="absolute z-10 w-full bg-white border rounded shadow max-h-40 overflow-y-auto">
                    {alamatOptions.filter((item) => item.toLowerCase().includes((searchAlamat || "").toLowerCase())).map((item, index) => (
                      <li key={index} onMouseDown={() => { setFormData({ ...formData, alamat: item }); setSearchAlamat(item); setShowAlamatDropdown(false); }} className="px-3 py-2 hover:bg-green-100 cursor-pointer">{item}</li>
                    ))}
                  </ul>
                )}
              </div>

              {/* RT / RW (readonly) */}
              <div className="relative w-full">
                <input type="text" placeholder="RT" value={formData.rt || userRt || ""} readOnly className="border rounded px-3 py-2 w-full bg-gray-100 cursor-not-allowed focus:outline-none" />
              </div>

              <div className="relative w-full">
                <input type="text" placeholder="RW" value={formData.rw || userRw || ""} readOnly className="border rounded px-3 py-2 w-full bg-gray-100 cursor-not-allowed focus:outline-none" />
              </div>

              <input type="text" readOnly value="Margahayu Tengah" className="border rounded px-3 py-2 bg-gray-100" />
              <input type="text" readOnly value="Margahayu" className="border rounded px-3 py-2 bg-gray-100" />
              <input type="text" readOnly value="Bandung" className="border rounded px-3 py-2 bg-gray-100" />
              <input type="text" readOnly value="Jawa Barat" className="border rounded px-3 py-2 bg-gray-100" />
              <input type="text" readOnly value="40225" className="border rounded px-3 py-2 bg-gray-100" />

              <div className="col-span-2 flex justify-end mt-4 space-x-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Batal</button>
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Multi Aksi */}
      {isMultiModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsMultiModalOpen(false)} />
          <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md p-6 z-10">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Pilih Aksi</h2>
            <p className="text-gray-600 mb-4">
              Anda memilih <b>{selectedIds.length}</b> data. Apa yang ingin dilakukan?
            </p>

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

              {/* Cek apakah semua data yang dipilih punya id_penduduk */}
              {selectedIds.some((id) => {
                const item = allData.find((x) => x.id === id);
                return item?.id_penduduk; // jika ada id_penduduk
              }) && (
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
              )}
            </div>

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

export default DataKematian;
