// src/rt/pages/KelolaData/DataKelahiran.jsx
import React, { useState, useEffect, useRef } from "react";
import { useLocation, useSearchParams, Link } from "react-router-dom";
import { MessageCircle, Eye, Edit, Trash2, FileText, UserPlus } from "lucide-react";
import supabase from "../../../../supabaseClient";

function DataKelahiran() {
  const [allData, setAllData] = useState([]);
  const [entriesPerPage, setEntriesPerPage] = useState(500);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showMessageId, setShowMessageId] = useState(null); // now stores id_kelahiran (main table)
  const [activeTab, setActiveTab] = useState("hapus"); // atau tab default

  const [kepalaKeluarga, setKepalaKeluarga] = useState([]); // hanya kepala (untuk dropdown)
  const [allPenduduk, setAllPenduduk] = useState([]); // semua anggota penduduk (dipakai untuk cari istri)
  const [searchKK, setSearchKK] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [showJKDropdown, setShowJKDropdown] = useState(false);
  const [searchJK, setSearchJK] = useState("");
  const jkOptions = ["Laki-laki", "Perempuan"];

  const [showAgamaDropdown, setShowAgamaDropdown] = useState(false);
  const [searchAgama, setSearchAgama] = useState("");
  const agamaOptions = [
    "Islam",
    "Kristen",
    "Katholik",
    "Hindu",
    "Budha",
    "Konghucu",
  ];

  const [formData, setFormData] = useState({
    no_kk: "",
    nik: "",
    nama: "",
    tempat_lahir: "",
    tanggal_lahir: "",
    jk: "",
    agama: "",
    status_perkawinan: "Belum Kawin",
    pendidikan: "Tidak/Belum Sekolah",
    pekerjaan: "Belum/Tidak Bekerja",
    alamat: "",
    rt: "",
    rw: "",
    status_keluarga: "Anak",
    nik_ayah: "",
    nama_ayah: "",
    tanggal_lahir_ayah: "",
    pekerjaan_ayah: "",
    nik_ibu: "",
    nama_ibu: "",
    tanggal_lahir_ibu: "",
    golongan_darah: "",
    desa: "",
    kecamatan: "",
    kabupaten: "",
    provinsi: "",
    kode_pos: "",
  });

  const [searchParams] = useSearchParams();
  const location = useLocation();
  const keyword = searchParams.get("keyword") || "";

  // Loading state for table
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const userRt = localStorage.getItem("userRt");
      const userRw = localStorage.getItem("userRw");

      let query = supabase
        .from("data_kelahiran")
        .select("*")
        .eq("rt", userRt)
        .eq("rw", userRw)
        .order("id_kelahiran", { ascending: true });

      if (keyword) {
        query = query.or(
          `nik.ilike.%${keyword}%,no_kk.ilike.%${keyword}%,nama.ilike.%${keyword}%`
        );
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching data:", error);
        setAllData([]);
      } else {
        setAllData(data || []);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setAllData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [location.search]);

  const fetchKepala = async () => {
    try {
      const userRt = localStorage.getItem("userRt");
      const userRw = localStorage.getItem("userRw");

      const { data, error } = await supabase
        .from("data_penduduk")
        .select("*")
        .eq("rt", userRt)
        .eq("rw", userRw)
        .order("id_penduduk", { ascending: true });

      if (error) throw error;

      // simpan semua anggota untuk lookup istri
      setAllPenduduk(data || []);

      // Grup per no_kk lalu pilih kepala (jika ada) -> untuk dropdown tampilkan kepala
      const grouped = {};
      data.forEach((d) => {
        if (!grouped[d.no_kk]) grouped[d.no_kk] = [];
        grouped[d.no_kk].push(d);
      });

      const withKepala = [];
      const withoutKepala = [];

      Object.values(grouped).forEach((anggota) => {
        const kepala = anggota.find(
          (a) => (a.status_keluarga || "").toLowerCase() === "kepala keluarga"
        );
        if (kepala) {
          withKepala.push(kepala);
        } else {
          const placeholder = { ...anggota[0], nama: `${anggota[0].nama}` };
          withoutKepala.push(placeholder);
        }
      });

      setKepalaKeluarga([...withKepala, ...withoutKepala]);
    } catch (err) {
      console.error("Gagal ambil data kepala/placeholder:", err);
      setKepalaKeluarga([]);
      setAllPenduduk([]);
    }
  };

  useEffect(() => {
    fetchKepala();
  }, []);

  // klik di luar dropdown -> tutup
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Pagination helpers
  const totalPages = Math.ceil(allData.length / entriesPerPage);
  const displayedData = allData.slice(
    (currentPage - 1) * entriesPerPage,
    currentPage * entriesPerPage
  );

  const handlePrevious = () => {
    if (currentPage > 1) setCurrentPage((p) => p - 1);
  };
  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage((p) => p + 1);
  };

  const fetchUsulan = async (tab) => {
  // misal fetch data dari supabase
  const { data, error } = await supabase
    .from("data_kelahiran_update")
    .select("*")
    .eq("status_verifikasi", "menunggu persetujuan");
  if (error) console.error(error);
  else setAllData(data); // misal setAllData menyimpan usulan
};

  // Delete single
