import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Eye, Edit, Trash2, UserPlus, FileText, MessageCircle  } from "lucide-react";
import supabase from "../../../supabaseClient";
import { Upload } from "lucide-react"; // pastikan sudah import icon

function DataPenduduk() {
// ================= STATES =================
const [allData, setAllData] = useState([]);
const [kepalaKeluarga, setKepalaKeluarga] = useState([]);
const [formData, setFormData] = useState({
  no_kk: "", nik: "", nama: "", tempat_lahir: "", tanggal_lahir: "", jk: "",
  agama: "", status_perkawinan: "", pendidikan: "", pekerjaan: "", pekerjaanLain: "",
  alamat: "", rt: "", rw: "", status_keluarga: "", nik_ayah: "", nama_ayah: "",
  nik_ibu: "", nama_ibu: "", golongan_darah: "", desa: "", kecamatan: "", kabupaten: "", 
  provinsi: "", kode_pos: "", tanggal_pindah: "", alasan: "", alasan_lain: "", alamat_pindah: "", rt_pindah: "", 
  rw_pindah: "", desa_pindah: "", kecamatan_pindah: "", kabupaten_pindah: "", provinsi_pindah: "",
  kodepos_pindah: "", jenis_pindah: "", statuskk_tidakpindah: "", statuskk_pindah: "",
  tanggal_kematian: "", sebab: "", tempat_kematian: "", hari_kematian: "", pukul_kematian: "", status_verifikasi: ""
});
const [formDataList, setFormDataList] = useState([]);
const [customAlamat, setCustomAlamat] = useState("");
const [searchAlamat, setSearchAlamat] = useState("");
const [selectedIds, setSelectedIds] = useState([]);
const [selectAll, setSelectAll] = useState(false);
const [isModalOpen, setIsModalOpen] = useState(false);
const [showDeleteModal, setShowDeleteModal] = useState(false);
const [deleteType, setDeleteType] = useState(""); // "pindah" | "mati" | "duplikat"
const [deleteMode, setDeleteMode] = useState("single"); // "single" | "multiple"
const [isPindahModalOpen, setIsPindahModalOpen] = useState(false);
const [isKematianModalOpen, setIsKematianModalOpen] = useState(false);
const [targetId, setTargetId] = useState(null);
const [loading, setLoading] = useState(true);
const [currentPage, setCurrentPage] = useState(1);
const [entriesPerPage, setEntriesPerPage] = useState(500);
const [rtRwLoaded, setRtRwLoaded] = useState(false);
const [hasUserId, setHasUserId] = useState(null); // null = belum dicek, true/false = sudah dicek
const [dataFetched, setDataFetched] = useState(false); // menandai fetch data selesai

// Dropdown states
const [showCustomInput, setShowCustomInput] = useState(false);
const [inputManual, setInputManual] = useState(false);
const [showDropdown, setShowDropdown] = useState(false);
const [showKKDropdown, setShowKKDropdown] = useState(false);
const [searchKK, setSearchKK] = useState("");
const [selectedKK, setSelectedKK] = useState(null);
const [showJKDropdown, setShowJKDropdown] = useState(false);
const [searchJK, setSearchJK] = useState("");
const [showStatusDropdown, setShowStatusDropdown] = useState(false);
const [searchStatus, setSearchStatus] = useState("");
const [showAgamaDropdown, setShowAgamaDropdown] = useState(false);
const [searchAgama, setSearchAgama] = useState("");
const [showStatusPerkawinanDropdown, setShowStatusPerkawinanDropdown] = useState(false);
const [searchStatusPerkawinan, setSearchStatusPerkawinan] = useState("");
const [showPendidikanDropdown, setShowPendidikanDropdown] = useState(false);
const [searchPendidikan, setSearchPendidikan] = useState("");
const [showAlamatDropdown, setShowAlamatDropdown] = useState(false);
const [searchPekerjaan, setSearchPekerjaan] = useState("");
const [userRt, setUserRt] = useState("");
const [userRw, setUserRw] = useState("");
const [tanggalPindah, setTanggalPindah] = useState("");
const [alasanPindah, setAlasanPindah] = useState("");
const [alasanLain, setAlasanLain] = useState("");
const [alamatPindah, setAlamatPindah] = useState("");
const [rtPindah, setRtPindah] = useState("");
const [rwPindah, setRwPindah] = useState("");
const [desaPindah , setDesaPindah] = useState("");
const [kecamatanPindah, setKecamatanPindah] = useState("");
const [kabupatenPindah, setKabupatenPindah] = useState("");
const [provinsiPindah, setprovinsiPindah] = useState("");
const [kodeposPindah, setkodeposPindah] = useState("");
const [jenisPindah, setjenisPindah] = useState("");
const [statustidakPindah, setstatustidakPindah] = useState("");
const [statusPindah, setStatusPindah] = useState("");

// ================= OPTIONS =================
const jkOptions = ["Laki-laki", "Perempuan"];
const statusOptions = ["Kepala Keluarga","Suami","Istri","Anak","Orang Tua","Mertua","Cucu","Menantu","Pembantu","Family Lain"];
const agamaOptions = ["Islam","Kristen","Katholik","Hindu","Budha","Konghucu"];
const statusPerkawinanOptions = ["Belum Kawin","Kawin Tercatat","Kawin Tidak Tercatat","Cerai Hidup","Cerai Mati"];
const pendidikanOptions = ["Tidak/Belum Sekolah","Belum Tamat SD/Sederajat","Tamat SD/Sederajat","SLTP/Sederajat","SLTA/Sederajat","Diploma I/II","Akademi I/Diploma III/S.Muda","Diploma IV/Strata I","Strata II","Strata III"];
const alamatOptions = ["Jl. Sadang","Kp. Sadang","Pasantren","Kp. Pasantren","Kopo Bihbul","Jl. Kopo Bihbul","Nata Endah","Komp. Nata Endah","Taman Kopo Indah","Komp. Taman Kopo Indah","Bbk. Tasikmalaya","Kp. Bbk. Tasikmalaya","Sekeloa Girang","Jl. Sekeloa Girang","Perum Linggahara","Kp. Margamulya","Komp. Nata Endah Gg. Margamulya"];
const pekerjaanOptions = [
  "Belum/Tidak Bekerja",
  "Mengurus Rumah Tangga",
  "Pelajar/Mahasiswa",
  "Pensiunan",
  "Pegawai Negeri Sipil",
  "Tentara Nasional Indonesia",
  "Kepolisian RI",
  "Perdagangan",
  "Petani/Pekebun",
  "Peternak",
  "Nelayan/Perikanan",
  "Industri",
  "Kontruksi",
  "Transportasi",
  "Karyawan Swasta",
  "Karyawan BUMN",
  "Karyawan BUMD",
  "Karyawan Honorer",
  "Buruh Harian Lepas",
  "Buruh Tani/Perkebunan",
  "Buruh Nelayan/Perikanan",
  "Buruh Peternakan",
  "Pembantu Rumah Tangga",
  "Tukang Cukur",
  "Tukang Listrik",
  "Tukang Batu",
  "Tukang Kayu",
  "Tukang Sol Sepatu",
  "Tukang Las/Pandai Besi",
  "Tukang Jahit",
  "Tukang Gigi",
  "Penata Rias",
  "Penata Busana",
  "Penata Rambut",
  "Mekanik",
  "Seniman",
  "Tabib",
  "Paraji",
  "Perancang Busana",
  "Penterjemah",
  "Imam Masjid",
  "Pendeta",
  "Pastor",
  "Wartawan",
  "Ustadz/Mubaligh",
  "Juru Masak",
  "Promotor Acara",
  "Anggota DPR-RI",
  "Anggota DPD",
  "Anggota BPK",
  "Presiden",
  "Wakil Presiden",
  "Anggota Mahkamah Konstitusi",
  "Anggota Kabinet Kementrian",
  "Duta Besar",
  "Gubernur",
  "Wakil Gubernur",
  "Bupati",
  "Wakil Bupati",
  "Walikota",
  "Wakil Walikota",
  "Anggota DPRD Prop.",
  "Anggota DPRD Kab. Kota",
  "Dosen",
  "Guru",
  "Pilot",
  "Pengacara",
  "Notaris",
  "Arsitek",
  "Akuntan",
  "Konsultan",
  "Dokter",
  "Bidan",
  "Perawat",
  "Apoteker",
  "Psikiater/Psikolog",
  "Penyiar Televisi",
  "Penyiar Radio",
  "Pelaut",
  "Peneliti",
  "Sopir",
  "Pialang",
  "Paranormal",
  "Pedagang",
  "Perangkat Desa",
  "Kepala Desa",
  "Biarawati",
  "Wiraswasta",
];
const location = useLocation();
const navigate = useNavigate();

// ================= UTILITIES =================
const capitalize = (str = "") =>
  str.trim().split(" ").filter(Boolean).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
const emptyToNull = value => value === "" ? null : value;

// ================= PAGINATION =================
const totalPages = Math.ceil(allData.length / entriesPerPage);
const displayedData = allData.slice((currentPage - 1) * entriesPerPage, currentPage * entriesPerPage);
const handlePrevious = () => { if(currentPage>1) setCurrentPage(currentPage-1); };
const handleNext = () => { if(currentPage<totalPages) setCurrentPage(currentPage+1); };

// ================= FETCH USER RT/RW =================
useEffect(() => {
  const fetchUserRtRw = async () => {
    try {
      setLoading(true);
      const rawId = localStorage.getItem("userId");
      if(!rawId) { setHasUserId(false); setRtRwLoaded(true); setLoading(false); return; }
      const userId = Number(rawId);
      const { data, error } = await supabase.from("users").select("rt,rw").eq("id", userId).single();
      if(error) { console.error(error); setHasUserId(true); setRtRwLoaded(true); setLoading(false); return; }
      setUserRt(data?.rt || ""); setUserRw(data?.rw || "");
      setFormData(prev => ({ ...prev, rt: data?.rt || "", rw: data?.rw || "" }));
      setHasUserId(true); setRtRwLoaded(true);
    } catch(err) { console.error(err); setHasUserId(true); setRtRwLoaded(true); } 
    finally { setLoading(false); }
  };
  fetchUserRtRw();
}, []);

// ================= FETCH DATA PENDUDUK =================
const fetchData = async () => {
  setLoading(true);
  try {
    if (!hasUserId || !userRt || !userRw) {
      setAllData([]);
      setDataFetched(true);
      return;
    }

    const keyword = new URLSearchParams(location.search).get("keyword")?.trim() || "";

    const runQuery = async (rtVal, rwVal) => {
      let q = supabase
        .from("data_penduduk")
        .select("*")
        .eq("rt", rtVal)
        .eq("rw", rwVal);

      if (keyword) {
        const isDigits = /^\d+$/.test(keyword);
        if (isDigits && [12, 15, 16].includes(keyword.length)) {
          q = q.or(`nik.eq.${keyword},no_kk.eq.${keyword}`);
        } else {
          const safeKeyword = keyword.replace(/\s/g, "");
          q = q.or(
            `nama.ilike.%${safeKeyword}%,nik.ilike.%${safeKeyword}%,no_kk.ilike.%${safeKeyword}%`
          );
        }
      }

      // 🔹 Urutkan dari id terbaru
      return await q.order("id_penduduk", { ascending: false });
    };

    let res = await runQuery(userRt, userRw);

    if (!res.data || res.data.length === 0) {
      const fallback = await supabase
        .from("data_penduduk")
        .select("*")
        .limit(10)
        .order("id_penduduk", { ascending: false });
      setAllData(fallback.data || []);
    } else {
      setAllData(res.data || []);
    }

    setDataFetched(true);
  } catch (err) {
    console.error(err);
    setAllData([]);
    setDataFetched(true);
  } finally {
    setLoading(false);
  }
};

// 🔹 Jalankan fetchData otomatis saat dependensi berubah
useEffect(() => {
  if (!rtRwLoaded || hasUserId === null) {
    setLoading(true);
    return;
  }
  fetchData();
}, [location.search, userRt, userRw, rtRwLoaded, hasUserId]);

// ================= FETCH KEPALA KELUARGA =================
useEffect(() => {
  const fetchAllKepalaKK = async () => {
    try {
      if(!userRt||!userRw){ setKepalaKeluarga([]); return; }
      const { data: rows } = await supabase.from("data_penduduk").select("*").eq("rt",userRt).eq("rw",userRw).order("id_penduduk",{ascending:true});
      const grouped = {};
      rows?.forEach(d=>{ if(!grouped[d.no_kk]) grouped[d.no_kk]=[]; grouped[d.no_kk].push(d); });
      const withKepala=[],withoutKepala=[];
      Object.values(grouped).forEach(anggota=>{
        const kepala = anggota.find(a=>(a.status_keluarga||"").toLowerCase().trim()==="kepala keluarga");
        if(kepala) withKepala.push(kepala);
        else withoutKepala.push({...anggota[0], nama:`${anggota[0].nama}`});
      });
      setKepalaKeluarga([...withKepala,...withoutKepala]);
    } catch(err){ console.error(err); setKepalaKeluarga([]); }
  };
  fetchAllKepalaKK();
}, [userRt,userRw]);

// ================= HANDLER SELECT =================
const toggleSelect = id => setSelectedIds(prev=>prev.includes(id)?prev.filter(i=>i!==id):[...prev,id]);
const toggleSelectAll = () => {
  if(selectAll){ setSelectedIds([]); setSelectAll(false); }
  else { setSelectedIds(displayedData.map(d=>d.id_penduduk)); setSelectAll(true); }
};

// ================= HANDLE SIMPAN =================
const handleSimpan = async () => {
  try {
    // 🔹 Validasi input wajib
    if (!formData.no_kk || !formData.nik || !formData.nama) {
      alert("⚠️ No KK, NIK, dan Nama wajib diisi!");
      return;
    }

    // 🔹 Cek NIK duplikat
    const { data: cekNik } = await supabase
      .from("data_penduduk")
      .select("nik")
      .eq("nik", formData.nik);

    if (cekNik?.length > 0) {
      alert("⚠️ NIK sudah terdaftar!");
      return;
    }

    // 🔹 Tentukan nilai akhir pekerjaan & alamat
    const finalPekerjaan =
      ["Jasa Lainnya", "Lainnya"].includes(formData.pekerjaan)
        ? (formData.pekerjaanLain || "").trim()
        : formData.pekerjaan;

    const finalAlamat =
      formData.alamat === "Lainnya" ? customAlamat : formData.alamat;

    // 🔹 Data yang akan dikirim ke kedua tabel
    const commonData = {
      no_kk: formData.no_kk,
      nik: formData.nik,
      nama: formData.nama,
      tempat_lahir: formData.tempat_lahir,
      tanggal_lahir: formData.tanggal_lahir,
      jk: formData.jk,
      agama: formData.agama,
      status_perkawinan: formData.status_perkawinan,
      pendidikan: formData.pendidikan,
      pekerjaan: finalPekerjaan,
      alamat: finalAlamat,
      rt: formData.rt || userRt || null,
      rw: formData.rw || userRw || null,
      status_keluarga: formData.status_keluarga,
      nik_ayah: formData.nik_ayah,
      nama_ayah: formData.nama_ayah,
      nik_ibu: formData.nik_ibu,
      nama_ibu: formData.nama_ibu,
      golongan_darah: formData.golongan_darah,
      desa: "Margahayu Tengah",
      kecamatan: "Margahayu",
      kabupaten: "Bandung",
      provinsi: "Jawa Barat",
      kode_pos: "40225",
      status_verifikasi: "menunggu persetujuan",
      jenis_update: "tambah", // 🔹 otomatis dikirim
    };

    // 🔹 Simpan ke data_penduduk
    const { data: inserted, error } = await supabase
      .from("data_penduduk")
      .insert([commonData])
      .select();

    if (error) throw error;
    if (!inserted?.length) throw new Error("Gagal menyimpan data penduduk");

    const newPenduduk = inserted[0];

    // 🔹 Simpan ke data_penduduk_update (gunakan commonData + id_penduduk)
    const { error: updateError } = await supabase
      .from("data_penduduk_update")
      .insert([{ id_penduduk: newPenduduk.id_penduduk, ...commonData }]);

    if (updateError) throw updateError;

    // 🔹 Update state dan reset form
    setAllData((prev) => [...prev, newPenduduk]);
    setFormData({
      no_kk: "",
      nik: "",
      nama: "",
      tempat_lahir: "",
      tanggal_lahir: "",
      jk: "",
      agama: "",
      status_perkawinan: "",
      pendidikan: "",
      pekerjaan: "",
      pekerjaanLain: "",
      alamat: "",
      rt: "",
      rw: "",
      status_keluarga: "",
      nik_ayah: "",
      nama_ayah: "",
      nik_ibu: "",
      nama_ibu: "",
      golongan_darah: "",
      desa: "",
      kecamatan: "",
      kabupaten: "",
      provinsi: "",
      kode_pos: "",
    });

    // 🔹 Reset semua pencarian dropdown
    setSearchKK(""); setSelectedKK(null); setInputManual(false); setShowKKDropdown(false);
    setSearchJK(""); setShowJKDropdown(false);
    setSearchAgama(""); setShowAgamaDropdown(false);
    setSearchStatusPerkawinan(""); setShowStatusPerkawinanDropdown(false);
    setSearchPendidikan(""); setShowPendidikanDropdown(false);
    setSearchPekerjaan(""); setShowDropdown(false);
    setSearchAlamat(""); setCustomAlamat(""); setShowAlamatDropdown(false);
    setSearchStatus(""); setShowStatusDropdown(false);

    // 🔹 Tutup modal
    setIsModalOpen(false);

    alert("✅ Data berhasil disimpan! Menunggu persetujuan admin.");
  } catch (err) {
    console.error("❌ Error:", err);
    alert("Terjadi kesalahan: " + err.message);
  }
};

// ================= HANDLE DELETE =================
const openDeleteModal = (id=null,mode="single") => { setTargetId(id); setDeleteMode(mode); setShowDeleteModal(true); };
const handleConfirmDelete = async () => {
  if (!deleteType) return alert("Pilih jenis hapus!");
  const idsToDelete = deleteMode === "single" ? [targetId] : [...selectedIds];
  if (idsToDelete.length === 0) return alert("Pilih data untuk dihapus!");

  // 🔹 Jika jenis pindah atau mati, buka modal khusus
  if (deleteType === "pindah") {
    setFormDataList(allData.filter(d => idsToDelete.includes(d.id_penduduk)));
    setShowDeleteModal(false);
    setIsPindahModalOpen(true);
    return;
  }

  if (deleteType === "mati") {
    setFormDataList(allData.filter(d => idsToDelete.includes(d.id_penduduk)));
    setFormData({
      tanggal_kematian: "",
      sebab: "",
      tempat_kematian: "",
      pukul_kematian: "",
      hari_kematian: ""
    });
    setShowDeleteModal(false);
    setIsKematianModalOpen(true);
    return;
  }

  try {
    // 🔹 Ambil data penduduk yang akan dihapus
    const dataToDelete = allData.filter(d => idsToDelete.includes(d.id_penduduk));

    // 🔹 Masukkan ke tabel data_penduduk_update sebagai "hapus"
    const { error: insertError } = await supabase.from("data_penduduk_update").insert(
      dataToDelete.map(d => ({
        id_penduduk: d.id_penduduk,
        no_kk: d.no_kk,
        nik: d.nik,
        nama: d.nama,
        tempat_lahir: d.tempat_lahir,
        tanggal_lahir: d.tanggal_lahir,
        jk: d.jk,
        agama: d.agama,
        status_perkawinan: d.status_perkawinan,
        pendidikan: d.pendidikan,
        pekerjaan: d.pekerjaan,
        alamat: d.alamat,
        rt: d.rt,
        rw: d.rw,
        status_keluarga: d.status_keluarga,
        nik_ayah: d.nik_ayah,
        nama_ayah: d.nama_ayah,
        nik_ibu: d.nik_ibu,
        nama_ibu: d.nama_ibu,
        desa: d.desa,
        kecamatan: d.kecamatan,
        kabupaten: d.kabupaten,
        provinsi: d.provinsi,
        kode_pos: d.kode_pos,
        golongan_darah: d.golongan_darah,
        jenis_update: "hapus",
        status_verifikasi: "menunggu persetujuan"
      }))
    );

    if (insertError) throw insertError;

    // 🔹 Update data_penduduk agar statusnya juga jadi "menunggu persetujuan"
    // Tambahkan jenis_update agar kolom di tabel utama juga terisi
    const { error: updateError } = await supabase
      .from("data_penduduk")
      .update({ status_verifikasi: "menunggu persetujuan", jenis_update: "hapus" })
      .in("id_penduduk", idsToDelete);

    if (updateError) throw updateError;

    // 🔹 Refresh tampilan agar muncul icon pending dan jenis_update terlihat di UI
    setAllData(prev =>
      prev.map(d =>
        idsToDelete.includes(d.id_penduduk)
          ? { ...d, status_verifikasi: "menunggu persetujuan", jenis_update: "hapus" }
          : d
      )
    );

    setShowDeleteModal(false);
    setSelectedIds([]);
    setSelectAll(false);
    alert("Permintaan hapus dikirim, menunggu persetujuan admin.");

  } catch (err) {
    alert("Gagal mengajukan penghapusan: " + err.message);
  }
};

const resetForm = () => {
  setFormData({ alasan: "", alasan_lain: "" });
  setTanggalPindah("");
  setAlamatPindah("");
  setRtPindah("");
  setRwPindah("");
  setDesaPindah("");
  setKecamatanPindah("");
  setKabupatenPindah("");
  setprovinsiPindah("");
  setkodeposPindah("");
  setjenisPindah("");
  setstatustidakPindah("");
  setStatusPindah("");
};

// ================= HANDLE SIMPAN KEMATIAN =================
const handleSimpanKematian = async (e) => {
  e.preventDefault();
  try {
    if (formDataList.length === 0)
      return alert("Pilih data untuk dimasukkan ke kematian!");
    if (!formData.tanggal_kematian || !formData.sebab || !formData.tempat_kematian)
      return alert("Tanggal, sebab, tempat kematian wajib!");

    const kematianData = formDataList.map((item) => ({
      ...item,
      id_penduduk: item.id_penduduk,
      tanggal_kematian: formData.tanggal_kematian,
      hari_kematian: formData.hari || null,
      pukul_kematian: formData.pukul || null,
      tempat_kematian: formData.tempat_kematian,
      sebab: formData.sebab,
      jenis_update: "tambah",
      status_verifikasi: "menunggu persetujuan",
      created_at: new Date().toISOString(),
    }));

    const { error: insertError } = await supabase
      .from("data_kematian_update")
      .insert(kematianData);
    if (insertError) throw insertError;

    const pendudukIds = formDataList.map((f) => f.id_penduduk);
    const { error: updateError } = await supabase
      .from("data_penduduk")
      .update({ status_verifikasi: "menunggu persetujuan" })
      .in("id_penduduk", pendudukIds);
    if (updateError) throw updateError;

    // 🔹 Tutup modal dan reset form
    setSelectedIds([]);
    setFormDataList([]);
    setFormData({ tanggal_kematian: "", sebab: "", tempat_kematian: "", hari: "", pukul: "" });
    setIsKematianModalOpen(false);

    // 🔹 Ambil data terbaru tanpa reload
    await fetchData();

    alert("Data berhasil dikirim untuk persetujuan admin!");
  } catch (err) {
    console.error(err);
    alert("Gagal menyimpan data kematian: " + (err?.message || err));
  }
};

const [showMessageId, setShowMessageId] = useState(null);

const [loadingId, setLoadingId] = useState(null);

  return (
    <div className="p-6 bg-white rounded-lg shadow relative">
      {/* Header */}
      <div className="flex items-center bg-green-500 text-white px-4 py-3 rounded-t-lg">
        <FileText className="w-5 h-5 mr-2" />
        <h1 className="text-lg font-semibold">Data Penduduk</h1>
      </div>

      {/* Show entries & tambah data */}
      <div className="flex justify-between items-center mt-4 mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-sm">Show</span>
          <select
            value={entriesPerPage}
            onChange={(e) => setEntriesPerPage(Number(e.target.value))}
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
            onClick={() => openDeleteModal(null, "multiple")}
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
          <Link
            className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            to="/rt/keloladata/datapenduduk/template"
          >
            <Upload className="mr-2" />Import Excel
            <input type="file" accept=".csv" className="hidden" />
          </Link>
        </div>
      </div>
      <div className="overflow-x-auto">
        {loading && (
          <div className="text-center py-10 text-gray-500">Memuat Data...</div>
        )}

        {/* Hanya tampilkan "Tidak ada data" jika fetch data sudah benar-benar dilakukan */}
        {!loading && dataFetched && allData.length === 0 && (
          <div className="text-center py-10 text-gray-500">Tidak ada data</div>
        )}

        {!loading && allData.length > 0 && (
          <>
            <table className="min-w-full border border-gray-200">
              <thead className="bg-green-700 text-white">
                <tr>
                  <th className="px-0 py-0 border text-center">
                    <input
                      type="checkbox"
                      checked={
                        selectedIds.length === displayedData.length &&
                        displayedData.length > 0
                      }
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="px-1 py-1 border">No</th>
                  <th className="px-4 py-2 border">NIK</th>
                  <th className="px-4 py-2 border">Nama</th>
                  <th className="px-4 py-2 border">JK</th>
                  <th className="px-4 py-2 border">No KK</th>
                  <th className="px-4 py-2 border">Alamat</th>
                  <th className="px-4 py-2 border">Aksi</th>
                </tr>
              </thead>
                <tbody>
                  {[...displayedData]
                    .sort((a, b) => b.id_penduduk - a.id_penduduk)
                    .map((item, index) => (
                      <tr key={item.id_penduduk} className="hover:bg-gray-50">
                        <td className="px-4 py-2 border text-center">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(item.id_penduduk)}
                            onChange={() => toggleSelect(item.id_penduduk)}
                          />
                        </td>
                        <td className="px-4 py-2 border text-center">
                          {(currentPage - 1) * entriesPerPage + index + 1}
                        </td>
                        <td className="px-4 py-2 border text-center">{item.nik}</td>
                        <td className="px-4 py-2 border text-center">{item.nama}</td>
                        <td className="px-4 py-2 border text-center">{item.jk}</td>
                        <td className="px-4 py-2 border text-center">{item.no_kk}</td>
                        <td className="px-4 py-2 border text-center">
                          {item.alamat?.toLowerCase() === "lainnya" && item.alamat_detail
                            ? item.alamat_detail
                            : item.alamat || "-"}
                        </td>

                        {/* 🔸 Kolom Aksi */}
                        <td className="px-4 py-2 border text-center">
                          <div className="flex justify-center items-center space-x-2 relative">
                            {/* 🔸 Status Menunggu */}
                            {item.status_verifikasi?.toLowerCase() === "menunggu persetujuan" && (
                              <span
                                title="Menunggu persetujuan admin"
                                className="text-yellow-500 animate-pulse"
                              >
                                ⏳
                              </span>
                            )}

                            {/* ---------------------------
                                Single message button + popup
                                (gunakan hanya blok ini — hapus icon pesan duplikat di atas)
                                --------------------------- */}
                            {(item.alasan_penolakan || (item.status_verifikasi && item.status_verifikasi.toLowerCase() === "ditolak")) && (
                              <div className="relative inline-block">
                                <button
                                  title="Lihat alasan penolakan"
                                  onClick={() =>
                                    setShowMessageId(prev => (prev === item.id_penduduk ? null : item.id_penduduk))
                                  }
                                  className="text-red-600 hover:text-red-800 p-2 rounded-full"
                                >
                                  <MessageCircle className="w-4 h-4" />
                                </button>

                                {showMessageId === item.id_penduduk && (
                                  <div className="absolute top-full mt-1 left-5/2 -translate-x-1/2 min-w-[12rem] bg-white border border-gray-300 rounded-xl shadow-md z-50 p-3 text-center">
                                    <h3 className="font-semibold text-gray-800 text-sm mb-2">
                                      Alasan dari admin:
                                      <span className="font-normal text-gray-700">
                                        <br />{item.alasan_penolakan || "-"}
                                      </span>
                                    </h3>

                                    <button
                                      onClick={async () => {
                                        try {
                                          if (item.jenis_update === "tambah") {
                                            if (!item.id_penduduk) return;
                                            await supabase
                                              .from("data_penduduk")
                                              .delete()
                                              .eq("id_penduduk", item.id_penduduk);
                                            setAllData(prev =>
                                              prev.filter(x => x.id_penduduk !== item.id_penduduk)
                                            );
                                          } else if (item.jenis_update === "edit" || item.jenis_update === "hapus") {
                                            await supabase
                                              .from("data_penduduk")
                                              .update({ alasan_penolakan: null })
                                              .eq("id_penduduk", item.id_penduduk);
                                            setAllData(prev =>
                                              prev.map(x =>
                                                x.id_penduduk === item.id_penduduk
                                                  ? { ...x, alasan_penolakan: null }
                                                  : x
                                              )
                                            );
                                          }
                                          setShowMessageId(null); // tutup popup
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

                            {/* Tombol Detail */}
                            <Link
                              to={`/rt/keloladata/datapenduduk/${item.id_penduduk}`}
                              className="p-2 text-blue-600 hover:bg-blue-100 rounded-full"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>

                            {/* Tombol Edit */}
                            <Link
                              to={`/rt/keloladata/datapenduduk/edit/${item.id_penduduk}`}
                              className="p-2 text-yellow-600 hover:bg-yellow-100 rounded-full"
                            >
                              <Edit className="w-4 h-4" />
                            </Link>

                            {/* Tombol Hapus */}
                            <button
                              onClick={() => openDeleteModal(item.id_penduduk, "single")}
                              className="p-2 text-red-600 hover:bg-red-100 rounded-full"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                    </tr>
                    ))}
                </tbody>
            </table>
            {/* Pagination */}
            <div className="flex justify-between items-center mt-4">
              <span className="text-sm">
                Showing {(currentPage - 1) * entriesPerPage + 1} to{" "}
                {Math.min(currentPage * entriesPerPage, allData.length)} of {allData.length} entries
              </span>
              <div className="space-x-2 flex items-center">
                <button
                  onClick={handlePrevious}
                  disabled={currentPage === 1}
                  className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(num => (
                  <button
                    key={num}
                    onClick={() => setCurrentPage(num)}
                    className={`px-3 py-1 rounded ${
                      currentPage === num ? "bg-green-500 text-white" : "bg-gray-200"
                    }`}
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
          </>
        )}
      </div>

      {/* Modal Tambah Data */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white rounded-lg shadow-lg w-full max-w-3xl p-6 z-10 overflow-y-auto max-h-[90vh]">
            <h2 className="text-xl font-semibold mb-4">Tambah Data Penduduk</h2>
            <form className="grid grid-cols-2 gap-4">

              {/* No KK - Kepala Keluarga*/}
{/* No KK - Kepala Keluarga */}
<div className="flex gap-2 w-full">
  {/* Input dropdown KK */}
  <div className="relative flex-1">
    <input
      type="text"
      placeholder="-- Pilih No KK / Kepala Keluarga --"
      value={
        inputManual
          ? "" // kosongkan jika manual
          : selectedKK
          ? `${selectedKK.no_kk} - ${selectedKK.nama}`
          : searchKK
      }
      onChange={(e) => {
        if (inputManual) {
          setFormData({ ...formData, no_kk: e.target.value });
          return;
        }
        setInputManual(false);
        setSearchKK(e.target.value);
        setSelectedKK(null);
        setShowKKDropdown(true);
      }}
      onClick={() => {
        if (!inputManual) setShowKKDropdown(true);
      }}
      onFocus={() => {
        if (!inputManual) setShowKKDropdown(true);
      }}
      onBlur={() => setTimeout(() => setShowKKDropdown(false), 200)}
      className={`border rounded px-3 py-2 w-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-400 ${
        inputManual ? "bg-gray-50" : ""
      }`}
    />

    {!inputManual && showKKDropdown && (
      <ul className="absolute z-10 w-full bg-white border rounded shadow max-h-48 overflow-y-auto">
        {kepalaKeluarga
          .filter(
            (k) =>
              k.no_kk.toLowerCase().includes(searchKK.toLowerCase()) ||
              k.nama.toLowerCase().includes(searchKK.toLowerCase())
          )
          .map((k) => (
            <li
              key={k.id_penduduk}
              onMouseDown={(e) => {
                e.preventDefault();
                setSelectedKK(k);
                setFormData((prev) => ({
                  ...prev,
                  no_kk: k.no_kk,
                  alamat: k.alamat ?? prev.alamat,
                }));
                setSearchKK("");
                setShowKKDropdown(false);
              }}
              className="px-3 py-2 hover:bg-green-100 cursor-pointer"
            >
              {k.no_kk} - {k.nama}
            </li>
          ))}

        {kepalaKeluarga.filter(
          (k) =>
            k.no_kk.toLowerCase().includes(searchKK.toLowerCase()) ||
            k.nama.toLowerCase().includes(searchKK.toLowerCase())
        ).length === 0 && (
          <li className="px-3 py-2 text-gray-400 italic">Data tidak ditemukan</li>
        )}

        <li
          onMouseDown={(e) => {
            e.preventDefault();
            setInputManual(true);
            setSelectedKK(null);
            setFormData((prev) => ({
              ...prev,
              no_kk: "",
              alamat: "",
            }));
            setSearchKK("");
            setShowKKDropdown(false);
          }}
          className="px-3 py-2 bg-gray-100 hover:bg-gray-200 cursor-pointer font-medium text-green-700"
        >
          + Input Manual
        </li>
      </ul>
    )}
  </div>

  {/* Input Manual No KK (sejajar) */}
  {inputManual && (
    <input
      type="text"
      placeholder="Masukkan No KK"
      value={formData.no_kk}
      onChange={(e) => setFormData({ ...formData, no_kk: e.target.value })}
      className="border rounded px-3 py-2 flex-1 focus:outline-none focus:ring-2 focus:ring-green-400"
    />
  )}
</div>



              {/* NIK, Nama, Tempat Lahir, Tanggal Lahir */}
              <input type="text" placeholder="NIK" value={formData.nik} onChange={(e) => setFormData({ ...formData, nik: e.target.value })} className="border rounded px-3 py-2" />
              <input type="text" placeholder="Nama" value={formData.nama} onChange={(e) => setFormData({ ...formData, nama: e.target.value })} className="border rounded px-3 py-2" />
              <input type="text" placeholder="Tempat Lahir" value={formData.tempat_lahir} onChange={(e) => setFormData({ ...formData, tempat_lahir: e.target.value })} className="border rounded px-3 py-2" />
              <input type="date" placeholder="Tanggal Lahir" value={formData.tanggal_lahir} onChange={(e) => setFormData({ ...formData, tanggal_lahir: e.target.value })} className="border rounded px-3 py-2" />

              {/* Jenis Kelamin */}
              <div className="relative w-full">
                {/* Input Searchable */}
                <input
                  type="text"
                  placeholder="-- Pilih Jenis Kelamin --"
                  value={searchJK} // ✅ Prioritas search, fallback formData
                  onChange={(e) => {
                    setSearchJK(e.target.value);
                    setShowJKDropdown(true);
                  }}
                  onClick={() => setShowJKDropdown(true)}
                  onFocus={() => setShowJKDropdown(true)}
                  onBlur={() => setTimeout(() => setShowJKDropdown(false), 200)}
                  className="border rounded px-3 py-2 w-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-400"
                />

                {/* Dropdown Pilihan */}
                {showJKDropdown && (
                  <ul className="absolute z-10 w-full bg-white border rounded shadow max-h-40 overflow-y-auto">
                    {jkOptions
                      .filter((item) =>
                        item.toLowerCase().includes(searchJK.toLowerCase())
                      )
                      .map((item, index) => (
                        <li
                          key={index}
                          onMouseDown={() => {
                            setFormData({ ...formData, jk: item });  // ✅ Simpan ke form
                            setSearchJK(item);                        // ✅ Tampilkan pilihan di input
                            setShowJKDropdown(false);
                          }}
                          className="px-3 py-2 hover:bg-green-100 cursor-pointer"
                        >
                          {item}
                        </li>
                      ))}

                    {/* Jika tidak ada hasil */}
                    {jkOptions.filter((item) =>
                      item.toLowerCase().includes(searchJK.toLowerCase())
                    ).length === 0 && (
                      <li className="px-3 py-2 text-gray-400 italic">
                        Tidak ditemukan
                      </li>
                    )}
                  </ul>
                )}
              </div>

              {/*Golongan darah*/}
              <input type="text" placeholder="Golongan Darah" value={formData.golongan_darah} onChange={(e) => setFormData({ ...formData, golongan_darah: e.target.value })} className="border rounded px-3 py-2" />

              {/* Agama */}
              <div className="relative w-full">
                {/* Input Searchable */}
                <input
                  type="text"
                  placeholder="-- Pilih Agama --"
                  value={searchAgama}  // ✅ Sinkronisasi
                  onChange={(e) => {
                    setSearchAgama(e.target.value);
                    setShowAgamaDropdown(true);
                  }}
                  onClick={() => setShowAgamaDropdown(true)}
                  onFocus={() => setShowAgamaDropdown(true)}
                  onBlur={() => setTimeout(() => setShowAgamaDropdown(false), 200)}
                  className="border rounded px-3 py-2 w-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-400"
                />

                {/* Dropdown Opsi */}
                {showAgamaDropdown && (
                  <ul className="absolute z-10 w-full bg-white border rounded shadow max-h-40 overflow-y-auto">
                    {agamaOptions
                      .filter((item) =>
                        item.toLowerCase().includes(searchAgama.toLowerCase())
                      )
                      .map((item, index) => (
                        <li
                          key={index}
                          onMouseDown={() => {
                            setFormData({ ...formData, agama: item });  // ✅ Simpan ke form
                            setSearchAgama(item);                        // ✅ Tampilkan pilihan di input
                            setShowAgamaDropdown(false);
                          }}
                          className="px-3 py-2 hover:bg-green-100 cursor-pointer"
                        >
                          {item}
                        </li>
                      ))}

                    {/* Jika tidak ditemukan */}
                    {agamaOptions.filter((item) =>
                      item.toLowerCase().includes(searchAgama.toLowerCase())
                    ).length === 0 && (
                      <li className="px-3 py-2 text-gray-400 italic">
                        Tidak ditemukan
                      </li>
                    )}
                  </ul>
                )}
              </div>

              {/* Status Perkawinan */}
              <div className="relative w-full">
                {/* Input Searchable */}
                <input
                  type="text"
                  placeholder="-- Pilih Status Perkawinan --"
                  value={searchStatusPerkawinan} // ✅ Sinkronisasi dengan formData
                  onChange={(e) => {
                    setSearchStatusPerkawinan(e.target.value);
                    setShowStatusPerkawinanDropdown(true);
                  }}
                  onClick={() => setShowStatusPerkawinanDropdown(true)}
                  onFocus={() => setShowStatusPerkawinanDropdown(true)}
                  onBlur={() => setTimeout(() => setShowStatusPerkawinanDropdown(false), 200)}
                  className="border rounded px-3 py-2 w-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-400"
                />

                {/* Dropdown Opsi */}
                {showStatusPerkawinanDropdown && (
                  <ul className="absolute z-10 w-full bg-white border rounded shadow max-h-40 overflow-y-auto">
                    {statusPerkawinanOptions
                      .filter((item) =>
                        item.toLowerCase().includes(searchStatusPerkawinan.toLowerCase())
                      )
                      .map((item, index) => (
                        <li
                          key={index}
                          onMouseDown={() => {
                            setFormData({ ...formData, status_perkawinan: item }); // ✅ Simpan ke formData
                            setSearchStatusPerkawinan(item); // ✅ Tampilkan nilai terpilih
                            setShowStatusPerkawinanDropdown(false);
                          }}
                          className="px-3 py-2 hover:bg-green-100 cursor-pointer"
                        >
                          {item}
                        </li>
                      ))}

                    {/* Jika tidak ditemukan */}
                    {statusPerkawinanOptions.filter((item) =>
                      item.toLowerCase().includes(searchStatusPerkawinan.toLowerCase())
                    ).length === 0 && (
                      <li className="px-3 py-2 text-gray-400 italic">
                        Tidak ditemukan
                      </li>
                    )}
                  </ul>
                )}
              </div>
              
              {/* Pendidikan */}
              <div className="relative w-full">
                {/* Input Searchable */}
                <input
                  type="text"
                  placeholder="-- Pilih Pendidikan --"
                  value={searchPendidikan} // ✅ Hanya pakai searchPendidikan
                  onChange={(e) => {
                    setSearchPendidikan(e.target.value);
                    setShowPendidikanDropdown(true);
                  }}
                  onClick={() => setShowPendidikanDropdown(true)}
                  onFocus={() => setShowPendidikanDropdown(true)}
                  onBlur={() => setTimeout(() => setShowPendidikanDropdown(false), 200)}
                  className="border rounded px-3 py-2 w-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-400"
                />

                {/* Dropdown Opsi */}
                {showPendidikanDropdown && (
                  <ul className="absolute z-10 w-full bg-white border rounded shadow max-h-40 overflow-y-auto">
                    {pendidikanOptions
                      .filter((item) =>
                        item.toLowerCase().includes(searchPendidikan.toLowerCase())
                      )
                      .map((item, index) => (
                        <li
                          key={index}
                          onMouseDown={() => {
                            setFormData({ ...formData, pendidikan: item }); // Simpan ke form
                            setSearchPendidikan(item); // ✅ Isi input dengan item terpilih
                            setShowPendidikanDropdown(false); // Tutup dropdown
                          }}
                          className="px-3 py-2 hover:bg-green-100 cursor-pointer"
                        >
                          {item}
                        </li>
                      ))}

                    {/* Jika tidak ditemukan */}
                    {pendidikanOptions.filter((item) =>
                      item.toLowerCase().includes(searchPendidikan.toLowerCase())
                    ).length === 0 && (
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
                  value={formData.alamat || ""}  // ✅ ambil dari formData agar sinkron otomatis
                  onChange={(e) => {
                    setFormData({ ...formData, alamat: e.target.value });
                    setSearchAlamat(e.target.value); // masih bisa pakai search
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
                        item.toLowerCase().includes((formData.alamat || "").toLowerCase())
                      )
                      .map((item, index) => (
                        <li
                          key={index}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setFormData({ ...formData, alamat: item }); // ✅ isi alamat di form
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
                      item.toLowerCase().includes((formData.alamat || "").toLowerCase())
                    ).length === 0 && (
                      <li className="px-3 py-2 text-gray-400 italic">Alamat tidak ditemukan</li>
                    )}
                  </ul>
                )}
              </div>

              {/* RT (readonly, selalu ambil dari login) */}
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="RT"
                  value={formData.rt || userRt || ""}
                  readOnly
                  className="border rounded px-3 py-2 w-full bg-gray-100 cursor-not-allowed focus:outline-none"
                />
              </div>

              {/* RW (readonly, selalu ambil dari login) */}
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="RW"
                  value={formData.rw || userRw || ""}
                  readOnly
                  className="border rounded px-3 py-2 w-full bg-gray-100 cursor-not-allowed focus:outline-none"
                />
              </div>

              {/* Status Dalam Keluarga */}
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="-- Pilih Status Dalam Keluarga --"
                  value={searchStatus} // ✅ tampilkan nilai lama
                  onChange={(e) => {
                    setSearchStatus(e.target.value);
                    setShowStatusDropdown(true);
                  }}
                  onClick={() => setShowStatusDropdown(true)}
                  onFocus={() => setShowStatusDropdown(true)}
                  onBlur={() => setTimeout(() => setShowStatusDropdown(false), 200)}
                  className="border rounded px-3 py-2 w-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-400"
                />

                {showStatusDropdown && (
                  <ul className="absolute z-10 w-full bg-white border rounded shadow max-h-40 overflow-y-auto">
                    {statusOptions
                      .filter((item) =>
                        item.toLowerCase().includes(searchStatus.toLowerCase())
                      )
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

                    {statusOptions.filter((item) =>
                      item.toLowerCase().includes(searchStatus.toLowerCase())
                    ).length === 0 && (
                      <li className="px-3 py-2 text-gray-400 italic">
                        Tidak ditemukan
                      </li>
                    )}
                  </ul>
                )}
              </div>

              {/* Data Orang Tua */}
              <input type="text" placeholder="NIK Ayah" value={formData.nik_ayah} onChange={(e) => setFormData({ ...formData, nik_ayah: e.target.value })} className="border rounded px-3 py-2" />
              <input type="text" placeholder="Nama Ayah" value={formData.nama_ayah} onChange={(e) => setFormData({ ...formData, nama_ayah: e.target.value })} className="border rounded px-3 py-2" />
              <input type="text" placeholder="NIK Ibu" value={formData.nik_ibu} onChange={(e) => setFormData({ ...formData, nik_ibu: e.target.value })} className="border rounded px-3 py-2" />
              <input type="text" placeholder="Nama Ibu" value={formData.nama_ibu} onChange={(e) => setFormData({ ...formData, nama_ibu: e.target.value })} className="border rounded px-3 py-2" />

              {/* Desa, Kecamatan, Kabupaten, Provinsi*/}
              <input
                type="text"
                placeholder="Desa"
                value="Margahayu Tengah"
                readOnly
                className="border rounded px-3 py-2 bg-gray-100"
              />
              <input
                type="text"
                placeholder="Kecamatan"
                value="Margahayu"
                readOnly
                className="border rounded px-3 py-2 bg-gray-100"
              />
              <input
                type="text"
                placeholder="Kabupaten"
                value="Bandung"
                readOnly
                className="border rounded px-3 py-2 bg-gray-100"
              />
              <input
                type="text"
                placeholder="Provinsi"
                value="Jawa Barat"
                readOnly
                className="border rounded px-3 py-2 bg-gray-100"
              />
              <input
                type="text"
                placeholder="Kode Pos"
                value="40225"
                readOnly
                className="border rounded px-3 py-2 bg-gray-100"
              />
            </form>

            <div className="flex justify-end mt-4 space-x-2">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Batal</button>
              <button onClick={handleSimpan} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Simpan</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PILIHAN HAPUS */}
      {showDeleteModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl p-6 shadow-lg w-96">
            <h2 className="text-lg font-bold mb-4 text-gray-800">Pilih Jenis Hapus</h2>

            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="deleteType"
                  value="pindah"
                  onChange={(e) => setDeleteType(e.target.value)}
                />
                <span>Hapus & Pindah ke Data Pindah</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="deleteType"
                  value="mati"
                  onChange={(e) => setDeleteType(e.target.value)}
                />
                <span>Hapus & Pindah ke Data Mati</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="deleteType"
                  value="duplikat"
                  onChange={(e) => setDeleteType(e.target.value)}
                />
                <span>Hapus Data Duplikat/Permanen</span>
              </label>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-lg bg-gray-300 hover:bg-gray-400"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* MODAL PINDAH*/}
{isPindahModalOpen && (
  <div className="fixed inset-0 flex items-center justify-center z-50">
    {/* Background hitam */}
    <div
      className="absolute inset-0 bg-black/30 backdrop-blur-sm"
      onClick={() => {
        setIsPindahModalOpen(false);
        resetForm();
      }}
    />

    {/* Konten modal */}
    <div className="relative bg-white rounded-lg shadow-lg w-full max-w-3xl p-6 z-10 overflow-y-auto max-h-[90vh]">
      <h2 className="text-xl font-semibold mb-4">Tambah Data Pindah</h2>

      {/* Daftar penduduk terpilih */}
      <div className="mb-4 max-h-40 overflow-y-auto border rounded p-3 bg-gray-50">
        <h3 className="font-semibold text-gray-700 mb-2">Penduduk Terpilih:</h3>
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-200">
              <th className="border px-2 py-1 text-sm">No</th>
              <th className="border px-2 py-1 text-sm">NIK</th>
              <th className="border px-2 py-1 text-sm">No KK</th>
              <th className="border px-2 py-1 text-sm">Nama</th>
            </tr>
          </thead>
          <tbody>
            {formDataList.map((item, index) => (
              <tr key={item.id_penduduk}>
                <td className="border px-2 py-1 text-center text-sm">{index + 1}</td>
                <td className="border px-2 py-1 text-sm">{item.nik}</td>
                <td className="border px-2 py-1 text-sm">{item.no_kk}</td>
                <td className="border px-2 py-1 text-sm">{item.nama}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Form pindah */}
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            if (!formData.alasan) {
              alert("Silakan pilih alasan pindah terlebih dahulu");
              return;
            }

            const updatedData = formDataList.map((item) => ({
              ...item,
              tanggal_pindah: tanggalPindah,
              alasan: formData.alasan,
              alasan_lain: formData.alasan === "Lainnya" ? formData.alasan_lain : "",
              alamat_pindah: alamatPindah,
              rt_pindah: rtPindah,
              rw_pindah: rwPindah,
              desa_pindah: desaPindah,
              kecamatan_pindah: kecamatanPindah,
              kabupaten_pindah: kabupatenPindah,
              provinsi_pindah: provinsiPindah,
              kodepos_pindah: kodeposPindah,
              jenis_pindah: jenisPindah,
              statuskk_tidakpindah: statustidakPindah,
              statuskk_pindah: statusPindah,
              jenis_update: "tambah",
              status_verifikasi: "menunggu persetujuan",
            }));

            const { error: insertError } = await supabase
              .from("data_pindah_update")
              .insert(updatedData);
            if (insertError) throw insertError;

            await supabase
              .from("data_penduduk")
              .update({ status_verifikasi: "menunggu persetujuan" })
              .in(
                "id_penduduk",
                formDataList.map((item) => item.id_penduduk)
              );

            setAllData((prev) =>
              prev.map((p) =>
                formDataList.find((f) => f.id_penduduk === p.id_penduduk)
                  ? { ...p, status_verifikasi: "menunggu persetujuan" }
                  : p
              )
            );

            setSelectedIds([]);
            setIsPindahModalOpen(false);
            resetForm();
            alert("Data pindah berhasil dikirim dan menunggu persetujuan admin.");
          } catch (err) {
            console.error("❌ Error saat kirim data pindah:", err);
            alert("Gagal mengirim data pindah: " + err.message);
          }
        }}
        className="grid grid-cols-2 gap-4"
      >
        {/* Semua input field */}
        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700">Tanggal Pindah</label>
          <input
            type="date"
            value={tanggalPindah}
            onChange={(e) => setTanggalPindah(e.target.value)}
            className="border rounded px-3 py-2 w-full"
            required
          />
        </div>

        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700">Alasan Pindah</label>
          <select
            value={formData.alasan}
            onChange={(e) => {
              const value = e.target.value;
              setFormData({
                ...formData,
                alasan: value,
                ...(value !== "Lainnya" ? { alasan_lain: "" } : {}),
              });
            }}
            className="border rounded px-3 py-2 w-full"
            required
          >
            <option value="">-- Pilih Alasan --</option>
            <option value="Pekerjaan">Pekerjaan</option>
            <option value="Pendidikan">Pendidikan</option>
            <option value="Keamanan">Keamanan</option>
            <option value="Kesehatan">Kesehatan</option>
            <option value="Perumahan">Perumahan</option>
            <option value="Keluarga">Keluarga</option>
            <option value="Lainnya">Lainnya (Sebutkan)</option>
          </select>
          {formData.alasan === "Lainnya" && (
            <input
              type="text"
              placeholder="Sebutkan alasan lain"
              value={formData.alasan_lain}
              onChange={(e) =>
                setFormData({ ...formData, alasan_lain: e.target.value })
              }
              className="border rounded px-3 py-2 w-full mt-2"
              required
            />
          )}
        </div>

        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700">Alamat Pindah</label>
          <input
            type="text"
            value={alamatPindah}
            onChange={(e) => setAlamatPindah(e.target.value)}
            className="border rounded px-3 py-2 w-full"
            required
          />
        </div>

        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700">RT Pindah</label>
          <input
            type="text"
            value={rtPindah}
            onChange={(e) => setRtPindah(e.target.value)}
            className="border rounded px-3 py-2 w-full"
            required
          />
        </div>

        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700">RW Pindah</label>
          <input
            type="text"
            value={rwPindah}
            onChange={(e) => setRwPindah(e.target.value)}
            className="border rounded px-3 py-2 w-full"
            required
          />
        </div>

        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700">Desa Pindah</label>
          <input
            type="text"
            value={desaPindah}
            onChange={(e) => setDesaPindah(e.target.value)}
            className="border rounded px-3 py-2 w-full"
            required
          />
        </div>

        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700">Kecamatan Pindah</label>
          <input
            type="text"
            value={kecamatanPindah}
            onChange={(e) => setKecamatanPindah(e.target.value)}
            className="border rounded px-3 py-2 w-full"
            required
          />
        </div>

        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700">Kabupaten Pindah</label>
          <input
            type="text"
            value={kabupatenPindah}
            onChange={(e) => setKabupatenPindah(e.target.value)}
            className="border rounded px-3 py-2 w-full"
            required
          />
        </div>

        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700">Provinsi Pindah</label>
          <input
            type="text"
            value={provinsiPindah}
            onChange={(e) => setprovinsiPindah(e.target.value)}
            className="border rounded px-3 py-2 w-full"
            required
          />
        </div>

        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700">Kode Pos Pindah</label>
          <input
            type="text"
            value={kodeposPindah}
            onChange={(e) => setkodeposPindah(e.target.value)}
            className="border rounded px-3 py-2 w-full"
            required
          />
        </div>

        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700">Jenis Kepindahan</label>
          <select
            value={jenisPindah}
            onChange={(e) => setjenisPindah(e.target.value)}
            className="border rounded px-3 py-2 w-full"
            required
          >
            <option value="">-- Pilih Jenis Kepindahan --</option>
            <option value="kepala keluarga">Kepala Keluarga</option>
            <option value="kepala & sebagian anggota">Kepala & Sebagian Anggota</option>
            <option value="kepala & seluruh anggota">Kepala & Seluruh Anggota</option>
            <option value="anggota keluarga">Anggota Keluarga</option>
          </select>
        </div>

        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700">Status KK Bagi Yang Tidak Pindah</label>
          <select
            value={statustidakPindah}
            onChange={(e) => setstatustidakPindah(e.target.value)}
            className="border rounded px-3 py-2 w-full"
            required
          >
            <option value="">-- Pilih Status --</option>
            <option value="Tetap">Tetap</option>
            <option value="KK Baru">KK Baru</option>
          </select>
        </div>

        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700">Status KK Bagi Yang Pindah</label>
          <select
            value={statusPindah}
            onChange={(e) => setStatusPindah(e.target.value)}
            className="border rounded px-3 py-2 w-full"
            required
          >
            <option value="">-- Pilih Status KK --</option>
            <option value="Numpang KK">Numpang KK</option>
            <option value="Membuat KK Baru">Membuat KK Baru</option>
          </select>
        </div>

        {/* Tombol aksi */}
        <div className="col-span-2 flex justify-end mt-6 space-x-2">
          <button
            type="button"
            onClick={() => {
              setIsPindahModalOpen(false);
              resetForm();
            }}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
          >
            Batal
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Simpan
          </button>
        </div>
      </form>
    </div>
  </div>
)}

      {/* MODAL KEMATIAN */}
      {isKematianModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setIsKematianModalOpen(false)}
          />

          <div className="relative bg-white rounded-lg shadow-lg w-full max-w-3xl p-6 z-10 overflow-y-auto max-h-[90vh]">
            <h2 className="text-xl font-semibold mb-4">Tambah Data Kematian</h2>

            <form onSubmit={handleSimpanKematian} className="space-y-4">
              {/* Tabel penduduk terpilih */}
              <div className="mb-4 max-h-40 overflow-y-auto border rounded p-3 bg-gray-50">
                <h3 className="font-semibold text-gray-700 mb-2">Penduduk Terpilih:</h3>
                <table className="w-full border">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="border px-2 py-1 text-sm">No</th>
                      <th className="border px-2 py-1 text-sm">NIK</th>
                      <th className="border px-2 py-1 text-sm">No KK</th>
                      <th className="border px-2 py-1 text-sm">Nama</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formDataList.length > 0 ? (
                      formDataList.map((item, index) => (
                        <tr key={item.id_penduduk}>
                          <td className="border px-2 py-1 text-center text-sm">{index + 1}</td>
                          <td className="border px-2 py-1 text-sm">{item.nik}</td>
                          <td className="border px-2 py-1 text-sm">{item.no_kk}</td>
                          <td className="border px-2 py-1 text-sm">{item.nama}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="border px-2 py-2 text-center text-gray-500">
                          Tidak ada data terpilih
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
        
              {/* Input tanggal & sebab kematian */}
              <div className="grid grid-cols-2 gap-4">
               
                {/* Hari (read-only) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Hari</label>
                  <input
                    type="text"
                    value={formData.hari || ""}
                    readOnly
                    className="border rounded px-3 py-2 w-full bg-gray-100"
                  />
                </div>

                 {/* Tanggal Kematian */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tanggal Kematian</label>
                  <input
                    type="date"
                    value={formData.tanggal_kematian || ""}
                    onChange={(e) => {
                      const tanggal = e.target.value;
                      const [y, m, d] = tanggal.split("-");
                      const dt = new Date(Number(y), Number(m) - 1, Number(d));
                      const hariArray = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
                      const namaHari = hariArray[dt.getDay()] || "";

                      setFormData((prev) => ({
                        ...prev,
                        tanggal_kematian: tanggal,
                        hari: namaHari, // otomatis terisi
                      }));
                    }}
                    className="border rounded px-3 py-2 w-full"
                    required
                  />
                </div>

                {/* Pukul */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Pukul</label>
                  <input
                    type="time"
                    value={formData.pukul || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, pukul: e.target.value }))
                    }
                    className="border rounded px-3 py-2 w-full"
                    required
                  />
                </div>

                {/* Sebab Kematian */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Sebab Kematian</label>
                  <input
                    type="text"
                    placeholder="Contoh: Sakit, Kecelakaan, dll"
                    value={formData.sebab || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, sebab: e.target.value }))
                    }
                    className="border rounded px-3 py-2 w-full"
                    required
                  />
                </div>

                {/* Tempat Kematian */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tempat Kematian</label>
                  <input
                    type="text"
                    placeholder="Contoh: RS, Klinik, dll"
                    value={formData.tempat_kematian || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, tempat_kematian: e.target.value }))
                    }
                    className="border rounded px-3 py-2 w-full"
                    required
                  />
                </div>
              </div>


              {/* Tombol aksi */}
              <div className="flex justify-end mt-4 space-x-2">
                <button
                  type="button"
                  onClick={() => setIsKematianModalOpen(false)}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataPenduduk;
