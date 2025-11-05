import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Eye, Edit, Trash2, UserPlus, FileText } from "lucide-react";
import supabase from "../../../supabaseClient";

function Data_Pendatang() {
// data & state
const [allData, setAllData] = useState([]);
const [filteredData, setFilteredData] = useState([]); // <- penting
const [entriesPerPage, setEntriesPerPage] = useState(50);
const [selectedIds, setSelectedIds] = useState([]);
const [selectAll, setSelectAll] = useState(false);
const [currentPage, setCurrentPage] = useState(1);
const [loading, setLoading] = useState(false);

const [dataPenduduk, setDataPenduduk] = useState([]);

// modal add (sederhana)
const [isModalOpen, setIsModalOpen] = useState(false);
const [formData, setFormData] = useState({
  no_kk: "", nik: "", nama: "", tempat_lahir: "", tanggal_lahir: "", jk: "",
  golongan_darah: "", agama: "", status_perkawinan: "", pendidikan: "", pekerjaan: "",
  alamat: "", rt: "", rw: "", status_keluarga: "", nik_ayah: "", nama_ayah: "",
  nik_ibu: "", nama_ibu: "", desa: "", kecamatan: "", kabupaten: "", provinsi: "", 
  kode_pos: "", tanggal_datang: "", keterangan: ""
});

// RW/RT filter states (diambil dari tabel users)
const [rwOptions, setRwOptions] = useState([]);
const [rtOptions, setRtOptions] = useState([]); // untuk selectedRw
const [rtMap, setRtMap] = useState({}); // { rw: [rt...] }
const [selectedRw, setSelectedRw] = useState("");
const [selectedRt, setSelectedRt] = useState("");

// user RT/RW (dari users, untuk pembatasan jika ada)
const [userRt, setUserRt] = useState("");
const [userRw, setUserRw] = useState("");

// dropdown / helper UI states
const [showDropdown, setShowDropdown] = useState(false);
const [showJKDropdown, setShowJKDropdown] = useState(false);
const [searchJK, setSearchJK] = useState("");
const jkOptions = ["Laki-laki", "Perempuan"];
const [showAlamatDropdown, setShowAlamatDropdown] = useState(false);
const [searchAlamat, setSearchAlamat] = useState("");
const [customAlamat, setCustomAlamat] = useState("");
const [showCustomInput, setShowCustomInput] = useState(false);
const [showRtDropdown, setShowRtDropdown] = useState(false);
const [searchRt, setSearchRt] = useState("");
const rtListStatic = Array.from({ length: 10 }, (_, i) => (i + 1).toString().padStart(2, "0"));
const [showRwDropdown, setShowRwDropdown] = useState(false);
const [searchRw, setSearchRw] = useState("");
const rwListStatic = Array.from({ length: 20 }, (_, i) => (i + 1).toString().padStart(2, "0"));
const [showStatusDropdown, setShowStatusDropdown] = useState(false);
const [searchStatus, setSearchStatus] = useState("");
const statusOptions = [
  "Kepala Keluarga","Suami","Istri","Anak","Orang Tua","Mertua","Cucu","Menantu","Pembantu","Family Lain"
];
const [showAgamaDropdown, setShowAgamaDropdown] = useState(false);
const [searchAgama, setSearchAgama] = useState("");
const agamaOptions = ["Islam","Kristen","Katholik","Hindu","Budha","Konghucu"];
const [showStatusPerkawinanDropdown, setShowStatusPerkawinanDropdown] = useState(false);
const [searchStatusPerkawinan, setSearchStatusPerkawinan] = useState("");
const statusPerkawinanOptions = [
  "Belum Kawin","Kawin Tercatat","Kawin Tidak Tercatat","Cerai Hidup","Cerai Mati"
];
const [showPendidikanDropdown, setShowPendidikanDropdown] = useState(false);
const [searchPendidikan, setSearchPendidikan] = useState("");
const pendidikanOptions = [
  "Tidak/Belum Sekolah","Belum Tamat SD/Sederajat","Tamat SD/Sederajat","SLTP/Sederajat","SLTA/Sederajat",
  "Diploma I/II","Akademi I/Diploma III/S.Muda","Diploma IV/Strata I","Strata II","Strata III"
];

const [searchPekerjaan, setSearchPekerjaan] = useState("");
const pekerjaanOptions = [
  "Belum/Tidak Bekerja","Mengurus Rumah Tangga","Pelajar/Mahasiswa","Pensiunan",
  "Pegawai Negeri Sipil","Tentara Nasional Indonesia","Kepolisian RI","Perdagangan","Petani/Pekebun","Peternak",
  "Nelayan/Perikanan","Industri","Kontruksi","Transportasi","Karyawan Swasta","Karyawan BUMN","Karyawan BUMD",
  "Karyawan Honorer","Buruh Harian Lepas","Buruh Tani/Perkebunan","Buruh Nelayan/Perikanan","Buruh Peternakan",
  "Pembantu Rumah Tangga","Tukang Cukur","Tukang Listrik","Tukang Batu","Tukang Kayu","Tukang Sol Sepatu",
  "Tukang Las/Pandai Besi","Tukang Jahit","Tukang Gigi","Penata Rias","Penata Busana","Penata Rambut","Mekanik",
  "Seniman","Tabib","Paraji","Perancang Busana","Penterjemah","Imam Masjid","Pendeta","Pastor","Wartawan",
  "Ustadz/Mubaligh","Juru Masak","Promotor Acara","Dosen","Guru","Pilot","Pengacara","Notaris","Arsitek","Akuntan",
  "Konsultan","Dokter","Bidan","Perawat","Apoteker","Psikiater/Psikolog","Penyiar Televisi","Penyiar Radio","Pelaut",
  "Peneliti","Sopir","Pialang","Paranormal","Pedagang","Perangkat Desa","Kepala Desa","Wiraswasta"
];

// Array alamat (static)
const alamatOptions = [
  "Jl. Sadang","Kp. Sadang","Pasantren","Kp. Pasantren","Kopo Bihbul","Jl. Kopo Bihbul",
  "Nata Endah","Komp. Nata Endah","Taman Kopo Indah","Komp. Taman Kopo Indah","Bbk. Tasikmalaya",
  "Kp. Bbk. Tasikmalaya","Sekeloa Girang","Jl. Sekeloa Girang","Perum Linggahara","Kp. Margamulya",
  "Komp. Nata Endah Gg. Margamulya"
];

const location = useLocation();
const navigate = useNavigate();

// helper utils
const capitalize = (str = "") =>
  str
    .trim()
    .split(" ")
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");

const emptyToNull = (value) => (value === "" ? null : value);

// ----------------- Fetch & init functions -----------------

// ambil users untuk buat RW list dan RT per RW (sinkron dengan DB users)
const fetchUsersForRwRt = async () => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("rw,rt")
      .order("rw", { ascending: true })
      .order("rt", { ascending: true });

    if (error) {
      console.error("Gagal fetch users (rw/rt):", error);
      return;
    }

    const users = data || [];
    const rwSet = new Set();
    const rtByRw = {};

    users.forEach((u) => {
      const rw = String(u.rw ?? "").trim();
      const rt = String(u.rt ?? "").trim();
      if (!rw) return;
      rwSet.add(rw);
      if (!rtByRw[rw]) rtByRw[rw] = new Set();
      if (rt) rtByRw[rw].add(rt);
    });

    const rwList = Array.from(rwSet).sort();
    const rtMapObj = {};
    Object.keys(rtByRw).forEach((rw) => {
      rtMapObj[rw] = Array.from(rtByRw[rw]).sort();
    });

    setRwOptions(rwList);
    setRtMap(rtMapObj);

    // jika URL sudah punya rw param, sesuaikan rtOptions
    const params = new URLSearchParams(location.search);
    const rwParam = params.get("rw") || "";
    const rtParam = params.get("rt") || "";
    if (rwParam) {
      setSelectedRw(rwParam);
      setRtOptions(rtMapObj[rwParam] || []);
      if (rtParam) setSelectedRt(rtParam);
    }
  } catch (err) {
    console.error("Error fetchUsersForRwRt:", err);
  }
};