const handleHapus = async (item) => {
  const konfirmasi = window.confirm(
    "Apakah Anda yakin ingin menghapus data tersebut?"
  );
  if (!konfirmasi) return;

  try {
    const payloadUpdate = {
      id_kelahiran: item.id_kelahiran || null,
      no_kk: item.no_kk || "-",
      nik: item.nik || "-",
      nama: item.nama || "-",
      tempat_lahir: item.tempat_lahir || null,
      tanggal_lahir: item.tanggal_lahir || new Date().toISOString(),
      jk: item.jk || null,
      agama: item.agama || null,
      status_perkawinan: item.status_perkawinan || "Belum Kawin",
      pendidikan: item.pendidikan || "Tidak/belum sekolah",
      pekerjaan: item.pekerjaan || "Belum/Tidak Bekerja",
      alamat: item.alamat || null,
      rt: item.rt || null,
      rw: item.rw || null,
      desa: item.desa || "Margahayu Tengah",
      kecamatan: item.kecamatan || "Margahayu",
      kabupaten: item.kabupaten || "Bandung",
      provinsi: item.provinsi || "Jawa Barat",
      kode_pos: item.kode_pos || "40225",
      nik_ayah: item.nik_ayah || null,
      nama_ayah: item.nama_ayah || null,
      tanggal_lahir_ayah: item.tanggal_lahir_ayah || null,
      pekerjaan_ayah: item.pekerjaan_ayah || null,
      nik_ibu: item.nik_ibu || null,
      nama_ibu: item.nama_ibu || null,
      tanggal_lahir_ibu: item.tanggal_lahir_ibu || null,
      pekerjaan_ibu: item.pekerjaan_ibu || null,
      status_keluarga: item.status_keluarga || "Anak",
      golongan_darah: item.golongan_darah || null,
      jenis: "hapus",
      status_verifikasi: "menunggu persetujuan",
      created_at: new Date().toISOString(),
    };

    // 🔹 1️⃣ Kirim data ke tabel update
    const { error: insertError } = await supabase
      .from("data_kelahiran_update")
      .insert([payloadUpdate]);
    if (insertError) throw insertError;

    // 🔹 2️⃣ Update data utama
    if (item.id_kelahiran) {
      const { error: updateError } = await supabase
        .from("data_kelahiran")
        .update({
          jenis: "hapus",
          status_verifikasi: "menunggu persetujuan",
          updated_at: new Date().toISOString(),
        })
        .eq("id_kelahiran", item.id_kelahiran);
      if (updateError) throw updateError;
    } else {
      throw new Error("id_kelahiran tidak ditemukan, tidak bisa update data utama.");
    }

    // 🔹 3️⃣ Refresh data usulan & tabel utama
    await fetchUsulan(activeTab);
    await fetchData(); // <--- Tambahkan ini

    alert("✅ Usulan hapus berhasil dikirim untuk persetujuan admin!");
  } catch (err) {
    console.error("Gagal mengusulkan hapus:", err);
    alert("❌ Gagal mengusulkan hapus: " + (err.message || err));
  }
};

  // Toggle select one row (use id_kelahiran)
  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedIds([]);
      setSelectAll(false);
    } else {
      const allIds = displayedData.map((item) => item.id_kelahiran);
      setSelectedIds(allIds);
      setSelectAll(true);
    }
  };

