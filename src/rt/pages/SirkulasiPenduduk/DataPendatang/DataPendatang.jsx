import React, { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { Eye, Edit, Trash2, UserPlus, FileText, MessageCircle } from "lucide-react";
import supabase from "../../../../supabaseClient";

function DataPendatang() {
  const [allData, setAllData] = useState([]);
  const [entriesPerPage, setEntriesPerPage] = useState(500);
  const [dataPenduduk, setDataPenduduk] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showJKDropdown, setShowJKDropdown] = useState(false);
  const [searchJK, setSearchJK] = useState("");
  const jkOptions = ["Laki-laki", "Perempuan"];
  const [showAlamatDropdown, setShowAlamatDropdown] = useState(false);
  const [searchAlamat, setSearchAlamat] = useState("");
  const [customAlamat, setCustomAlamat] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [searchStatus, setSearchStatus] = useState("");
  const statusOptions = [
    "Kepala Keluarga",
    "Suami",
    "Istri",
    "Anak",
    "Orang Tua",
    "Mertua",
    "Cucu",
    "Menantu",
    "Pembantu",
    "Family Lain"
  ];
  const [showAgamaDropdown, setShowAgamaDropdown] = useState(false);
  const [searchAgama, setSearchAgama] = useState("");
  const agamaOptions = [
    "Islam",
    "Kristen",
    "Katholik",
    "Hindu",
    "Budha",
    "Konghucu"
  ];
  const [showStatusPerkawinanDropdown, setShowStatusPerkawinanDropdown] = useState(false);
  const [searchStatusPerkawinan, setSearchStatusPerkawinan] = useState("");
  const statusPerkawinanOptions = [
    "Belum Kawin",
    "Kawin Tercatat",
    "Kawin Tidak Tercatat",
    "Cerai Hidup",
    "Cerai Mati"
  ];
  const [showPendidikanDropdown, setShowPendidikanDropdown] = useState(false);
  const [searchPendidikan, setSearchPendidikan] = useState("");
  const pendidikanOptions = [
    "Tidak/Belum Sekolah",
    "Belum Tamat SD/Sederajat",
    "Tamat SD/Sederajat",
    "SLTP/Sederajat",
    "SLTA/Sederajat",
    "Diploma I/II",
    "Akademi I/Diploma III/S.Muda",
    "Diploma IV/Strata I",
    "Strata II",
    "Strata III"
  ];

  const [formData, setFormData] = useState({
    no_kk: "", nik: "", nama: "", tempat_lahir: "", tanggal_lahir: "", jk: "",
    golongan_darah: "",  agama: "", status_perkawinan: "", pendidikan: "", pekerjaan: "", 
    alamat: "",  rt: "", rw: "", status_keluarga: "", nik_ayah: "", nama_ayah: "",
    nik_ibu: "", nama_ibu: "", desa: "", kecamatan: "", kabupaten: "", provinsi: "", kode_pos: "",
     tanggal_datang: "",
  });

  const [searchPekerjaan, setSearchPekerjaan] = useState("");
  const pekerjaanOptions = [
    "Belum/Tidak Bekerja", "Mengurus Rumah Tangga", "Pelajar/Mahasiswa", "Pensiunan",
    "Pegawai Negeri Sipil", "Tentara Nasional Indonesia", "Kepolisian RI", "Perdagangan",
    "Petani/Pekebun", "Peternak", "Nelayan/Perikanan", "Industri", "Kontruksi",
    "Transportasi", "Karyawan Swasta", "Karyawan BUMN", "Karyawan BUMD", "Karyawan Honorer",
    "Buruh Harian Lepas", "Buruh Tani/Perkebunan", "Buruh Nelayan/Perikanan",
    "Buruh Peternakan", "Pembantu Rumah Tangga", "Tukang Cukur", "Tukang Listrik",
    "Tukang Batu", "Tukang Kayu", "Tukang Sol Sepatu", "Tukang Las/Pandai Besi", "Tukang Jahit",
    "Tukang Gigi", "Penata Rias", "Penata Busana", "Penata Rambut", "Mekanik", "Seniman",
    "Tabib", "Paraji", "Perancang Busana", "Penterjemah", "Imam Masjid", "Pendeta", "Pastor",
    "Wartawan", "Ustadz/Mubaligh", "Juru Masak", "Promotor Acara", "Anggota DPR-RI",
    "Anggota DPD", "Anggota BPK", "Presiden", "Wakil Presiden", "Anggota Mahkamah Konstitusi",
    "Anggota Kabinet Kementrian", "Duta Besar", "Gubernur", "Wakil Gubernur", "Bupati",
    "Wakil Bupati", "Walikota", "Wakil Walikota", "Anggota DPRD Prop.", "Anggota DPRD Kab. Kota",
    "Dosen", "Guru", "Pilot", "Pengacara", "Notaris", "Arsitek", "Akuntan", "Konsultan",
    "Dokter", "Bidan", "Perawat", "Apoteker", "Psikiater/Psikolog", "Penyiar Televisi",
    "Penyiar Radio", "Pelaut", "Peneliti", "Sopir", "Pialang", "Paranormal", "Pedagang",
    "Perangkat Desa", "Kepala Desa", "Biarawati", "Wiraswasta"
  ];

  // Array alamat
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
  const location = useLocation();

  const fetchDataPendatang = async () => {
    try {
      setLoading(true); // mulai loading
      const params = new URLSearchParams(location.search);
      const keyword = params.get("keyword")?.trim() || "";

      const userRt = localStorage.getItem("userRt");
      const userRw = localStorage.getItem("userRw");

      let query = supabase
        .from("data_pendatang")
        .select("*")
        .eq("rt", userRt)
        .eq("rw", userRw)
        .order("id", { ascending: true });

      if (keyword) {
        query = query.or(`nik.ilike.*${keyword}*,nama.ilike.*${keyword}*`);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching data_pendatang:", error);
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

  const [userRt, setUserRt] = useState("");
  const [userRw, setUserRw] = useState("");

  // Ambil ulang data setiap kali keyword berubah
  useEffect(() => {
    fetchDataPendatang();
  }, [location.search]);
  
  useEffect(() => {
    const fetchUserRtRw = async () => {
      try {
        const rawId = localStorage.getItem("userId");
        if (!rawId) {
          console.warn("userId not found in localStorage");
          return;
        }
        const userId = Number(rawId); // convert to number if stored as string

        const { data, error } = await supabase
          .from("users")
          .select("rt, rw")
          .eq("id", userId)
          .single();

        if (error) {
          console.error("Gagal ambil RT/RW dari users:", error);
          return;
        }

        // simpan di state lokal
        setUserRt(data?.rt || "");
        setUserRw(data?.rw || "");

        // dan set ke formData supaya input RT/RW otomatis terisi
        setFormData(prev => ({
          ...prev,
          rt: data?.rt || prev.rt || "",
          rw: data?.rw || prev.rw || "",
        }));
      } catch (err) {
        console.error("Error saat fetch user RT/RW:", err);
      }
    };

    fetchUserRtRw();
  }, []); // jalankan sekali saat mount

  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(allData.length / entriesPerPage);
  const displayedData = allData.slice((currentPage - 1) * entriesPerPage, currentPage * entriesPerPage);

  const handlePrevious = () => { if (currentPage > 1) setCurrentPage(currentPage - 1); };
  const handleNext = () => { if (currentPage < totalPages) setCurrentPage(currentPage + 1); };

  const capitalize = (str = "") =>
    str
      .trim()
      .split(" ")
      .filter(Boolean)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");

  const emptyToNull = (value) => (value === "" ? null : value);
  const resetForm = () => {
    setFormData((prev) => ({
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
      rt: prev.rt || "", // 🟢 pertahankan RT sebelumnya
      rw: prev.rw || "", // 🟢 pertahankan RW sebelumnya
      status_keluarga: "",
      nik_ayah: "",
      nama_ayah: "",
      nik_ibu: "",
      nama_ibu: "",
      desa: "",
      kecamatan: "",
      kabupaten: "",
      provinsi: "",
      kode_pos: "",
      tanggal_datang: "",
      keterangan: "",
    }));

    // Reset semua dropdown dan pencarian
    setSearchJK("");
    setSearchAgama("");
    setSearchStatusPerkawinan("");
    setSearchPendidikan("");
    setSearchPekerjaan("");
    setSearchAlamat("");
    setSearchStatus("");

    // Reset input tambahan
    setCustomAlamat("");
    setShowCustomInput(false);

    // Tutup modal
    setIsModalOpen(false);
  };

  const handleSimpan = async () => {
    try {
      // 1️⃣ Validasi input
      if (!formData.no_kk || !formData.nik || !formData.nama) {
        alert("⚠️ No KK, NIK, dan Nama wajib diisi!");
        return;
      }
      if (!formData.pekerjaan) {
        alert("⚠️ Pekerjaan wajib dipilih!");
        return;
      }
      if (!formData.tanggal_datang) {
        alert("⚠️ Tanggal datang wajib diisi!");
        return;
      }

      // 2️⃣ Tentukan alamat final
      let finalAlamat = formData.alamat;
      if (searchAlamat === "Lainnya" && !customAlamat.trim()) {
        alert("⚠️ Isi alamat detail jika memilih 'Lainnya'!");
        return;
      }
      if (searchAlamat === "Lainnya") finalAlamat = customAlamat.trim();

      // 3️⃣ Susun data
      const dataBaru = {
        no_kk: formData.no_kk,
        nik: formData.nik,
        nama: formData.nama,
        tempat_lahir: formData.tempat_lahir || null,
        tanggal_lahir: formData.tanggal_lahir || null,
        jk: formData.jk,
        agama: formData.agama || null,
        status_perkawinan: formData.status_perkawinan || null,
        pendidikan: formData.pendidikan || null,
        pekerjaan: formData.pekerjaan,
        alamat: finalAlamat,
        rt: formData.rt || null,
        rw: formData.rw || null,
        status_keluarga: formData.status_keluarga || null,
        nik_ayah: formData.nik_ayah || null,
        nama_ayah: formData.nama_ayah || null,
        nik_ibu: formData.nik_ibu || null,
        nama_ibu: formData.nama_ibu || null,
        desa: "Margahayu Tengah",
        kecamatan: "Margahayu",
        kabupaten: "Bandung",
        provinsi: "Jawa Barat",
        kode_pos: "40225",
        tanggal_datang: formData.tanggal_datang,
        status_verifikasi: "menunggu persetujuan",
        jenis: "tambah",
        alasan_penolakan: null,
        created_at: new Date(),
      };

      // 4️⃣ Insert ke data_pendatang
      const { data: insertedPendatang, error: errPendatang } = await supabase
        .from("data_pendatang")
        .insert([dataBaru])
        .select()
        .single();

      if (errPendatang) throw errPendatang;

      // 5️⃣ Insert ke data_pendatang_update (tracking)
      const { error: errUpdate } = await supabase
        .from("data_pendatang_update")
        .insert([
          {
            ...dataBaru,
            id_pendatang: insertedPendatang.id, // relasi FK
          },
        ]);

      if (errUpdate) throw errUpdate;

      // 6️⃣ Update state tanpa refresh
      setAllData((prev) => [insertedPendatang, ...prev]);

      // 7️⃣ Reset form
      resetForm();

      alert("✅ Data berhasil diusulkan dan menunggu persetujuan admin!");
    } catch (err) {
      console.error("Gagal menyimpan data:", err);
      alert("❌ Terjadi kesalahan: " + (err.message || err));
    }
  };

  const handleHapus = async (id) => {
    if (!window.confirm("Apakah Anda yakin ingin mengusulkan penghapusan data ini?")) return;

    try {
      // 1️⃣ Ambil data lama
      const { data: detail, error: fetchError } = await supabase
        .from("data_pendatang")
        .select("*")
        .eq("id", id)
        .single();

      if (fetchError || !detail) {
        alert("Gagal mengambil data yang ingin dihapus.");
        console.error(fetchError);
        return;
      }

      // 2️⃣ Insert usulan ke tabel update
      const { error: insertError } = await supabase.from("data_pendatang_update").insert([
        {
          ...detail,
          id_pendatang: id,
          status_verifikasi: "menunggu persetujuan",
          jenis: "hapus",
          created_at: new Date(),
        },
      ]);

      if (insertError) {
        console.error(insertError);
        alert("❌ Gagal mengusulkan hapus: " + insertError.message);
        return;
      }

      // 3️⃣ Update tabel utama (menandai status menunggu)
      const { error: updateError } = await supabase
        .from("data_pendatang")
        .update({
          status_verifikasi: "menunggu persetujuan",
          jenis: "hapus",
          updated_at: new Date(),
        })
        .eq("id", id);

      if (updateError) {
        console.error(updateError);
        alert("⚠️ Usulan tersimpan, tapi gagal update tabel utama.");
        return;
      }

      // 4️⃣ 🔥 Update data di tampilan langsung tanpa refresh
      setAllData((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                status_verifikasi: "menunggu persetujuan",
                jenis: "hapus",
              }
            : item
        )
      );

      setSelectedIds((prev) => prev.filter((sel) => sel !== id));

      alert("✅ Pengajuan telah dikirim dan menunggu persetujuan admin!");
    } catch (err) {
      console.error("Error handleHapus:", err);
      alert("Terjadi kesalahan: " + err.message);
    }
  };

  // Toggle select satu baris
  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Toggle select all
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

  // Hapus banyak data terpilih
const handleDeleteMany = async () => {
  if (selectedIds.length === 0) {
    alert("Pilih data yang ingin dihapus!");
    return;
  }

  const konfirmasi = window.confirm(
    `Apakah Anda yakin ingin mengusulkan penghapusan ${selectedIds.length} data terpilih?`
  );
  if (!konfirmasi) return;

  try {
    // 1️⃣ Ambil semua data yang dipilih
    const { data: selectedData, error: errSelect } = await supabase
      .from("data_pendatang")
      .select("*")
      .in("id", selectedIds);

    if (errSelect) throw errSelect;
    if (!selectedData || selectedData.length === 0) {
      alert("Data tidak ditemukan!");
      return;
    }

    // 2️⃣ Insert usulan ke tabel data_pendatang_update
    const insertPayload = selectedData.map((item) => ({
      id_pendatang: item.id,
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
      desa: item.desa,
      kecamatan: item.kecamatan,
      kabupaten: item.kabupaten,
      provinsi: item.provinsi,
      kode_pos: item.kode_pos,
      nik_ayah: item.nik_ayah,
      nama_ayah: item.nama_ayah,
      nik_ibu: item.nik_ibu,
      nama_ibu: item.nama_ibu,
      golongan_darah: item.golongan_darah,
      tanggal_datang: item.tanggal_datang,
      jenis: "hapus",
      status_verifikasi: "menunggu persetujuan",
      created_at: new Date(),
    }));

    const { error: errInsert } = await supabase
      .from("data_pendatang_update")
      .insert(insertPayload);

    if (errInsert) throw errInsert;

    // 3️⃣ Update data utama agar menunggu persetujuan
    const { error: errUpdate } = await supabase
      .from("data_pendatang")
      .update({
        jenis: "hapus",
        status_verifikasi: "menunggu persetujuan",
        updated_at: new Date(),
      })
      .in("id", selectedIds);

    if (errUpdate) throw errUpdate;

    // 4️⃣ Perbarui data di tampilan (tanpa reload)
    setAllData((prev) =>
      prev.map((item) =>
        selectedIds.includes(item.id)
          ? {
              ...item,
              jenis: "hapus",
              status_verifikasi: "menunggu persetujuan",
            }
          : item
      )
    );

    setSelectedIds([]);
    setSelectAll(false);

    alert("✅ Pengajuan telah dikirim dan menunggu persetujuan admin!");
  } catch (err) {
    console.error("Gagal mengusulkan hapus banyak:", err);
    alert("❌ Gagal mengusulkan hapus banyak: " + (err.message || err));
  }
};

  const [showMessageId, setShowMessageId] = useState(null);
  // Fungsi untuk menutup pesan penolakan atau hapus data usulan ditolak
  const handleDeleteRejected = async (id) => {
    if (!id) return;

  try {
    // Ambil data pendatang berdasarkan id
    const { data: pendatang, error: fetchErr } = await supabase
      .from("data_pendatang")
      .select("id, jenis")
      .eq("id", id)
      .single();

    if (fetchErr) throw fetchErr;
    if (!pendatang) return;

    const jenis = (pendatang.jenis || "").toLowerCase();

    // 🟥 Jika jenis = 'tambah' → hapus data sepenuhnya
    if (jenis === "tambah") {
      const { error: delErr } = await supabase
        .from("data_pendatang")
        .delete()
        .eq("id", id);
      if (delErr) throw delErr;

      // Hapus dari state tampilan juga
      setAllData((prev) => prev.filter((x) => x.id !== id));
    }

    // 🟨 Jika jenis = 'edit' atau 'hapus' → hanya reset alasan_penolakan
    else if (jenis === "edit" || jenis === "hapus") {
      const { error: updErr } = await supabase
        .from("data_pendatang")
        .update({ alasan_penolakan: null })
        .eq("id", id);
      if (updErr) throw updErr;

      // Update tampilan agar alasan_penolakan hilang
      setAllData((prev) =>
        prev.map((x) =>
          x.id === id ? { ...x, alasan_penolakan: null } : x
        )
      );
    }

    // Tutup popup pesan
    setShowMessageId(null);
  } catch (err) {
    console.error("❌ Gagal hapus/update data pendatang:", err);
    alert("Terjadi kesalahan saat menghapus atau mereset data!");
  }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow relative">
      {/* Header */}
      <div className="flex items-center bg-green-500 text-white px-4 py-3 rounded-t-lg">
        <FileText className="w-5 h-5 mr-2" />
        <h1 className="text-lg font-semibold">Data Pendatang</h1>
      </div>

      {/* Show entries & tambah data */}
      <div className="flex justify-between items-center mt-4 mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-sm">Show</span>
          <select value={entriesPerPage} onChange={(e) => setEntriesPerPage(Number(e.target.value))}
            className="appearance-none bg-gray-200 border rounded px-2 py-1 text-sm pr-6 focus:outline-none">
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
            onClick={() => setIsModalOpen(true)}
            className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            <UserPlus className="w-5 h-5 mr-2" /> Tambah Data
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
                  checked={
                    selectedIds.length === displayedData.length &&
                    displayedData.length > 0
                  }
                  onChange={toggleSelectAll}
                />
              </th>
              <th className="px-4 py-2 border">No</th>
              <th className="px-4 py-2 border">NIK</th>
              <th className="px-4 py-2 border">No KK</th>
              <th className="px-4 py-2 border">Nama</th>
              <th className="px-4 py-2 border">JK</th>
              <th className="px-4 py-2 border">Tanggal Datang</th>
              <th className="px-4 py-2 border">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="9" className="text-center py-6 text-gray-500">
                  ⏳ Sedang memuat data...
                </td>
              </tr>
            ) : displayedData.length > 0 ? (
              [...displayedData]
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
                    <td className="px-4 py-2 border text-center">{item.nik}</td>
                    <td className="px-4 py-2 border text-center">{item.no_kk}</td>
                    <td className="px-4 py-2 border text-center">{item.nama}</td>
                    <td className="px-4 py-2 border text-center">{item.jk}</td>
                    <td className="px-4 py-2 border text-center">
                      {item.tanggal_datang}
                    </td>
                    <td className="px-4 py-2 border text-center">
                      <div className="flex items-center justify-center space-x-2 relative">
                        {/* Status menunggu */}
                        {item.status_verifikasi?.toLowerCase() === "menunggu persetujuan" && (
                          <span
                            title="Menunggu persetujuan admin"
                            className="text-yellow-500 animate-pulse"
                          >
                            ⏳
                          </span>
                        )}

                        {/* Pesan penolakan */}
                        {(item.alasan_penolakan ||
                          (item.status_verifikasi &&
                            item.status_verifikasi.toLowerCase() === "ditolak")) && (
                          <div className="relative">
                            <button
                              onClick={() =>
                                setShowMessageId((prev) => (prev === item.id ? null : item.id))
                              }
                              title="Lihat alasan penolakan"
                              className="text-red-600 hover:text-red-800 p-2 rounded-full z-20"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </button>

                            {showMessageId === item.id && (
                              <div className="absolute top-full mt-1 left-5/2 -translate-x-1/2 min-w-[12rem] bg-white border border-gray-300 rounded-xl shadow-md z-50 p-3 text-center">
                                <h3 className="font-semibold text-gray-800 text-sm mb-2">
                                  Alasan dari admin:
                                  <br />
                                  <span className="font-normal text-gray-700">
                                    {item.alasan_penolakan || "-"}
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

                        {/* Tombol Lihat */}
                        <Link
                          to={`/rt/sirkulasipenduduk/datapendatang/${item.id}`}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-full"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>

                        {/* Tombol Edit */}
                        <Link
                          to={`/rt/sirkulasipenduduk/datapendatang/edit/${item.id}`}
                          className="p-2 text-yellow-600 hover:bg-yellow-100 rounded-full"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>

                        {/* Tombol Hapus */}
                        <button
                          onClick={() => handleHapus(item.id)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-full"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
            ) : (
              <tr>
                <td colSpan="9" className="text-center py-6 text-gray-500">
                  Tidak ada data
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <span className="text-sm">
          Showing {(currentPage - 1) * entriesPerPage + 1} to {Math.min(currentPage * entriesPerPage, allData.length)} of {allData.length} entries
        </span>

        <div className="space-x-2 flex items-center">
          <button onClick={handlePrevious} disabled={currentPage === 1} className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50">Previous</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(num => (
            <button key={num} onClick={() => setCurrentPage(num)}
              className={`px-3 py-1 rounded ${currentPage === num ? "bg-green-500 text-white" : "bg-gray-200"}`}>
              {num}
            </button>
          ))}
          <button onClick={handleNext} disabled={currentPage === totalPages || totalPages === 0} className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50">Next</button>
        </div>
      </div>

      {/* Modal Tambah Data */}
        {isModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>

            <div className="relative bg-white rounded-lg shadow-lg w-full max-w-3xl p-6 z-10 overflow-y-auto max-h-[90vh]">
              <h2 className="text-xl font-semibold mb-4">Tambah Data Penduduk Baru</h2>

              <form className="grid grid-cols-2 gap-4">
                {/* No KK - Kepala Keluarga (span 2 kolom) */}
                <input
                  type="text"
                  placeholder="Masukkan No KK"
                  value={formData.no_kk}
                  onChange={(e) => setFormData({ ...formData, no_kk: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />

                {/* NIK, Nama, Tempat Lahir, Tanggal Lahir */}
                <input
                  type="text"
                  placeholder="NIK"
                  value={formData.nik}
                  onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
                <input
                  type="text"
                  placeholder="Nama"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
                <input
                  type="text"
                  placeholder="Tempat Lahir"
                  value={formData.tempat_lahir}
                  onChange={(e) => setFormData({ ...formData, tempat_lahir: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
                <input
                  type="date"
                  placeholder="Tanggal Lahir"
                  value={formData.tanggal_lahir}
                  onChange={(e) => setFormData({ ...formData, tanggal_lahir: e.target.value })}
                  className="w-full border rounded px-3 py-2"
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
                    onBlur={() => setTimeout(() => setShowJKDropdown(false), 200)}
                    className="w-full border rounded px-3 py-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-400"
                  />

                  {showJKDropdown && (
                    <ul className="absolute z-10 w-full bg-white border rounded shadow max-h-40 overflow-y-auto">
                      {jkOptions
                        .filter((item) => item.toLowerCase().includes(searchJK.toLowerCase()))
                        .map((item, index) => (
                          <li
                            key={index}
                            onMouseDown={() => {
                              setFormData({ ...formData, jk: item });
                              setSearchJK(item);
                              setShowJKDropdown(false);
                            }}
                            className="px-3 py-2 hover:bg-green-100 cursor-pointer"
                          >
                            {item}
                          </li>
                        ))}
                      {jkOptions.filter((item) => item.toLowerCase().includes(searchJK.toLowerCase())).length === 0 && (
                        <li className="px-3 py-2 text-gray-400 italic">Tidak ditemukan</li>
                      )}
                    </ul>
                  )}
                </div>

                <input
                  type="text"
                  placeholder="Golongan Darah"
                  value={formData.golongan_darah}
                  onChange={(e) => setFormData({ ...formData, golongan_darah: e.target.value })}
                  className="w-full border rounded px-3 py-2"
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
                    onBlur={() => setTimeout(() => setShowAgamaDropdown(false), 200)}
                    className="w-full border rounded px-3 py-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-400"
                  />

                  {showAgamaDropdown && (
                    <ul className="absolute z-10 w-full bg-white border rounded shadow max-h-40 overflow-y-auto">
                      {agamaOptions
                        .filter((item) => item.toLowerCase().includes(searchAgama.toLowerCase()))
                        .map((item, index) => (
                          <li
                            key={index}
                            onMouseDown={() => {
                              setFormData({ ...formData, agama: item });
                              setSearchAgama(item);
                              setShowAgamaDropdown(false);
                            }}
                            className="px-3 py-2 hover:bg-green-100 cursor-pointer"
                          >
                            {item}
                          </li>
                        ))}
                      {agamaOptions.filter((item) => item.toLowerCase().includes(searchAgama.toLowerCase())).length === 0 && (
                        <li className="px-3 py-2 text-gray-400 italic">Tidak ditemukan</li>
                      )}
                    </ul>
                  )}
                </div>

                {/* Status Perkawinan */}
                <div className="relative w-full">
                  <input
                    type="text"
                    placeholder="-- Pilih Status Perkawinan --"
                    value={searchStatusPerkawinan}
                    onChange={(e) => {
                      setSearchStatusPerkawinan(e.target.value);
                      setShowStatusPerkawinanDropdown(true);
                    }}
                    onClick={() => setShowStatusPerkawinanDropdown(true)}
                    onFocus={() => setShowStatusPerkawinanDropdown(true)}
                    onBlur={() => setTimeout(() => setShowStatusPerkawinanDropdown(false), 200)}
                    className="w-full border rounded px-3 py-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-400"
                  />

                  {showStatusPerkawinanDropdown && (
                    <ul className="absolute z-10 w-full bg-white border rounded shadow max-h-40 overflow-y-auto">
                      {statusPerkawinanOptions
                        .filter((item) => item.toLowerCase().includes(searchStatusPerkawinan.toLowerCase()))
                        .map((item, index) => (
                          <li
                            key={index}
                            onMouseDown={() => {
                              setFormData({ ...formData, status_perkawinan: item });
                              setSearchStatusPerkawinan(item);
                              setShowStatusPerkawinanDropdown(false);
                            }}
                            className="px-3 py-2 hover:bg-green-100 cursor-pointer"
                          >
                            {item}
                          </li>
                        ))}
                      {statusPerkawinanOptions.filter((item) => item.toLowerCase().includes(searchStatusPerkawinan.toLowerCase())).length === 0 && (
                        <li className="px-3 py-2 text-gray-400 italic">Tidak ditemukan</li>
                      )}
                    </ul>
                  )}
                </div>

                {/* Pendidikan */}
                <div className="relative w-full">
                  <input
                    type="text"
                    placeholder="-- Pilih Pendidikan --"
                    value={searchPendidikan}
                    onChange={(e) => {
                      setSearchPendidikan(e.target.value);
                      setShowPendidikanDropdown(true);
                    }}
                    onClick={() => setShowPendidikanDropdown(true)}
                    onFocus={() => setShowPendidikanDropdown(true)}
                    onBlur={() => setTimeout(() => setShowPendidikanDropdown(false), 200)}
                    className="w-full border rounded px-3 py-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-400"
                  />

                  {showPendidikanDropdown && (
                    <ul className="absolute z-10 w-full bg-white border rounded shadow max-h-40 overflow-y-auto">
                      {pendidikanOptions
                        .filter((item) => item.toLowerCase().includes(searchPendidikan.toLowerCase()))
                        .map((item, index) => (
                          <li
                            key={index}
                            onMouseDown={() => {
                              setFormData({ ...formData, pendidikan: item });
                              setSearchPendidikan(item);
                              setShowPendidikanDropdown(false);
                            }}
                            className="px-3 py-2 hover:bg-green-100 cursor-pointer"
                          >
                            {item}
                          </li>
                        ))}
                      {pendidikanOptions.filter((item) => item.toLowerCase().includes(searchPendidikan.toLowerCase())).length === 0 && (
                        <li className="px-3 py-2 text-gray-400 italic">Tidak ditemukan</li>
                      )}
                    </ul>
                  )}
                </div>

                {/* Pekerjaan */}
                <div className="relative w-full">
                  <input
                    type="text"
                    placeholder="-- Pilih / Ketik Pekerjaan --"
                    value={searchPekerjaan}
                    onChange={(e) => {
                      setSearchPekerjaan(e.target.value);
                      setFormData({ ...formData, pekerjaan: e.target.value }); // ✅ Simpan ke form
                      setShowDropdown(true);
                    }}
                    onClick={() => setShowDropdown(true)}
                    onFocus={() => setShowDropdown(true)}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                    className="border rounded px-3 py-2 w-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-400"
                  />

                  {showDropdown && (
                    <ul className="absolute z-10 w-full bg-white border rounded shadow max-h-40 overflow-y-auto">
                      {pekerjaanOptions
                        .filter((p) => p.toLowerCase().includes(searchPekerjaan.toLowerCase()))
                        .map((p, i) => (
                          <li
                            key={i}
                            onMouseDown={() => {
                              setFormData({ ...formData, pekerjaan: p });
                              setSearchPekerjaan(p);
                              setShowDropdown(false);
                            }}
                            className="px-3 py-2 hover:bg-green-100 cursor-pointer"
                          >
                            {p}
                          </li>
                        ))}

                      {/* Jika tidak ada hasil */}
                      {pekerjaanOptions.filter((p) =>
                        p.toLowerCase().includes(searchPekerjaan.toLowerCase())
                      ).length === 0 && (
                        <li className="px-3 py-2 text-gray-400 italic">
                          Pekerjaan tidak ditemukan
                        </li>
                      )}
                    </ul>
                  )}
                </div>

                {/* Alamat */}
                <div className="relative w-full">
                  <input
                    type="text"
                    placeholder="-- Pilih / Ketik Alamat --"
                    value={searchAlamat}
                    onChange={(e) => {
                      setSearchAlamat(e.target.value);
                      setFormData({ ...formData, alamat: e.target.value }); // ✅ Simpan ke form
                      setShowAlamatDropdown(true);
                    }}
                    onClick={() => setShowAlamatDropdown(true)}
                    onFocus={() => setShowAlamatDropdown(true)}
                    onBlur={() => setTimeout(() => setShowAlamatDropdown(false), 200)}
                    className="border rounded px-3 py-2 w-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-400"
                  />

                  {showAlamatDropdown && (
                    <ul className="absolute z-10 w-full bg-white border rounded shadow max-h-40 overflow-y-auto">
                      {alamatOptions
                        .filter((item) =>
                          item.toLowerCase().includes(searchAlamat.toLowerCase())
                        )
                        .map((item, index) => (
                          <li
                            key={index}
                            onMouseDown={() => {
                              setFormData({ ...formData, alamat: item });
                              setSearchAlamat(item);
                              setShowAlamatDropdown(false);
                            }}
                            className="px-3 py-2 hover:bg-green-100 cursor-pointer"
                          >
                            {item}
                          </li>
                        ))}

                      {/* Jika tidak ada hasil */}
                      {alamatOptions.filter((item) =>
                        item.toLowerCase().includes(searchAlamat.toLowerCase())
                      ).length === 0 && (
                        <li className="px-3 py-2 text-gray-400 italic">
                          Alamat tidak ditemukan
                        </li>
                      )}
                    </ul>
                  )}
                </div>

                {/* RT (readonly) */}
                <div className="relative w-full">
                  <input
                    type="text"
                    placeholder="RT"
                    value={formData.rt ?? userRt ?? ""}
                    readOnly
                    className="border rounded px-3 py-2 w-full bg-gray-100 cursor-not-allowed focus:outline-none"
                  />
                </div>

                {/* RW (readonly) */}
                <div className="relative w-full">
                  <input
                    type="text"
                    placeholder="RW"
                    value={formData.rw ?? userRw ?? ""}
                    readOnly
                    className="border rounded px-3 py-2 w-full bg-gray-100 cursor-not-allowed focus:outline-none"
                  />
                </div>

                {/* Status Dalam Keluarga */}
                <div className="relative w-full">
                  <input
                    type="text"
                    placeholder="-- Pilih Status Dalam Keluarga --"
                    value={searchStatus}
                    onChange={(e) => {
                      setSearchStatus(e.target.value);
                      setShowStatusDropdown(true);
                    }}
                    onClick={() => setShowStatusDropdown(true)}
                    onFocus={() => setShowStatusDropdown(true)}
                    onBlur={() => setTimeout(() => setShowStatusDropdown(false), 200)}
                    className="w-full border rounded px-3 py-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-400"
                  />

                  {showStatusDropdown && (
                    <ul className="absolute z-10 w-full bg-white border rounded shadow max-h-40 overflow-y-auto">
                      {statusOptions
                        .filter((item) => item.toLowerCase().includes(searchStatus.toLowerCase()))
                        .map((item, index) => (
                          <li
                            key={index}
                            onMouseDown={() => {
                              setFormData({ ...formData, status_keluarga: item });
                              setSearchStatus(item);
                              setShowStatusDropdown(false);
                            }}
                            className="px-3 py-2 hover:bg-green-100 cursor-pointer"
                          >
                            {item}
                          </li>
                        ))}
                      {statusOptions.filter((item) => item.toLowerCase().includes(searchStatus.toLowerCase())).length === 0 && (
                        <li className="px-3 py-2 text-gray-400 italic">Tidak ditemukan</li>
                      )}
                    </ul>
                  )}
                </div>

                {/* Data Orang Tua */}
                <input
                  type="text"
                  placeholder="NIK Ayah"
                  value={formData.nik_ayah}
                  onChange={(e) => setFormData({ ...formData, nik_ayah: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
                <input
                  type="text"
                  placeholder="Nama Ayah"
                  value={formData.nama_ayah}
                  onChange={(e) => setFormData({ ...formData, nama_ayah: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
                <input
                  type="text"
                  placeholder="NIK Ibu"
                  value={formData.nik_ibu}
                  onChange={(e) => setFormData({ ...formData, nik_ibu: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
                <input
                  type="text"
                  placeholder="Nama Ibu"
                  value={formData.nama_ibu}
                  onChange={(e) => setFormData({ ...formData, nama_ibu: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />

                {/* Desa / Kecamatan / Kabupaten - atur jadi 3 kolom agar lebar sama */}
                <div className="col-span-2 grid grid-cols-3 gap-4">
                  <input
                    type="text"
                    placeholder="Desa"
                    value="Margahayu Tengah"
                    readOnly
                    className="w-full border rounded px-3 py-2 bg-gray-100"
                  />
                  <input
                    type="text"
                    placeholder="Kecamatan"
                    value="Margahayu"
                    readOnly
                    className="w-full border rounded px-3 py-2 bg-gray-100"
                  />
                  <input
                    type="text"
                    placeholder="Kabupaten"
                    value="Bandung"
                    readOnly
                    className="w-full border rounded px-3 py-2 bg-gray-100"
                  />
                  <input
                    type="text"
                    placeholder="Provinsi"
                    value="Jawa Barat"
                    readOnly
                    className="w-full border rounded px-3 py-2 bg-gray-100"
                  />
                  <input
                    type="text"
                    placeholder="Kode Pos"
                    value="40225"
                    readOnly
                    className="w-full border rounded px-3 py-2 bg-gray-100"
                  />
                </div>

                {/* Input Tanggal Datang */}
                <div className="relative w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Datang</label>
                  <input
                    type="date"
                    value={formData.tanggal_datang}
                    onChange={(e) => setFormData({ ...formData, tanggal_datang: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </form>

              <div className="flex justify-end mt-4 space-x-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">
                  Batal
                </button>
                <button type="button" onClick={handleSimpan} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                  Simpan
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}

export default DataPendatang;