// Ambil user RT/RW (dipanggil saat mount) — menyimpan ke state dan mengisi form default RT/RW
const fetchUserRtRw = async () => {
  try {
    const rawId = localStorage.getItem("userId");
    if (!rawId) {
      // tidak harus error — aplikasi boleh jalan tanpa userId
      return;
    }
    const userId = Number(rawId);

    const { data, error } = await supabase
      .from("users")
      .select("rt, rw")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Gagal ambil RT/RW dari users:", error);
      return;
    }

    setUserRt(data?.rt || "");
    setUserRw(data?.rw || "");

    setFormData(prev => ({
      ...prev,
      rt: data?.rt || prev.rt || "",
      rw: data?.rw || prev.rw || "",
    }));
  } catch (err) {
    console.error("Error saat fetch user RT/RW:", err);
  }
};

// helper untuk fetch data_pendatang (memperhitungkan URL params, tapi jika tidak ada param gunakan userRt/userRw)
const fetchDataPendatang = async () => {
  try {
    setLoading(true);
    const params = new URLSearchParams(location.search);
    const keyword = params.get("keyword")?.trim() || "";
    const filterRw = params.get("rw") || "";
    const filterRt = params.get("rt") || "";

    // prefer URL params — jika tidak ada, gunakan userRt/userRw
    const rwFilter = filterRw || userRw || null;
    const rtFilter = filterRt || userRt || null;

    let query = supabase.from("data_pendatang").select("*").order("id", { ascending: true });

    if (keyword) {
      query = query.or(`nik.ilike.*${keyword}*,nama.ilike.*${keyword}*`);
    }

    if (rwFilter) query = query.eq("rw", rwFilter);
    if (rtFilter) query = query.eq("rt", rtFilter);

    const { data, error } = await query;
    if (error) {
      console.error("Error fetching data_pendatang:", error);
      setAllData([]);
      setFilteredData([]);
    } else {
      const arr = data || [];
      setAllData(arr);
      setFilteredData(arr); // default filtered = all fetched
      setCurrentPage(1);
    }
  } catch (err) {
    console.error("Unexpected error fetchDataPendatang:", err);
    setAllData([]);
    setFilteredData([]);
  } finally {
    setLoading(false);
  }
};