const handleDeleteMany = async () => {
  if (selectedIds.length === 0) {
    alert("Pilih data yang ingin dihapus!");
    return;
  }

  const konfirmasi = window.confirm(
    `Apakah Anda yakin ingin menghapus ${selectedIds.length} data terpilih?`
  );
  if (!konfirmasi) return;

  try {
    for (const id of selectedIds) {
      // 🔹 Ambil data dari allData berdasarkan id_kelahiran
      const item = allData.find((x) => x.id_kelahiran === id);
      if (!item) continue;

      const payloadUpdate = {
        id_kelahiran: item.id_kelahiran || null,
        no_kk: item.no_kk || "-",
        nik: item.nik || "-",
        nama: item.nama || "-",
        tempat_lahir: item.tempat_lahir || null,
        tanggal_lahir: item.tanggal_lahir || new Date().toISOString(),
        jk: item.jk || null,
        agama: item.agama || null,
        status_perkawinan: item.status_perkawinan || "Belum Kawin",
        pendidikan: item.pendidikan || "Tidak/belum sekolah",
        pekerjaan: item.pekerjaan || "Belum/Tidak Bekerja",
        alamat: item.alamat || null,
        rt: item.rt || null,
        rw: item.rw || null,
        desa: item.desa || "Margahayu Tengah",
        kecamatan: item.kecamatan || "Margahayu",
        kabupaten: item.kabupaten || "Bandung",
        provinsi: item.provinsi || "Jawa Barat",
        kode_pos: item.kode_pos || "40225",
        nik_ayah: item.nik_ayah || null,
        nama_ayah: item.nama_ayah || null,
        tanggal_lahir_ayah: item.tanggal_lahir_ayah || null,
        pekerjaan_ayah: item.pekerjaan_ayah || null,
        nik_ibu: item.nik_ibu || null,
        nama_ibu: item.nama_ibu || null,
        tanggal_lahir_ibu: item.tanggal_lahir_ibu || null,
        pekerjaan_ibu: item.pekerjaan_ibu || null,
        status_keluarga: item.status_keluarga || "Anak",
        golongan_darah: item.golongan_darah || null,
        jenis: "hapus",
        status_verifikasi: "menunggu persetujuan",
        created_at: new Date().toISOString(),
      };

      // 1️⃣ Kirim ke tabel data_kelahiran_update
      const { error: insertError } = await supabase
        .from("data_kelahiran_update")
        .insert([payloadUpdate]);
      if (insertError) throw insertError;

      // 2️⃣ Update status di tabel utama
      if (item.id_kelahiran) {
        const { error: updateError } = await supabase
          .from("data_kelahiran")
          .update({
            jenis: "hapus",
            status_verifikasi: "menunggu persetujuan",
            updated_at: new Date().toISOString(),
          })
          .eq("id_kelahiran", item.id_kelahiran);
        if (updateError) throw updateError;
      } else {
        throw new Error(`id_kelahiran tidak ditemukan untuk NIK ${item.nik}`);
      }
    }

    // 3️⃣ Refresh tabel utama (bukan hanya usulan)
    await fetchData(); // <---- ✅ ganti ini
    setSelectedIds([]);
    setSelectAll(false);

    alert(`✅ Usulan hapus ${selectedIds.length} data berhasil dikirim untuk persetujuan admin!`);
  } catch (err) {
    console.error("Gagal mengusulkan hapus banyak:", err);
    alert("❌ Gagal mengusulkan hapus: " + (err.message || err));
  }
};

  // Simpan data kelahiran
  const handleSimpan = async (e) => {
    e.preventDefault();

    if (!formData.no_kk || !formData.nik || !formData.nama || !formData.tanggal_lahir) {
      alert("No KK, NIK, Nama, dan Tanggal Lahir wajib diisi!");
      return;
    }

    // cek duplicate NIK
    const { data: cekNik, error: errCekNik } = await supabase
      .from("data_kelahiran")
      .select("nik")
      .eq("nik", formData.nik);

    if (errCekNik) {
      console.error("Cek NIK error:", errCekNik);
      alert("Gagal memeriksa NIK. Coba lagi.");
      return;
    }

    if (cekNik && cekNik.length > 0) {
      alert("NIK sudah terdaftar di Data Kelahiran!");
      return;
    }

    const dataToInsert = {
      ...formData,
      desa: formData.desa || "Margahayu Tengah",
      kecamatan: formData.kecamatan || "Margahayu",
      kabupaten: formData.kabupaten || "Bandung",
      provinsi: formData.provinsi || "Jawa Barat",
      kode_pos: formData.kode_pos || "40225",
    };

    const { data: inserted, error } = await supabase
      .from("data_kelahiran")
      .insert([dataToInsert])
      .select();

    if (error) {
      console.error("Gagal tambah data:", error);
      alert("Gagal menambahkan data!\n" + (error.message || "Unknown error"));
      return;
    }

    const idKelahiran = inserted && inserted[0] ? inserted[0].id_kelahiran : null;

    const updatePayload = {
      ...dataToInsert,
      id_kelahiran: idKelahiran,
      jenis: "tambah",
      status_verifikasi: "menunggu persetujuan",
    };

    const { error: updateError } = await supabase
      .from("data_kelahiran_update")
      .insert([updatePayload]);

    if (updateError) {
      console.error("Gagal tambah ke data_kelahiran_update:", updateError);
      alert("Data masuk ke data_kelahiran, tapi gagal masuk ke data_kelahiran_update!");
    }

    await fetchData();

    // 🔹 RESET FORM
    setFormData({
      no_kk: "",
      nik: "",
      nama: "",
      tempat_lahir: "",
      tanggal_lahir: "",
      jk: "",
      agama: "",
      status_perkawinan: "Belum Kawin",
      pendidikan: "Tidak/Belum Sekolah",
      pekerjaan: "Belum/Tidak Bekerja",
      alamat: "",
      rt: "",
      rw: "",
      status_keluarga: "Anak",
      nik_ayah: "",
      nama_ayah: "",
      tanggal_lahir_ayah: "",
      pekerjaan_ayah: "",
      nik_ibu: "",
      nama_ibu: "",
      tanggal_lahir_ibu: "",
      golongan_darah: "",
      desa: "",
      kecamatan: "",
      kabupaten: "",
      provinsi: "",
      kode_pos: "",
    });

    // 🔹 RESET INPUT SEARCH UNTUK JK DAN AGAMA
    setSearchJK("");
    setSearchAgama("");

    setIsModalOpen(false);
    alert("Data kelahiran berhasil disimpan dan menunggu persetujuan admin!");
  };

  // Cari nama kepala keluarga berdasarkan no_kk
  const getKepalaKeluarga = (no_kk) => {
    const kk = kepalaKeluarga.find((k) => String(k.no_kk) === String(no_kk));
    return kk ? `${kk.no_kk} - ${kk.nama}` : `${no_kk} - Tidak ditemukan`;
  };

  // helper to safely lower string
  const safeLower = (v = "") => String(v).toLowerCase();

  return (
    <div className="p-6 bg-white rounded-lg shadow relative">
      {/* Header */}
      <div className="flex items-center bg-green-500 text-white px-4 py-3 rounded-t-lg">
        <FileText className="w-5 h-5 mr-2" />
        <h1 className="text-lg font-semibold">Data Kelahiran</h1>
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
            onClick={handleDeleteMany}
            disabled={selectedIds.length === 0}
            className="flex items-center bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            <Trash2 className="w-5 h-5 mr-2" /> Hapus Terpilih
          </button>
          <button
            onClick={() => {
              setIsModalOpen(true);
              // reset search & form when opening
              setSearchKK("");
              setFormData({
                no_kk: "",
                nik: "",
                nama: "",
                tempat_lahir: "",
                tanggal_lahir: "",
                jk: "",
                agama: "",
                status_perkawinan: "Belum Kawin",
                pendidikan: "Tidak/Belum Sekolah",
                pekerjaan: "Belum/Tidak Bekerja",
                alamat: "",
                rt: "",
                rw: "",
                status_keluarga: "Anak",
                nik_ayah: "",
                nama_ayah: "",
                tanggal_lahir_ayah: "",
                pekerjaan_ayah: "",
                nik_ibu: "",
                nama_ibu: "",
                tanggal_lahir_ibu: "",
                golongan_darah: "",
                desa: "",
                kecamatan: "",
                kabupaten: "",
                provinsi: "",
                kode_pos: "",
              });
            }}
            className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            <UserPlus className="w-5 h-5 mr-2" /> Tambah Data
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-200">
          <thead className="bg-green-700 text-white">
            <tr>
              <th className="px-4 py-2 border text-center">
                <input
                  type="checkbox"
                  checked={
                    displayedData.length > 0 && selectedIds.length === displayedData.length
                  }
                  onChange={toggleSelectAll}
                />
              </th>
              <th className="px-4 py-2 border">No</th>
              <th className="px-4 py-2 border">NIK</th>
              <th className="px-4 py-2 border">No KK</th>
              <th className="px-4 py-2 border">Nama</th>
              <th className="px-4 py-2 border">Tanggal Lahir</th>
              <th className="px-4 py-2 border">JK</th>
              <th className="px-4 py-2 border">Keluarga</th>
              <th className="px-4 py-2 border">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="text-center py-6">
                  <div className="flex flex-col items-center">
                    <svg className="animate-spin h-6 w-6 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                    </svg>
                    <div>Memuat data...</div>
                  </div>
                </td>
              </tr>
            ) : (
              <>
                {[...displayedData]
                  .sort((a, b) => (b.id_kelahiran || 0) - (a.id_kelahiran || 0))
                  .map((item, index) => (
                    <tr key={item.id_kelahiran} className="hover:bg-gray-50">
                      <td className="px-4 py-2 border text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(item.id_kelahiran)}
                          onChange={() => toggleSelect(item.id_kelahiran)}
                        />
                      </td>
                      <td className="px-4 py-2 border text-center">
                        {(currentPage - 1) * entriesPerPage + index + 1}
                      </td>
                      <td className="px-4 py-2 border text-center">{item.nik}</td>
                      <td className="px-4 py-2 border text-center">{item.no_kk}</td>
                      <td className="px-4 py-2 border text-center">{item.nama}</td>
                      <td className="px-4 py-2 border text-center">{item.tanggal_lahir}</td>
                      <td className="px-4 py-2 border text-center">{item.jk}</td>
                      <td className="px-4 py-2 border text-center">{getKepalaKeluarga(item.no_kk)}</td>
                      <td className="px-4 py-2 border text-center">
                        <div className="flex items-center justify-center space-x-2">
                          {/* 🔸 Icon menunggu persetujuan */}
                          {item.status_verifikasi?.toLowerCase() === "menunggu persetujuan" && (
                            <div
                              title="Menunggu Persetujuan"
                              className="text-orange-500 text-lg animate-pulse flex items-center justify-center"
                            >
                              ⏳
                            </div>
                          )}

{(item.alasan_penolakan ||
  (item.status_verifikasi &&
    item.status_verifikasi.toLowerCase() === "ditolak")) && (
  <div className="relative inline-block">
    {/* Tombol icon */}
    <button
      onClick={(e) => {
        e.stopPropagation(); // supaya click tidak bubble ke tr
        const popupId = `${item.jenis}_${item.id_kelahiran ?? item.nik}`;
        setShowMessageId((prev) => (prev === popupId ? null : popupId));
      }}
      title="Lihat alasan penolakan"
      className="text-red-600 hover:text-red-800 p-2 rounded-full z-20"
    >
      <MessageCircle className="w-4 h-4" />
    </button>

    {/* Popup hanya muncul untuk row yang diklik */}
    {showMessageId === `${item.jenis}_${item.id_kelahiran ?? item.nik}` && (
      <div
        className="absolute top-full mt-1 left-5/2 -translate-x-1/2 min-w-[13rem] bg-white border border-gray-300 rounded-xl shadow-md z-50 p-3 text-center"
        onClick={(e) => e.stopPropagation()} // supaya klik di popup tidak menutup popup
      >
        <h3 className="font-semibold text-gray-800 text-sm mb-2">
          Alasan dari admin:{" "}
          <span className="font-normal text-gray-700">
            <br />{item.alasan_penolakan || "-"}
          </span>
        </h3>

        <button
          onClick={async () => {
            try {
              if (item.jenis === "tambah") {
                if (!item.id_kelahiran) return;
                await supabase
                  .from("data_kelahiran")
                  .delete()
                  .eq("id_kelahiran", item.id_kelahiran);
                setAllData((prev) =>
                  prev.filter((x) => x.id_kelahiran !== item.id_kelahiran)
                );
              } else if (item.jenis === "edit" || item.jenis === "hapus") {
                await supabase
                  .from("data_kelahiran")
                  .update({ alasan_penolakan: null })
                  .eq("id_kelahiran", item.id_kelahiran);
                setAllData((prev) =>
                  prev.map((x) =>
                    x.id_kelahiran === item.id_kelahiran
                      ? { ...x, alasan_penolakan: null }
                      : x
                  )
                );
              }
              setShowMessageId(null); // tutup popup hanya untuk item ini
            } catch (err) {
              console.error("Gagal hapus/update data:", err);
            }
          }}
          className="mt-2 w-full bg-red-600 text-white text-sm py-1 rounded hover:bg-red-700 transition font-medium"
        >
          Tutup
        </button>
      </div>
    )}
  </div>
)}


                          {/* 🔹 Tombol Lihat */}
                          <Link
                            to={`/rt/sirkulasipenduduk/datakelahiran/${item.id_kelahiran}`}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-full flex items-center justify-center"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>

                          {/* 🔹 Tombol Edit */}
                          <Link
                            to={`/rt/sirkulasipenduduk/datakelahiran/edit/${item.id_kelahiran}`}
                            className="p-2 text-yellow-600 hover:bg-yellow-100 rounded-full flex items-center justify-center"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>

                          {/* 🔹 Tombol Hapus */}
                          <button
                            onClick={() => handleHapus(item)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-full flex items-center justify-center"
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
            `Showing ${(currentPage - 1) * entriesPerPage + (allData.length === 0 ? 0 : 1)} to ${Math.min(currentPage * entriesPerPage, allData.length)} of ${allData.length} entries`
          )}
        </span>

        <div className="space-x-2 flex items-center">
          <button
            onClick={handlePrevious}
            disabled={currentPage === 1}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
            <button
              key={num}
              onClick={() => setCurrentPage(num)}
              className={`px-3 py-1 rounded ${currentPage === num ? "bg-blue-500 text-white" : "bg-gray-200"}`}
            >
              {num}
            </button>
          ))}
          <button
            onClick={handleNext}
            disabled={currentPage === totalPages || totalPages === 0}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {/* Modal Tambah Data */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          ></div>

          <div className="relative bg-white rounded-lg shadow-lg w-full max-w-3xl p-6 z-10 overflow-y-auto max-h-[90vh]">
            <h2 className="text-xl font-semibold mb-4">Tambah Data Kelahiran</h2>

            <form onSubmit={handleSimpan} className="grid grid-cols-2 gap-4">
              {/* Input No KK / Kepala Keluarga */}
              <div className="relative w-full" ref={dropdownRef}>
                <input
                  type="text"
                  value={searchKK}
                  onChange={(e) => {
                    setSearchKK(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  placeholder="Cari No KK / Kepala Keluarga"
                  className="border rounded px-3 py-2 w-full"
                />

                {showDropdown && (
                  <div className="absolute z-10 w-full bg-white border rounded shadow max-h-48 overflow-y-auto">
                    {kepalaKeluarga
                      .filter(
                        (k) =>
                          k.no_kk?.toLowerCase().includes(searchKK.toLowerCase()) ||
                          k.nama?.toLowerCase().includes(searchKK.toLowerCase())
                      )
                      .map((k) => {
                        const ibu = allPenduduk.find(
                          (p) =>
                            p.no_kk === k.no_kk &&
                            (p.status_keluarga || "").toLowerCase() === "istri"
                        );

                        return (
                          <div
                            key={k.id_penduduk}
                            onMouseDown={(ev) => {
                              ev.preventDefault();
                              setSearchKK(`${k.no_kk} - ${k.nama}`);
                              setShowDropdown(false);

                              // set otomatis data ayah & ibu
                              setFormData((prev) => ({
                                ...prev,
                                no_kk: k.no_kk,
                                alamat: k.alamat || "",
                                rt: k.rt || "",
                                rw: k.rw || "",
                                desa: k.desa || "",
                                kecamatan: k.kecamatan || "",
                                kabupaten: k.kabupaten || "",
                                provinsi: k.provinsi || "",
                                kode_pos: k.kode_pos || "",
                                status_keluarga: "Anak",

                                // Data Ayah (kepala keluarga)
                                nik_ayah: k.nik || "",
                                nama_ayah: k.nama || "",
                                tanggal_lahir_ayah: k.tanggal_lahir || "",
                                pekerjaan_ayah: k.pekerjaan || "",

                                // Data Ibu (yang berstatus 'Istri' di allPenduduk)
                                nik_ibu: ibu ? ibu.nik || "" : "",
                                nama_ibu: ibu ? ibu.nama || "" : "",
                                tanggal_lahir_ibu: ibu ? ibu.tanggal_lahir || "" : "",
                              }));
                            }}
                            className="px-3 py-2 cursor-pointer hover:bg-green-100"
                          >
                            {k.no_kk} - {k.nama}
                          </div>
                        );
                      })}

                    {kepalaKeluarga.filter(
                      (k) =>
                        k.no_kk?.toLowerCase().includes(searchKK.toLowerCase()) ||
                        k.nama?.toLowerCase().includes(searchKK.toLowerCase())
                    ).length === 0 && (
                      <div className="px-3 py-2 text-gray-500">Tidak ditemukan</div>
                    )}
                  </div>
                )}
              </div>

              {/* Remaining fields (anak) */}
              <input
                type="text"
                placeholder="NIK"
                value={formData.nik}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, nik: e.target.value.trimStart() }))
                }
                className="border rounded px-3 py-2"
              />
              <input
                type="text"
                placeholder="Nama"
                value={formData.nama}
                onChange={(e) => setFormData((prev) => ({ ...prev, nama: e.target.value }))}
                className="border rounded px-3 py-2"
              />
              <input
                type="text"
                placeholder="Tempat Lahir"
                value={formData.tempat_lahir}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, tempat_lahir: e.target.value }))
                }
                className="border rounded px-3 py-2"
              />
              <input
                type="date"
                placeholder="Tanggal Lahir"
                value={formData.tanggal_lahir}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, tanggal_lahir: e.target.value }))
                }
                className="border rounded px-3 py-2"
              />

              {/* Jenis Kelamin */}
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="-- Pilih Jenis Kelamin --"
                  value={searchJK}
                  onChange={(e) => {
                    setSearchJK(e.target.value);
                    setShowJKDropdown(true);
                  }}
                  onClick={() => setShowJKDropdown(true)}
                  onFocus={() => setShowJKDropdown(true)}
                  onBlur={() => setTimeout(() => setShowJKDropdown(false), 150)}
                  className="border rounded px-3 py-2 w-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-400"
                />

                {showJKDropdown && (
                  <ul className="absolute z-10 w-full bg-white border rounded shadow max-h-40 overflow-y-auto">
                    {jkOptions
                      .filter((item) => item.toLowerCase().includes(searchJK.toLowerCase()))
                      .map((item, index) => (
                        <li
                          key={index}
                          onMouseDown={() => {
                            setFormData((prev) => ({ ...prev, jk: item }));
                            setSearchJK(item);
                            setShowJKDropdown(false);
                          }}
                          className="px-3 py-2 hover:bg-green-100 cursor-pointer"
                        >
                          {item}
                        </li>
                      ))}
                  </ul>
                )}
              </div>

              {/* Golongan Darah */}
              <input
                type="text"
                placeholder="Golongan Darah"
                value={formData.golongan_darah}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, golongan_darah: e.target.value.trimStart() }))
                }
                className="border rounded px-3 py-2"
              />

              {/* Agama */}
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="-- Pilih Agama --"
                  value={searchAgama}
                  onChange={(e) => {
                    setSearchAgama(e.target.value);
                    setShowAgamaDropdown(true);
                  }}
                  onClick={() => setShowAgamaDropdown(true)}
                  onFocus={() => setShowAgamaDropdown(true)}
                  onBlur={() => setTimeout(() => setShowAgamaDropdown(false), 150)}
                  className="border rounded px-3 py-2 w-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-400"
                />

                {showAgamaDropdown && (
                  <ul className="absolute z-10 w-full bg-white border rounded shadow max-h-40 overflow-y-auto">
                    {agamaOptions
                      .filter((item) => item.toLowerCase().includes(searchAgama.toLowerCase()))
                      .map((item, index) => (
                        <li
                          key={index}
                          onMouseDown={() => {
                            setFormData((prev) => ({ ...prev, agama: item }));
                            setSearchAgama(item);
                            setShowAgamaDropdown(false);
                          }}
                          className="px-3 py-2 hover:bg-green-100 cursor-pointer"
                        >
                          {item}
                        </li>
                      ))}
                  </ul>
                )}
              </div>

              {/* Readonly otomatis */}
              <input
                type="text"
                value={formData.status_perkawinan}
                readOnly
                className="border rounded px-3 py-2 bg-gray-100"
              />
              <input
                type="text"
                value={formData.pendidikan}
                readOnly
                className="border rounded px-3 py-2 bg-gray-100"
              />
              <input
                type="text"
                value={formData.pekerjaan}
                readOnly
                className="border rounded px-3 py-2 bg-gray-100"
              />

              <input
                type="text"
                placeholder="Alamat"
                value={formData.alamat}
                readOnly
                className="border rounded px-3 py-2 bg-gray-100"
              />
              <input
                type="text"
                placeholder="RT"
                value={formData.rt}
                readOnly
                className="border rounded px-3 py-2 bg-gray-100"
              />
              <input
                type="text"
                placeholder="RW"
                value={formData.rw}
                readOnly
                className="border rounded px-3 py-2 bg-gray-100"
              />
              <input
                type="text"
                value={formData.status_keluarga}
                readOnly
                className="border rounded px-3 py-2 bg-gray-100"
              />

              {/* Data Ayah & Ibu - sekarang editable (punya onChange) */}
              <input
                type="text"
                placeholder="NIK Ayah"
                value={formData.nik_ayah}
                onChange={(e) => setFormData((prev) => ({ ...prev, nik_ayah: e.target.value }))}
                className="border rounded px-3 py-2"
              />
              <input
                type="text"
                placeholder="Nama Ayah"
                value={formData.nama_ayah}
                onChange={(e) => setFormData((prev) => ({ ...prev, nama_ayah: e.target.value }))}
                className="border rounded px-3 py-2"
              />
              <input
                type="date"
                placeholder="Tanggal Lahir Ayah"
                value={formData.tanggal_lahir_ayah || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, tanggal_lahir_ayah: e.target.value }))}
                className="border rounded px-3 py-2"
              />
              <input
                type="text"
                placeholder="Pekerjaan Ayah"
                value={formData.pekerjaan_ayah || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, pekerjaan_ayah: e.target.value }))}
                className="border rounded px-3 py-2"
              />

              <input
                type="text"
                placeholder="NIK Ibu"
                value={formData.nik_ibu}
                onChange={(e) => setFormData((prev) => ({ ...prev, nik_ibu: e.target.value }))}
                className="border rounded px-3 py-2"
              />
              <input
                type="text"
                placeholder="Nama Ibu"
                value={formData.nama_ibu}
                onChange={(e) => setFormData((prev) => ({ ...prev, nama_ibu: e.target.value }))}
                className="border rounded px-3 py-2"
              />
              <input
                type="date"
                placeholder="Tanggal Lahir Ibu"
                value={formData.tanggal_lahir_ibu || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, tanggal_lahir_ibu: e.target.value }))}
                className="border rounded px-3 py-2"
              />

              {/* Lokasi tetap */}
              <input type="text" placeholder="Desa" value="Margahayu Tengah" readOnly className="border rounded px-3 py-2 bg-gray-100" />
              <input type="text" placeholder="Kecamatan" value="Margahayu" readOnly className="border rounded px-3 py-2 bg-gray-100" />
              <input type="text" placeholder="Kabupaten" value="Bandung" readOnly className="border rounded px-3 py-2 bg-gray-100" />
              <input type="text" placeholder="Provinsi" value="Jawa Barat" readOnly className="border rounded px-3 py-2 bg-gray-100" />
              <input type="text" placeholder="Kode Pos" value="40225" readOnly className="border rounded px-3 py-2 bg-gray-100" />
            </form>

            {/* Tombol Simpan / Batal */}
            <div className="flex justify-end mt-4 space-x-2">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Batal</button>
              <button onClick={handleSimpan} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Simpan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataKelahiran;