// ----------------- Effects -----------------

// initial mount & when location.search changes OR when userRt/userRw become available
useEffect(() => {
  const init = async () => {
    await fetchUsersForRwRt();
    await fetchUserRtRw(); // set userRt/userRw sebelum fetchDataPendatang agar bisa dipakai
    await fetchDataPendatang();
  };
  init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [location.search]);

// update rtOptions when selectedRw or rtMap changes
useEffect(() => {
  if (selectedRw) {
    setRtOptions(rtMap[selectedRw] || []);
  } else {
    setRtOptions([]);
  }
}, [selectedRw, rtMap]);

// ----------------- Pagination derived -----------------
const totalPages = Math.max(1, Math.ceil(filteredData.length / entriesPerPage));
const startIndex = (currentPage - 1) * entriesPerPage;
const displayedData = filteredData.slice(startIndex, startIndex + entriesPerPage);

// pagination controls
const handlePrevious = () => { if (currentPage > 1) setCurrentPage(currentPage - 1); };
const handleNext = () => { if (currentPage < totalPages) setCurrentPage(currentPage + 1); };

// ----------------- Selection helpers -----------------
const toggleSelect = (id) => {
  if (selectedIds.includes(id)) {
    setSelectedIds(selectedIds.filter((i) => i !== id));
  } else {
    setSelectedIds([...selectedIds, id]);
  }
};

const toggleSelectAll = () => {
  if (selectAll) {
    setSelectedIds([]);
    setSelectAll(false);
  } else {
    const allIds = displayedData.map((d) => d.id);
    setSelectedIds(allIds);
    setSelectAll(true);
  }
};

// ----------------- Delete single -----------------
const handleHapus = async (id) => {
  if (!window.confirm("Apakah Anda yakin ingin menghapus data ini?")) return;

  const { error } = await supabase.from("data_pendatang").delete().eq("id", id);
  if (error) {
    alert("Gagal menghapus data!\n" + JSON.stringify(error.message));
  } else {
    setAllData(allData.filter(item => item.id !== id));
    setFilteredData(filteredData.filter(item => item.id !== id));
    setSelectedIds(selectedIds.filter(selected => selected !== id));
  }
};

// ----------------- Delete many -----------------
const handleDeleteMany = async () => {
  if (selectedIds.length === 0) {
    alert("Pilih data yang ingin dihapus!");
    return;
  }

  const confirmDelete = window.confirm(`Yakin ingin menghapus ${selectedIds.length} data terpilih?`);
  if (!confirmDelete) return;

  try {
    const { error } = await supabase
      .from("data_pendatang")
      .delete()
      .in("id", selectedIds);

    if (error) throw error;

    setAllData(allData.filter((item) => !selectedIds.includes(item.id)));
    setFilteredData(filteredData.filter((item) => !selectedIds.includes(item.id)));
    setSelectedIds([]);
    setSelectAll(false);
    alert("Data terpilih berhasil dihapus!");
  } catch (err) {
    console.error("Gagal menghapus data:", err);
    alert("Terjadi kesalahan saat menghapus data.");
  }
};

// ----------------- Save (insert) -----------------
const handleSimpan = async () => {
  try {
    // 1. Validasi data wajib
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

    // 2. Cek NIK duplikat di data_penduduk
    const { data: cekNik, error: errCekNik } = await supabase
      .from("data_penduduk")
      .select("nik")
      .eq("nik", formData.nik);

    if (errCekNik) throw errCekNik;
    if (cekNik && cekNik.length > 0) {
      alert("⚠️ NIK sudah terdaftar. Gunakan NIK lain!");
      return;
    }

    // 3. Tentukan alamat final
    let finalAlamat = formData.alamat;
    let finalAlamatDetail = null;
    if (searchAlamat === "Lainnya") {
      if (!customAlamat.trim()) {
        alert("⚠️ Alamat detail wajib diisi jika memilih 'Lainnya'!");
        return;
      }
      finalAlamat = "Lainnya";
      finalAlamatDetail = customAlamat.trim();
    }

    // 4. Data untuk insert ke data_penduduk
    const dataToInsertPenduduk = {
      no_kk: formData.no_kk,
      nik: formData.nik,
      nama: formData.nama,
      tempat_lahir: formData.tempat_lahir,
      tanggal_lahir: emptyToNull(formData.tanggal_lahir),
      jk: formData.jk,
      golongan_darah: formData.golongan_darah,
      agama: formData.agama,
      status_perkawinan: formData.status_perkawinan,
      pendidikan: formData.pendidikan,
      pekerjaan: formData.pekerjaan,
      alamat: finalAlamat,
      rt: emptyToNull(formData.rt),
      rw: emptyToNull(formData.rw),
      status_keluarga: formData.status_keluarga,
      nik_ayah: emptyToNull(formData.nik_ayah),
      nama_ayah: formData.nama_ayah,
      nik_ibu: emptyToNull(formData.nik_ibu),
      nama_ibu: formData.nama_ibu,
      desa: capitalize(formData.desa || "Margahayu Tengah"),
      kecamatan: capitalize(formData.kecamatan || "Margahayu"),
      kabupaten: capitalize(formData.kabupaten || "Bandung"),
      provinsi: capitalize(formData.provinsi || "Jawa Barat"),
      kode_pos: capitalize(formData.kode_pos || "40225")
    };

    // 5. Insert ke data_penduduk
    const { data: insertedPenduduk, error: errInsertPenduduk } = await supabase
      .from("data_penduduk")
      .insert([dataToInsertPenduduk])
      .select();

    if (errInsertPenduduk) throw errInsertPenduduk;

    // 6. Data untuk insert ke data_pendatang
    const dataToInsertPendatang = {
      no_kk: formData.no_kk,
      nik: formData.nik || null,
      nama: formData.nama,
      tempat_lahir: formData.tempat_lahir || null,
      tanggal_lahir: emptyToNull(formData.tanggal_lahir),
      jk: formData.jk,
      golongan_darah: formData.golongan_darah,
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
      tanggal_datang: emptyToNull(formData.tanggal_datang),
    };

    // 7. Insert ke data_pendatang
    const { data: insertedPendatang, error: errInsertPendatang } = await supabase
      .from("data_pendatang")
      .insert([dataToInsertPendatang])
      .select();

    if (errInsertPendatang) {
      console.error("Gagal insert ke data_pendatang:", JSON.stringify(errInsertPendatang, null, 2));
      alert("⚠️ Data berhasil disimpan ke penduduk, tapi gagal ke pendatang!");
      return;
    }

    // 8. Update state dan reset form
    if (insertedPendatang && insertedPendatang.length > 0) {
      setAllData((prev) => [...prev, ...insertedPendatang]);
      setFilteredData((prev) => [...prev, ...insertedPendatang]);
    }

    // Reset form
    setFormData({
      no_kk: "", nik: "", nama: "", tempat_lahir: "", tanggal_lahir: "", jk: "",
      golongan_darah: "", agama: "", status_perkawinan: "", pendidikan: "", pekerjaan: "",
      alamat: "", rt: "", rw: "", status_keluarga: "", nik_ayah: "", nama_ayah: "",
      nik_ibu: "", nama_ibu: "", desa: "", kecamatan: "", kabupaten: "", provinsi: "",
      kode_pos: "", tanggal_datang: "", keterangan: ""
    });
    setSearchAlamat("");
    setCustomAlamat("");
    setShowCustomInput(false);
    setIsModalOpen(false);

    alert("✅ Data berhasil disimpan ke penduduk dan pendatang!");
  } catch (err) {
    console.error("Error handleSimpan:", err);
    alert("Terjadi kesalahan: " + (err.message || err));
  }
};

// ----------------- Filters -> update URL -----------------
const applyFiltersToUrl = () => {
  const params = new URLSearchParams(location.search);

  if (selectedRw) params.set("rw", selectedRw);
  else params.delete("rw");

  if (selectedRt) params.set("rt", selectedRt);
  else params.delete("rt");

  const searchString = params.toString();
  navigate(`${location.pathname}${searchString ? `?${searchString}` : ""}`, { replace: true });
};

const clearFilters = () => {
  setSelectedRw("");
  setSelectedRt("");
  const params = new URLSearchParams(location.search);
  params.delete("rw");
  params.delete("rt");
  const searchString = params.toString();
  navigate(`${location.pathname}${searchString ? `?${searchString}` : ""}`, { replace: true });
};

  return (
    <div className="p-6 bg-white rounded-lg shadow relative">
      {/* Header */}
      <div className="flex items-center bg-green-500 text-white px-4 py-3 rounded-t-lg">
        <FileText className="w-5 h-5 mr-2" />
        <h1 className="text-lg font-semibold">Data Pendatang</h1>
      </div>

      {/* Filters + actions */}
      <div className="flex justify-between items-center mt-4 mb-4">
        <div className="flex items-center space-x-4">
          {/* entries */}
          <div className="flex items-center space-x-2">
            <span className="text-sm">Show</span>
            <select value={entriesPerPage} onChange={(e) => setEntriesPerPage(Number(e.target.value))}
              className="appearance-none bg-gray-200 border rounded px-2 py-1 text-sm pr-6 focus:outline-none">
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-sm">entries</span>
          </div>

          {/* RW/RT filters */}
          <div className="flex items-center space-x-2">
            <select
              value={selectedRw}
              onChange={(e) => { setSelectedRw(e.target.value); setSelectedRt(""); }}
              className="border rounded px-2 py-1"
            >
              <option value="">Semua RW</option>
              {rwOptions.map((rw) => <option key={rw} value={rw}>{rw}</option>)}
            </select>

            <select
              value={selectedRt}
              onChange={(e) => setSelectedRt(e.target.value)}
              className="border rounded px-2 py-1"
              disabled={!selectedRw}
            >
              <option value="">Semua RT</option>
              {rtOptions.map((rt) => <option key={rt} value={rt}>{rt}</option>)}
            </select>

            <button onClick={applyFiltersToUrl} className="px-3 py-1 bg-blue-600 text-white rounded">Filter</button>
            <button onClick={clearFilters} className="px-3 py-1 bg-gray-300 rounded">Clear</button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button onClick={() => setIsModalOpen(true)} className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
            <UserPlus className="w-5 h-5 mr-2" /> Tambah
          </button>
          <button onClick={handleDeleteMany} disabled={selectedIds.length === 0}
            className="flex items-center bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50">
            <Trash2 className="w-5 h-5 mr-2" /> Hapus Terpilih
          </button>
        </div>
      </div>

      {/* Tabel */}
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-200">
          <thead className="bg-green-700 text-white">
            <tr>
              <th className="px-4 py-2 border text-center">
                <input type="checkbox" checked={selectedIds.length === displayedData.length && displayedData.length > 0} onChange={toggleSelectAll} />
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
              <tr><td colSpan={9} className="text-center py-4 text-gray-500">Memuat data...</td></tr>
            ) : displayedData.length === 0 ? (
              <tr><td colSpan={9} className="text-center py-4 text-gray-500">Tidak ada data</td></tr>
            ) : (
              [...displayedData].sort((a,b)=>b.id-a.id).map((item, idx) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border text-center">
                    <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => toggleSelect(item.id)} />
                  </td>
                  <td className="px-4 py-2 border text-center">{startIndex + idx + 1}</td>
                  <td className="px-4 py-2 border text-center">{item.nik}</td>
                  <td className="px-4 py-2 border text-center">{item.no_kk}</td>
                  <td className="px-4 py-2 border text-center">{item.nama}</td>
                  <td className="px-4 py-2 border text-center">{item.jk}</td>
                  <td className="px-4 py-2 border text-center">{item.tanggal_datang}</td>
                  <td className="px-4 py-2 border text-center">
                    <div className="flex justify-center space-x-2">
                      <Link to={`/admin/sirkulasi_penduduk/data_pendatang/${item.id}`} className="p-2 text-blue-600 hover:bg-blue-100 rounded-full"><Eye className="w-4 h-4" /></Link>
                      <Link to={`/admin/sirkulasi_penduduk/data_pendatang/edit/${item.id}`} className="p-2 text-yellow-600 hover:bg-yellow-100 rounded-full"><Edit className="w-4 h-4" /></Link>
                      <button onClick={() => handleHapus(item.id)} className="p-2 text-red-600 hover:bg-red-100 rounded-full"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <span className="text-sm">
          Showing {filteredData.length === 0 ? 0 : startIndex + 1} to {Math.min(startIndex + entriesPerPage, filteredData.length)} of {filteredData.length} entries
        </span>

        <div className="space-x-2 flex items-center">
          <button onClick={handlePrevious} disabled={currentPage === 1} className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50">Previous</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(num => (
            <button key={num} onClick={() => setCurrentPage(num)} className={`px-3 py-1 rounded ${currentPage === num ? "bg-green-500 text-white" : "bg-gray-200"}`}>{num}</button>
          ))}
          <button onClick={handleNext} disabled={currentPage === totalPages || totalPages === 0} className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50">Next</button>
        </div>
      </div>

      {/* Modal Tambah (sederhana) */}
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
              {/* RW Dropdown */}
              <div className="relative w-full">
                <select
                  value={formData.rw || ""}
                  onChange={(e) => {
                    const newRw = e.target.value;
                    setFormData({ ...formData, rw: newRw, rt: "" }); // reset RT kalau RW berubah
                    setSelectedRw(newRw);
                    setRtOptions(rtMap[newRw] || []);
                  }}
                  className="border rounded px-3 py-2 w-full focus:outline-none"
                >
                  <option value="">Pilih RW</option>
                  {rwOptions.map((rw) => (
                    <option key={rw} value={rw}>
                      {rw}
                    </option>
                  ))}
                </select>
              </div>

              {/* RT Dropdown */}
              <div className="relative w-full">
                <select
                  value={formData.rt || ""}
                  onChange={(e) => setFormData({ ...formData, rt: e.target.value })}
                  className="border rounded px-3 py-2 w-full focus:outline-none"
                  disabled={!formData.rw} // harus pilih RW dulu
                >
                  <option value="">Pilih RT</option>
                  {rtOptions.map((rt) => (
                    <option key={rt} value={rt}>
                      {rt}
                    </option>
                  ))}
                </select>
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
                <div className="col-span-2 grid grid-cols-4 gap-4">
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

export default Data_Pendatang;
