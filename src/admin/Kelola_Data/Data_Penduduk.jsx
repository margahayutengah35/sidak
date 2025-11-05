import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Printer, Eye, Edit, Trash2, UserPlus, FileText } from "lucide-react";
import supabase from "../../supabaseClient";
import { Upload } from "lucide-react"; 
import jsPDF from "jspdf";
import logo from "../../assets/logo_desa.png";
import "@/../../fonts/arial-normal.js";
import "@/../../jsPDF/fonts/arialbd-bold.js";
import "@/../../jsPDF/fonts/ariali-italic.js";

function Data_Penduduk() {
  const location = useLocation();
  const navigate = useNavigate();

  // ambil keyword dari URL (jika ada) — harus sebelum buildQueryString
  const queryParams = new URLSearchParams(location.search);
  const keywordFromUrl = queryParams.get("keyword")?.trim().toLowerCase() || "";

  // === STATE (deklarasikan semua useState sebelum function yang menggunakannya) ===
  const [allData, setAllData] = useState([]);
  const [entriesPerPage, setEntriesPerPage] = useState(500);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isModalKelahiranOpen, setIsModalKelahiranOpen] = useState(false);
  const [pendingPrintId, setPendingPrintId] = useState(null);
  const [deleteType, setDeleteType] = useState(""); // "pindah" | "mati" | "duplikat"
  const [deleteMode, setDeleteMode] = useState("single"); // "single" | "multiple"
  const [formDataList, setFormDataList] = useState([]);
  const [tanggalPindah, setTanggalPindah] = useState("");
  const [alasanPindah, setAlasanPindah] = useState("");
  const [alasanLain, setAlasanLain] = useState("");  
  const [alamatPindah, setAlamatPindah] = useState("");
  const [rtPindah, setRtPindah] = useState("");
  const [rwPindah, setRwPindah] = useState("");
  const [desaPindah, setDesaPindah] = useState("");
  const [kecamatanPindah, setKecamatanPindah] = useState("");
  const [kabupatenPindah, setKabupatenPindah] = useState("");
  const [provinsiPindah, setprovinsiPindah] = useState("");
  const [kodeposPindah, setkodeposPindah] = useState("");
  const [jenisPindah, setjenisPindah] = useState("");
  const [statustidakPindah, setstatustidakPindah] = useState("");
  const [statusPindah, setStatusPindah] = useState("");
  const [isKematianModalOpen, setIsKematianModalOpen] = useState(false);
  const [targetId, setTargetId] = useState(null);
  const [kepalaKeluarga, setKepalaKeluarga] = useState([]);
  const [inputManual, setInputManual] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showKKDropdown, setShowKKDropdown] = useState(false);
  const [searchKK, setSearchKK] = useState("");
  const [showJKDropdown, setShowJKDropdown] = useState(false);
  const [searchJK, setSearchJK] = useState("");
  const jkOptions = ["Laki-laki", "Perempuan"];
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [showRtDropdown, setShowRtDropdown] = useState(false);
  const [searchRt, setSearchRt] = useState("");
  const rtOptions = Array.from({ length: 10 }, (_, i) =>
    (i + 1).toString().padStart(2, "0")
  );
  const [showRwDropdown, setShowRwDropdown] = useState(false);
  const [searchRw, setSearchRw] = useState("");
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
    "Family Lain",
  ];
  const [showAgamaDropdown, setShowAgamaDropdown] = useState(false);
  const [searchAgama, setSearchAgama] = useState("");
  const agamaOptions = ["Islam", "Kristen", "Katholik", "Hindu", "Budha", "Konghucu"];
  const [showStatusPerkawinanDropdown, setShowStatusPerkawinanDropdown] = useState(false);
  const [searchStatusPerkawinan, setSearchStatusPerkawinan] = useState("");
  const statusPerkawinanOptions = [
    "Belum Kawin",
    "Kawin Tercatat",
    "Kawin Tidak Tercatat",
    "Cerai Hidup",
    "Cerai Mati",
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
    "Strata III",
  ];
  const [isPindahModalOpen, setIsPindahModalOpen] = useState(false);
  const [formData, setFormData] = useState({
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
    desa: "",
    kecamatan: "",
    kabupaten: "",
    provinsi: "",
    kode_pos: "",
    tanggal_pindah: "",
    alasan: "",
    alamat_pindah: "",
    rt_pindah: "",
    rw_pindah: "",
    desa_pindah: "",
    kecamatan_pindah: "",
    kabupaten_pindah: "",
    tanggal_kematian: "",
    sebab: "",
    tempat_kematian: "",
    golongan_darah: "",
    hari_kematian: "",
    pukul_kematian: "",
  });
  const [searchPekerjaan, setSearchPekerjaan] = useState("");
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

  const [searchAlamat, setSearchAlamat] = useState("");
  const [customAlamat, setCustomAlamat] = useState("");
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

  // FILTER / PAGINATION state
  const [filterMode, setFilterMode] = useState("all"); // "all" | "rw"
  const [rwFilter, setRwFilter] = useState("all");
  const [rtFilter, setRtFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  // user RT/RW
  const [userRt, setUserRt] = useState("");
  const [userRw, setUserRw] = useState("");

  // loading
  const [loading, setLoading] = useState(false);

  // gunakan keywordFromUrl sebagai sumber truth awal
  const [keyword, setKeyword] = useState(keywordFromUrl);

  // === HELPERS ===
  const buildQueryString = (overrides = {}) => {
    const params = new URLSearchParams(location.search);

    const fm = overrides.filterMode ?? filterMode ?? "all";
    const rw = overrides.rw ?? rwFilter ?? "all";
    const rt = overrides.rt ?? rtFilter ?? "all";
    const page = overrides.page ?? currentPage ?? 1;
    const entries = overrides.entries ?? entriesPerPage ?? 500;
    const kw = keyword;

    // cek: kalau semuanya default → jangan pakai query string
    const isDefault =
      fm === "all" &&
      rw === "all" &&
      rt === "all" &&
      page === 1 &&
      entries === 500 &&
      !kw;

    if (isDefault) {
      return "";
    }

    params.set("filterMode", fm);
    params.set("rw", rw);
    params.set("rt", rt);
    params.set("page", page.toString());
    params.set("entries", entries.toString());
    if (kw) params.set("keyword", kw);

    return `?${params.toString()}`;
  };

  const capitalize = (str = "") =>
    str
      .trim()
      .split(" ")
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");

  const emptyToNull = (value) => (value === "" ? null : value);

  // === INITIALIZE STATE FROM URL (run ONCE at mount) ===
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const fm = params.get("filterMode");
    const rw = params.get("rw");
    const rt = params.get("rt");
    const page = Number(params.get("page"));
    const entries = Number(params.get("entries"));
    const kw = params.get("keyword");

    if (fm) setFilterMode(fm);
    if (rw) setRwFilter(rw);
    if (rt) setRtFilter(rt);
    if (!Number.isNaN(page) && page > 0) setCurrentPage(page);
    if (!Number.isNaN(entries) && entries > 0) setEntriesPerPage(entries);
    if (kw) {
      setKeyword(kw.trim());
    }
    // only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // === SYNC URL ketika filter/pagination berubah ===
  useEffect(() => {
    const qs = buildQueryString();
    // kalau kosong → URL bersih tanpa query
    navigate(`${location.pathname}${qs}`, { replace: true });
  }, [filterMode, rwFilter, rtFilter, currentPage, entriesPerPage, keyword]);

  // === FETCH user RT/RW dari tabel users ===
  useEffect(() => {
    const fetchUserRtRw = async () => {
      try {
        const rawId = localStorage.getItem("userId");
        if (!rawId) {
          console.warn("userId not found in localStorage");
          return;
        }
        const userId = Number(rawId);
        const { data, error } = await supabase.from("users").select("rt, rw").eq("id", userId).single();
        if (error) {
          console.error("Gagal ambil RT/RW dari users:", error);
          return;
        }
        setUserRt(data?.rt || "");
        setUserRw(data?.rw || "");
        setFormData((prev) => ({ ...prev, rt: data?.rt || "", rw: data?.rw || "" }));
      } catch (err) {
        console.error("Error saat fetch user RT/RW:", err);
      }
    };
    fetchUserRtRw();
  }, []);

  // === FETCH ALL DATA (bergantung pada location.search) ===
  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams(location.search);
        const keywordLocal = queryParams.get("keyword")?.trim() || "";
  
        let qBase = supabase.from("data_penduduk").select("*", { count: "exact" });
  
        // === FILTER KEYWORD ===
        if (keywordLocal) {
          const safe = keywordLocal.replace(/%/g, "\\%").replace(/_/g, "\\_");
          const isDigits = /^\d+$/.test(safe);
  
          if (isDigits && (safe.length === 16 || safe.length === 15 || safe.length === 12)) {
            qBase = qBase.or(`nik.eq.${safe},no_kk.eq.${safe}`);
          } else {
            qBase = qBase.or(`nama.ilike.%${safe}%,nik.ilike.%${safe}%,no_kk.ilike.%${safe}%`);
          }
        }
  
        // === FILTER TAMBAHAN ===
        if (rwFilter && rwFilter !== "all") qBase = qBase.eq("rw", rwFilter);
        if (rtFilter && rtFilter !== "all") qBase = qBase.eq("rt", rtFilter);
  
        // === DAPATKAN TOTAL ROW ===
        const { count } = await qBase; // ambil total jumlah data
        const totalCount = count || 0;
        console.log("Total data:", totalCount);
  
        const batchSize = 1000; // maksimal 1000 per request
        let allResults = [];
  
        for (let start = 0; start < totalCount; start += batchSize) {
          const end = start + batchSize - 1;
          const { data, error } = await qBase
            .order("id_penduduk", { ascending: true })
            .range(start, end);
  
          if (error) throw error;
  
          allResults = [...allResults, ...data];
          console.log(`Fetched ${allResults.length} / ${totalCount} data_penduduk...`);
        }
  
        setAllData(allResults);
      } catch (err) {
        console.error("Gagal fetch data_penduduk:", err);
        setAllData([]);
      } finally {
        setLoading(false);
      }
    };
  
    fetchAllData();
  }, [location.search, rwFilter, rtFilter]);
  
  

  // === FETCH Kepala Keluarga (sekali) ===
  useEffect(() => {
    const fetchAllKepalaKK = async () => {
      try {
        let allRows = [];
        const { data: countData, error: countError, count } = await supabase
          .from("data_penduduk")
          .select("*", { count: "exact" });

        if (countError) throw countError;

        const batchSize = 1000;
        for (let i = 0; i < count; i += batchSize) {
          const { data, error } = await supabase
            .from("data_penduduk")
            .select("*")
            .order("id_penduduk", { ascending: true })
            .range(i, i + batchSize - 1);

          if (error) throw error;
          allRows = [...allRows, ...data];
        }

        // Grup per no_kk
        const grouped = {};
        allRows.forEach((d) => {
          if (!grouped[d.no_kk]) grouped[d.no_kk] = [];
          grouped[d.no_kk].push(d);
        });

        const withKepala = [];
        const withoutKepala = [];

        Object.values(grouped).forEach((anggota) => {
          const kepala = anggota.find(
            (a) => (a.status_keluarga || "").toLowerCase().trim() === "kepala keluarga"
          );
          if (kepala) {
            withKepala.push(kepala);
          } else {
            const placeholder = { ...anggota[0], nama: `${anggota[0].nama}` };
            withoutKepala.push(placeholder);
          }
        });

        // Gabungkan semua KK
        setKepalaKeluarga([...withKepala, ...withoutKepala]);
      } catch (err) {
        console.error("Gagal ambil data kepala keluarga:", err);
        setKepalaKeluarga([]);
      }
    };

    fetchAllKepalaKK();
  }, []);

  // === DATA UNIK (RW & RT) ===
  const uniqueRWs = [...new Set(allData.map((item) => item.rw).filter(Boolean))].sort();

  const uniqueRTs =
    rwFilter === "all"
      ? [...new Set(allData.map((item) => item.rt).filter(Boolean))].sort()
      : [...new Set(allData.filter((item) => item.rw === rwFilter).map((item) => item.rt).filter(Boolean))].sort();

  // === FILTER DATA ===
  const filteredData = allData.filter((item) => {
    if (filterMode === "all") return true;
    if (rwFilter !== "all" && item.rw !== rwFilter) return false;
    if (rtFilter !== "all" && item.rt !== rtFilter) return false;
    return true;
  });

  // === PAGINATION ===
  const totalPages = Math.max(1, Math.ceil(filteredData.length / entriesPerPage));
  const displayedData = filteredData.slice((currentPage - 1) * entriesPerPage, currentPage * entriesPerPage);

  // === HANDLER PAGINATION ===
  const handlePrevious = () => {
    if (currentPage > 1) setCurrentPage((p) => p - 1);
  };
  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage((p) => p + 1);
  };

  // === SELECTION HANDLERS ===
  const openDeleteModal = (id = null, mode = "single") => {
    setTargetId(id);
    setDeleteMode(mode);
    setShowDeleteModal(true);
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedIds([]);
      setSelectAll(false);
    } else {
      const allIds = displayedData.map((item) => item.id_penduduk);
      setSelectedIds(allIds);
      setSelectAll(true);
    }
  };

  // === CRUD / ACTIONS (ke Supabase) ===
  const handleSimpan = async () => {
    try {
      if (!formData.no_kk || !formData.nik || !formData.nama) {
        alert("No KK, NIK, dan Nama wajib diisi!");
        return;
      }

      // cek NIK
      const { data: cekNik, error: errCekNik } = await supabase.from("data_penduduk").select("nik").eq("nik", formData.nik);
      if (errCekNik) {
        console.error("Cek NIK error:", errCekNik);
        alert("Gagal memeriksa NIK. Coba lagi.");
        return;
      }
      if (cekNik && cekNik.length > 0) {
        alert("⚠️ NIK sudah terdaftar. Gunakan NIK lain!");
        return;
      }

      // pekerjaan final
      let finalPekerjaan = formData.pekerjaan;
      if (["Jasa Lainnya", "Lainnya"].includes(formData.pekerjaan)) {
        if (!formData.pekerjaanLain.trim()) {
          alert("Pekerjaan wajib diisi jika memilih 'Lainnya'!");
          return;
        }
        finalPekerjaan = formData.pekerjaanLain.trim();
      }

      // alamat final
      let finalAlamat = formData.alamat;
      if (formData.alamat === "Lainnya") {
        if (!customAlamat.trim()) {
          alert("Alamat wajib diisi jika memilih 'Lainnya'!");
          return;
        }
        finalAlamat = customAlamat.trim();
      }

      const dataToInsert = {
        no_kk: formData.no_kk,
        nik: formData.nik,
        nama: formData.nama,
        tempat_lahir: formData.tempat_lahir,
        tanggal_lahir: formData.tanggal_lahir || null,
        jk: formData.jk,
        agama: formData.agama,
        status_perkawinan: formData.status_perkawinan,
        pendidikan: formData.pendidikan,
        pekerjaan: finalPekerjaan,
        alamat: finalAlamat,
        rt: formData.rt || userRt || null,
        rw: formData.rw || userRw || null,
        status_keluarga: formData.status_keluarga,
        nik_ayah: formData.nik_ayah || null,
        nama_ayah: formData.nama_ayah,
        nik_ibu: formData.nik_ibu || null,
        nama_ibu: formData.nama_ibu,
        golongan_darah: formData.golongan_darah,
        desa: capitalize(formData.desa || "Margahayu Tengah"),
        kecamatan: capitalize(formData.kecamatan || "Margahayu"),
        kabupaten: capitalize(formData.kabupaten || "Bandung"),
        provinsi: capitalize(formData.provinsi || "Jawa Barat"),
        kode_pos: capitalize(formData.kode_pos || "40225"),
      };

      const { data: inserted, error } = await supabase.from("data_penduduk").insert([dataToInsert]).select();
      if (error) {
        console.error("Gagal tambah data:", error);
        alert("Gagal menambahkan data!\n" + (error.message || "Unknown error"));
        return;
      }

      if (inserted && inserted.length > 0) {
        setAllData((prev) => [...prev, ...inserted]);
      }

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
        tanggal_lahir_ayah: "",
        pekerjaan_ayah: "",
        nik_ayah: "",
        nama_ayah: "",
        tanggal_lahir_ibu: "",
        nik_ibu: "",
        nama_ibu: "",
        desa: "",
        kecamatan: "",
        kabupaten: "",
        provinsi: "",
        kode_pos: "",
        tanggal_pindah: "",
        alasan: "",
        alamat_pindah: "",
        rt_pindah: "",
        rw_pindah: "",
        desa_pindah: "",
        kecamatan_pindah: "",
        kabupaten_pindah: "",
        tanggal_kematian: "",
        sebab: "",
        tempat_kematian: "",
        golongan_darah: "",
        hari_kematian: "",
        pukul_kematian: "",
        jenis_update: "",
      });
      setSearchAlamat("");
      setCustomAlamat("");
      setShowCustomInput(false);
      setIsModalOpen(false);
      alert("✅ Data berhasil disimpan!");
    } catch (err) {
      console.error("Unhandled error di handleSimpan:", err);
      alert("Terjadi kesalahan teknis: " + (err?.message || err));
    }
  };

  const handleSimpanKelahiran = async () => {
    try {
      if (
        !formData.nama_ibu ||
        !formData.tanggal_lahir_ibu ||
        !formData.nama_ayah ||
        !formData.tanggal_lahir_ayah ||
        !formData.pekerjaan_ayah
      ) {
        alert("Semua data orang tua wajib diisi!");
        return;
      }
  
      // Pastikan ada id_penduduk (penting untuk update)
      if (!formData.id_penduduk) {
        alert("Data penduduk tidak ditemukan (id_penduduk kosong).");
        return;
      }
  
      // Update data orang tua ke tabel data_penduduk
      const { error } = await supabase
        .from("data_penduduk")
        .update({
          nama_ibu: formData.nama_ibu.trim(),
          tanggal_lahir_ibu: formData.tanggal_lahir_ibu,
          nama_ayah: formData.nama_ayah.trim(),
          tanggal_lahir_ayah: formData.tanggal_lahir_ayah,
          pekerjaan_ayah: formData.pekerjaan_ayah.trim(),
        })
        .eq("id_penduduk", formData.id_penduduk);
  
      if (error) {
        console.error("Gagal menyimpan data orang tua:", error);
        alert("❌ Gagal menyimpan data orang tua!");
        return;
      }
  
      // Jika berhasil, tutup modal dan beri notifikasi
      setIsModalKelahiranOpen(false);
      alert("✅ Data orang tua berhasil disimpan!");
  
      // (Opsional) bisa langsung panggil handlePrintKelahiran di sini
      // await handlePrintKelahiran(formData.id_penduduk);
  
      // Reset form jika diperlukan
      setFormData((prev) => ({
        ...prev,
        nama_ibu: "",
        tanggal_lahir_ibu: "",
        nama_ayah: "",
        tanggal_lahir_ayah: "",
        pekerjaan_ayah: "",
      }));
    } catch (err) {
      console.error("Unhandled error di handleSimpanKelahiran:", err);
      alert("Terjadi kesalahan teknis: " + (err?.message || err));
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteType) {
      alert("Pilih jenis hapus terlebih dahulu!");
      return;
    }

    const idsToDelete = deleteMode === "single" ? [targetId] : [...selectedIds];

    if (idsToDelete.length === 0) {
      alert("Pilih data yang ingin dihapus!");
      return;
    }

    if (deleteType === "pindah") {
      const selectedData = allData.filter((item) => idsToDelete.includes(item.id_penduduk));
      if (selectedData.length === 0) {
        alert("Data penduduk tidak ditemukan!");
        return;
      }
      setFormDataList(selectedData);
      setShowDeleteModal(false);
      setIsPindahModalOpen(true);
      return;
    }

    if (deleteType === "mati") {
      const selectedData = allData.filter((item) => idsToDelete.includes(item.id_penduduk));
      if (selectedData.length === 0) {
        alert("Data penduduk tidak ditemukan!");
        return;
      }
      setFormDataList(selectedData);
      setFormData({
        tanggal_kematian: "",
        sebab: "",
        tempat_kematian: "",
        pukul_kematian: "",
        hari_kematian: "",
      });
      setShowDeleteModal(false);
      setIsKematianModalOpen(true);
      return;
    }

    try {
      const { error } = await supabase.from("data_penduduk").delete().in("id_penduduk", idsToDelete);
      if (error) throw error;
      setAllData((prev) => prev.filter((item) => !idsToDelete.includes(item.id_penduduk)));
      setSelectedIds([]);
      setSelectAll(false);
      setShowDeleteModal(false);
      alert("Data berhasil dihapus!");
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSimpanKematian = async (e) => {
    e.preventDefault();
    try {
      if (formDataList.length === 0) {
        alert("Pilih data yang akan dimasukkan ke data kematian!");
        return;
      }
      if (!formData.tanggal_kematian || !formData.sebab || !formData.tempat_kematian) {
        alert("Tanggal, sebab, dan tempat kematian wajib diisi!");
        return;
      }

      const kematianData = formDataList.map((item) => ({
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
        tanggal_kematian: formData.tanggal_kematian,
        sebab: formData.sebab,
        tempat_kematian: formData.tempat_kematian,
        hari_kematian: formData.hari_kematian || formData.hari,
        pukul_kematian: formData.pukul_kematian || formData.pukul || null,
      }));

      const { error: insertError } = await supabase.from("data_kematian").insert(kematianData);
      if (insertError) throw insertError;

      const { error: deleteError } = await supabase
        .from("data_penduduk")
        .delete()
        .in("id_penduduk", formDataList.map((item) => item.id_penduduk));

      if (deleteError) throw deleteError;

      const idsRemoved = formDataList.map((d) => d.id_penduduk);
      setAllData((prev) => prev.filter((item) => !idsRemoved.includes(item.id_penduduk)));
      setSelectedIds([]);
      setFormDataList([]);
      setFormData({ tanggal_kematian: "", sebab: "", tempat_kematian: "", hari_kematian: "", pukul_kematian: "" });
      setIsKematianModalOpen(false);
      alert("Data berhasil dipindahkan ke tabel kematian!");
    } catch (err) {
      console.error("Gagal menyimpan data kematian:", err);
      alert("Gagal menyimpan data kematian: " + (err?.message || err));
    }
  };

  const handlePrint = async (id_penduduk) => {
  try {
    const { data, error } = await supabase
      .from("data_penduduk")
      .select("*")
      .eq("id_penduduk", id_penduduk)
      .single();

    if (error) throw error;
    const p = data;

    const pekerjaanLainnya =
      p.pekerjaan === "Jasa Lainnya" || p.pekerjaan === "Lainnya";

    const alamatFinal =
      p.alamat === "Lainnya" && p.alamat_detail
        ? p.alamat_detail
        : p.alamat || "-";

    const alamatLengkap = `${alamatFinal || "-"}, RT ${p.rt || "-"}, RW ${p.rw || "-"}, 
    Desa ${p.desa || "-"}, Kecamatan ${p.kecamatan || "-"}, 
    Kabupaten ${p.kabupaten || "-"}, Provinsi ${p.provinsi || "-"}, ${p.kode_pos || "-"}`;

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    doc.setFont("times", "normal");
    doc.setFontSize(11);

    // helper: fit text into maxWidth by reducing font size if perlu,
    // lalu gambar text centered di centerX, pada posisi y.
    const fitTextToWidth = (doc, text, centerX, maxWidth, y, opts = {}) => {
      const {
        fontName = "times",
        fontStyle = "normal",
        initialSize = 11,
        minSize = 7,
        step = 0.2,
      } = opts;

      doc.setFont(fontName, fontStyle);
      let size = initialSize;
      doc.setFontSize(size);

      // Jika text terlalu lebar, kecilkan font sampai muat atau sampai minSize
      while (doc.getTextWidth(text) > maxWidth && size > minSize) {
        size = Math.max(minSize, size - step);
        doc.setFontSize(size);
      }

      const textWidth = doc.getTextWidth(text);
      const xPos = centerX - textWidth / 2;
      doc.text(String(text), xPos, y);
    };

    let y = 25;

    // Logo opsional (asumsikan `logo` ada di scope luar)
    if (typeof logo !== "undefined" && logo) {
      const img = new Image();
      img.src = logo;
      await new Promise((resolve) => {
        img.onload = () => {
          doc.addImage(img, "PNG", 90, 8, 30, 30);
          resolve();
        };
        // jika gagal load, lanjut saja
        img.onerror = () => resolve();
      });
      y = 45;
    }

    // Judul
    doc.setFontSize(13);
    doc.text("BIODATA PENDUDUK WARGA NEGARA INDONESIA", 105, y, {
      align: "center",
    });

    // NIK di tengah, dekat judul
    y += 10;
    doc.setFontSize(11);
    doc.text(`NIK : ${p.nik || "-"}`, 105, y, { align: "center" });

    // DATA PERSONAL
    y += 12;
    doc.setFontSize(11);
    doc.text("DATA PERSONAL", 35, y);

    const personalData = [
      ["Nama lengkap", p.nama || "-"],
      ["Tempat Lahir", p.tempat_lahir || "-"],
      ["Tanggal Lahir", p.tanggal_lahir || "-"],
      ["Jenis Kelamin", p.jk || "-"],
      ["Golongan Darah", p.golongan_darah || "-"],
      ["Agama", p.agama || "-"],
      ["Pendidikan Terakhir", p.pendidikan || "-"],
      [
        "Jenis Pekerjaan",
        pekerjaanLainnya ? p.pekerjaan_detail || "-" : p.pekerjaan || "-",
      ],
      ["Status Perkawinan", p.status_perkawinan || "-"],
      ["Hubungan Keluarga", p.status_keluarga || "-"],
      ["NIK Ibu", p.nik_ibu || "-"],
      ["Nama Lengkap Ibu", p.nama_ibu || "-"],
      ["NIK Ayah", p.nik_ayah || "-"],
      ["Nama Lengkap Ayah", p.nama_ayah || "-"],
      ["Alamat Lengkap", alamatLengkap],
    ];

    // Kolom lebih ke tengah
    const xLabel = 35;
    const xColon = 85;
    const xValue = 90;

    y += 8;
    personalData.forEach(([label, value]) => {
      doc.setFontSize(11);
      doc.text(label, xLabel, y);
      doc.text(":", xColon, y);
      doc.text(String(value), xValue, y, { maxWidth: 100 });
      y += 7;
    });

    // DATA KEPEMILIKAN DOKUMEN (lebih dekat)
    y += 10;
    doc.text("DATA KEPEMILIKAN DOKUMEN", xLabel, y);

    y += 8;
    doc.text("Nomor Kartu Keluarga", xLabel, y);
    doc.text(":", xColon, y);
    doc.text(p.no_kk || "-", xValue, y);

    // Bagian tanda tangan (lebih dekat & posisi proporsional)
    y += 18;
    const today = new Date();
    const tanggalCetak = `${String(today.getDate()).padStart(2, "0")}-${String(
      today.getMonth() + 1
    ).padStart(2, "0")}-${today.getFullYear()}`;

    // Tanggal — saya taruh di kanan seperti semula (boleh ubah center ke 105 jika mau)
    doc.text(`Bandung, ${tanggalCetak}`, 130, y, { align: "center" });

    y += 10;
    // Tentukan area tanda tangan (kiri dan kanan)
    const centerXLeft = 55;  // geser ke kiri dari 75
    const centerXRight = 130; // geser ke kiri dari 155
    const maxSigWidth = 60;   // maksimal lebar nama sebelum di-small-font

    // Gambar label "Pemohon" dan "Kepala Desa" terpusat di masing-masing kolom
    doc.setFontSize(11);
    doc.text("Pemohon,", centerXLeft, y, { align: "center" });
    doc.text("Kepala Desa MARGAHAYU TENGAH", centerXRight, y, { align: "center" });

    y += 20;

    // Nama pemohon: gunakan helper untuk menyesuaikan lebar dan center
    const namaPemohon = p.nama || "........................";
    fitTextToWidth(doc, namaPemohon, centerXLeft, maxSigWidth, y, { initialSize: 11, minSize: 7 });

    // Nama kepala desa: juga kita fit & center supaya proporsional
    const namaKepala = "Drs. ASEP ZAENAL MAHMUD";
    fitTextToWidth(doc, namaKepala, centerXRight, maxSigWidth, y, { initialSize: 11, minSize: 7 });

    // Simpan
    doc.save(`Biodata-${(p.nama || "penduduk").replace(/[^a-z0-9\- ]/gi, "")}.pdf`);
    } catch (err) {
      console.error("Gagal generate PDF:", err);
    }
  };

  const [rwOptions, setRwOptions] = useState([]);
  const [rtListForRw, setRtListForRw] = useState([]);

  useEffect(() => {
    const fetchUsersRwRt = async () => {
      try {
        const { data, error } = await supabase.from("users").select("rt, rw");
        if (error) throw error;

        // Ambil RW unik
        const uniqueRw = [...new Set(data.map(u => u.rw))].sort();
        setRwOptions(uniqueRw);

        // RT awal semua
        const uniqueRt = [...new Set(data.map(u => u.rt))].sort();
        setRtListForRw(uniqueRt);

        // Bisa juga set RW/RT default sesuai user login
        const rawId = localStorage.getItem("userId");
        if (rawId) {
          const user = data.find(u => u.id === Number(rawId));
          if (user) {
            setFormData(prev => ({ ...prev, rw: user.rw, rt: user.rt }));
            setSearchRw(user.rw);
            setSearchRt(user.rt);
          }
        }
      } catch (err) {
        console.error("Gagal fetch RW/RT dari users:", err);
      }
    };
    fetchUsersRwRt();
  }, []);

  // EFFECT: setiap RW berubah → update RT list sesuai RW
  useEffect(() => {
    const fetchRtForSelectedRw = async () => {
      try {
        if (!formData.rw) {
          setRtListForRw([]);
          return;
        }
        const { data, error } = await supabase
          .from("users")
          .select("rt")
          .eq("rw", formData.rw);
        if (error) throw error;

        const uniqueRtForRw = [...new Set(data.map(u => u.rt))].sort();
        setRtListForRw(uniqueRtForRw);

        // otomatis set RT pertama jika ada
        if (uniqueRtForRw.length > 0) {
          setFormData(prev => ({ ...prev, rt: uniqueRtForRw[0] }));
          setSearchRt(uniqueRtForRw[0]);
        } else {
          setFormData(prev => ({ ...prev, rt: "" }));
          setSearchRt("");
        }
      } catch (err) {
        console.error("Gagal fetch RT untuk RW:", err);
      }
    };
    fetchRtForSelectedRw();
  }, [formData.rw]);

  const handlePrintKelahiran = async (id_penduduk) => {
    try {
      // === Ambil data penduduk ===
      const { data: p, error } = await supabase
        .from("data_penduduk")
        .select("*")
        .eq("id_penduduk", id_penduduk)
        .single();
      if (error) throw error;
  
      // === Ambil data ayah & ibu ===
      let dataAyah = null;
      let dataIbu = null;
  
      if (p.nik_ayah && p.nik_ayah.trim() !== "") {
        const { data: ayah, error: errAyah } = await supabase
          .from("data_penduduk")
          .select("nama, tanggal_lahir, pekerjaan, nik")
          .eq("nik", p.nik_ayah.trim())
          .maybeSingle();
        if (errAyah) console.error("Gagal ambil data ayah:", errAyah);
        dataAyah = ayah;
      }
  
      if (p.nik_ibu && p.nik_ibu.trim() !== "") {
        const { data: ibu, error: errIbu } = await supabase
          .from("data_penduduk")
          .select("nama, tanggal_lahir, pekerjaan, nik")
          .eq("nik", p.nik_ibu.trim())
          .maybeSingle();
        if (errIbu) console.error("Gagal ambil data ibu:", errIbu);
        dataIbu = ibu;
      }
  
      // === Cek kelengkapan data orang tua ===
      const namaIbu = (p.nama_ibu || dataIbu?.nama || "").trim();
      const tglIbu = (p.tanggal_lahir_ibu || dataIbu?.tanggal_lahir || "").trim();
      const namaAyah = (p.nama_ayah || dataAyah?.nama || "").trim();
      const tglAyah = (p.tanggal_lahir_ayah || dataAyah?.tanggal_lahir || "").trim();
      const pekerjaanAyah = (p.pekerjaan_ayah || dataAyah?.pekerjaan || "").trim();
  
      const missing = !namaIbu || !tglIbu || !namaAyah || !tglAyah || !pekerjaanAyah;
      if (missing) {
        setPendingPrintId(id_penduduk);
        setFormData((prev) => ({
          ...prev,
          id_penduduk: p.id_penduduk,
          nama_ibu: namaIbu,
          tanggal_lahir_ibu: tglIbu,
          nama_ayah: namaAyah,
          tanggal_lahir_ayah: tglAyah,
          pekerjaan_ayah: pekerjaanAyah,
        }));
        setIsModalKelahiranOpen(true);
        return;
      }
  
      // === Format tanggal (dd/mm/yyyy dengan leading zero) ===
      const formatTanggal = (tglStr) => {
        if (!tglStr) return "-";
        const d = new Date(tglStr);
        if (isNaN(d)) return "-";
        const day = String(d.getDate()).padStart(2, "0");
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
      };
  
      const tglLahirAyah = formatTanggal(dataAyah?.tanggal_lahir || p.tanggal_lahir_ayah);
      const tglLahirIbu = formatTanggal(dataIbu?.tanggal_lahir || p.tanggal_lahir_ibu);
  
      // === Hitung nomor urut berdasarkan riwayat_cetak_kelahiran tahun ini ===
      const currentYear = new Date().getFullYear();
      const startOfYear = `${currentYear}-01-01T00:00:00Z`;
      const endOfYear = `${currentYear}-12-31T23:59:59Z`;
  
      const { data: semuaRiwayat, error: errRiwayat } = await supabase
        .from("riwayat_cetak_kelahiran")
        .select("id_riwayat")
        .gte("tanggal_cetak", startOfYear)
        .lte("tanggal_cetak", endOfYear);
  
      if (errRiwayat) console.error("Gagal ambil riwayat cetak:", errRiwayat);
  
      const noUrut = String((semuaRiwayat?.length || 0) + 1).padStart(3, "0");
      const bulanRomawi = [
        "I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII"
      ][new Date().getMonth()];
      const nomorSurat = `No. 471.11/${noUrut}/MT/${bulanRomawi}/${currentYear}-PEM`;
  
      // === Simpan riwayat cetak ke tabel riwayat_cetak_kelahiran ===
      const { error: errInsert } = await supabase
        .from("riwayat_cetak_kelahiran")
        .insert([
          {
            id_penduduk,
            nomor_surat: nomorSurat,
            tanggal_cetak: new Date().toISOString(),
          },
        ]);
      if (errInsert) console.error("Gagal simpan riwayat cetak:", errInsert);
  
      // === Siapkan PDF ===
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  
      const marginTop = 3;
      const marginLeft = 15;
      const kolomLebar = 80;
      const tinggiSurat = 185;
      const jarakKolom = 13;
  
      const kolom = [
        { x: marginLeft, label: "Untuk Pemohon" },
        { x: marginLeft + kolomLebar + jarakKolom, label: "Arsip Desa/Kel" },
        { x: marginLeft + (kolomLebar + jarakKolom) * 2, label: "Arsip Kecamatan" },
      ];
  
      const today = new Date();
      const tanggalCetak = `${today.getDate()} ${today.toLocaleString("id-ID", { month: "long" })} ${today.getFullYear()}`;
  
      // === Fungsi menggambar surat ===
      const drawSurat = (x, label) => {
        let y = marginTop;
        const pad = 1;
        const lineHeight = 4.5;
        const xCenter = x + kolomLebar / 2;
        const offsetY = 7;
        const labelX = x + pad;
        const titik2X = x + pad + 25;
        const isiTabX = x + pad + 29;
        const offsetKanan = 7;
        const shiftLeft = -5;
  
        // Header NIK & KK
        doc.setFont("ariali", "italic");
        doc.setFontSize(8.5);
        doc.text("N I K", labelX, y + offsetY);
        doc.text(":", labelX + 11, y + offsetY);
        doc.text(p.nik || "-", labelX + 14, y + offsetY);
        y += lineHeight;
        doc.text("No. KK", labelX, y + offsetY);
        doc.text(":", labelX + 11, y + offsetY);
        doc.text(p.no_kk || "-", labelX + 14, y + offsetY);
  
        // Label kolom
        doc.setFont("arialbd", "bold");
        doc.setFontSize(9);
        doc.text(label, x + kolomLebar - 0.5, y + 8, { align: "right" });
  
        // Kotak surat
        doc.setFont("arial", "normal");
        doc.setFontSize(9);
        y += lineHeight * 2;
        const kotakAwalY = y;
        doc.setLineWidth(0.4);
        doc.rect(x, kotakAwalY, kolomLebar, tinggiSurat);
        y += 8;
  
        // Judul & nomor
        doc.setFontSize(14);
        doc.text("SURAT KELAHIRAN", xCenter, y, { align: "center" });
        y += lineHeight + 1;
        doc.setFontSize(9);
        doc.text(nomorSurat, xCenter, y, { align: "center" });
        y += lineHeight * 2;
  
        const tgl = p.tanggal_lahir ? new Date(p.tanggal_lahir) : null;
        const hari = tgl ? tgl.toLocaleDateString("id-ID", { weekday: "long" }) : "-";
        const tanggal = tgl
          ? `${String(tgl.getDate()).padStart(2, "0")} ${tgl.toLocaleString("id-ID", { month: "long" })} ${tgl.getFullYear()}`
          : "-";
  
        doc.text("    Yang  bertanda  tangan  dibawah   ini,", x + pad + 3 + offsetKanan + shiftLeft, y);
        y += lineHeight;
        doc.text("menerangkan bahwa pada :", x + pad + offsetKanan + shiftLeft, y);
        y += lineHeight;
  
        doc.text("Hari", x + pad + offsetKanan + shiftLeft, y);
        doc.text(":", titik2X + offsetKanan + shiftLeft, y);
        doc.text(hari, isiTabX + offsetKanan + shiftLeft, y);
        y += lineHeight;
  
        doc.text("Tanggal", x + pad + offsetKanan + shiftLeft, y);
        doc.text(":", titik2X + offsetKanan + shiftLeft, y);
        doc.text(tanggal, isiTabX + offsetKanan + shiftLeft, y);
        y += lineHeight;
  
        doc.text("Di", x + pad + offsetKanan + shiftLeft, y);
        doc.text(":", titik2X + offsetKanan + shiftLeft, y);
        doc.text(p.tempat_lahir || "-", isiTabX + offsetKanan + shiftLeft, y);
        y += lineHeight + 1;
  
        // Jenis kelamin (kapital depan)
        const jenisKelaminRaw = (p.jk || "-").toLowerCase();
        const jenisKelamin = jenisKelaminRaw.charAt(0).toUpperCase() + jenisKelaminRaw.slice(1);
        doc.text(`telah lahir seorang anak : ${jenisKelamin}`, x + pad + offsetKanan + shiftLeft, y);
        y += lineHeight * 1.15;
  
        // Nama anak
        doc.text("bernama", x + pad + offsetKanan + shiftLeft, y);
        doc.text(":", titik2X + offsetKanan + shiftLeft, y);
        doc.setFont("arialbd", "bold");
        doc.setFontSize(10);
        doc.text(`--${(p.nama || "-").toUpperCase()}--`, xCenter, y + 6, { align: "center" });
        doc.setFont("arial", "normal");
  
        // Ibu
        y += lineHeight * 3;
        doc.text("Dari seorang ibu bernama :", x + pad + offsetKanan + shiftLeft, y);
        y += lineHeight * 0.9;
        doc.setFont("arialbd", "bold");
        doc.text(`--${(namaIbu || "-").toUpperCase()}--`, xCenter, y + 3, { align: "center" });
        doc.setFont("arial", "normal");
  
        y += lineHeight * 2.0;
        doc.text("Tgl Lhr/Umur", x + pad + offsetKanan + shiftLeft, y);
        doc.text(":", titik2X + offsetKanan + shiftLeft, y);
        doc.text(tglLahirIbu || "-", isiTabX + offsetKanan + shiftLeft, y);
  
        // Ayah
        y += lineHeight * 1.8;
        doc.text("Istri dari", x + pad + offsetKanan + shiftLeft, y);
        doc.text(":", titik2X + offsetKanan + shiftLeft, y);
        y += lineHeight * 0.9;
        doc.setFont("arialbd", "bold");
        doc.text(`--${(namaAyah || "-").toUpperCase()}--`, xCenter, y + 3, { align: "center" });
        doc.setFont("arial", "normal");
  
        y += lineHeight * 2.0;
        doc.text("Tgl Lhr/Umur", x + pad + offsetKanan + shiftLeft, y);
        doc.text(":", titik2X + offsetKanan + shiftLeft, y);
        doc.text(tglLahirAyah || "-", isiTabX + offsetKanan + shiftLeft, y);
  
        y += lineHeight;
        doc.text("Pekerjaan", x + pad + offsetKanan + shiftLeft, y);
        doc.text(":", titik2X + offsetKanan + shiftLeft, y);
        doc.text(pekerjaanAyah || "-", isiTabX + offsetKanan + shiftLeft, y);
  
        // === ALAMAT ===
        y += lineHeight * 1;
        doc.text("Alamat", x + pad + offsetKanan + shiftLeft, y);
        doc.text(":", titik2X + offsetKanan + shiftLeft, y);

        const alamatTeks = p.alamat || "-";
        const alamatWrapped = doc.splitTextToSize(alamatTeks, 40);

        const lineSpacing = lineHeight * 1.1;
        alamatWrapped.forEach((baris, i) => {
          doc.text(baris, isiTabX + offsetKanan + shiftLeft, y + i * lineSpacing);
        });

        // Sesuaikan posisi Y setelah semua baris alamat tercetak
        y += lineSpacing * alamatWrapped.length + lineHeight * 0;

        doc.text(`RT : ${p.rt || "-"}  RW : ${p.rw || "-"}`, isiTabX + offsetKanan + shiftLeft, y);
        y += lineHeight;
        doc.text("Desa/Kel", x + pad + offsetKanan + shiftLeft, y);
        doc.text(":", titik2X + offsetKanan + shiftLeft, y);
        doc.text(`${(p.desa || "MARGAHAYU TENGAH").toUpperCase()}`, isiTabX + offsetKanan + shiftLeft, y);
        y += lineHeight;
        doc.text("Kecamatan", x + pad + offsetKanan + shiftLeft, y);
        doc.text(":", titik2X + offsetKanan + shiftLeft, y);
        doc.text(`${(p.kecamatan || "MARGAHAYU").toUpperCase()}`, isiTabX + offsetKanan + shiftLeft, y);

        // Tambahkan spasi dinamis sebelum penutup
        y += lineHeight * 2;

        // === PENUTUP ===
        doc.text("    Surat keterangan ini dibuat atas dasar", x + pad + 3 + offsetKanan + shiftLeft, y);
        y += lineHeight;
        doc.text("yang sebenarnya.", x + pad + offsetKanan + shiftLeft, y);

        // Tambahkan jarak dinamis antara isi dan tanda tangan
        y += lineHeight * 0.5;

        // Hitung posisi tanda tangan agar tidak tumpuk
        const yTtd = Math.max(y + 5, kotakAwalY + tinggiSurat - 30);

        // === TANDA TANGAN ===
        doc.text(`BANDUNG, ${tanggalCetak}`, xCenter, yTtd, { align: "center" });
        doc.text("Kepala Desa MARGAHAYU TENGAH", xCenter, yTtd + lineHeight, { align: "center" });
        doc.setFont("arialbd", "bold");
        doc.text("Drs. ASEP ZAENAL MAHMUD", xCenter, yTtd + 22, { align: "center" });
      };
  
      // Gambar 3 rangkap surat
      kolom.forEach((k) => drawSurat(k.x, k.label));
  
      // Simpan PDF
      doc.save(`Surat_Kelahiran_${(p.nama || "").replace(/[^a-z0-9\- ]/gi, "")}.pdf`);
    } catch (err) {
      console.error("Gagal generate PDF:", err);
    }
  };

  useEffect(() => {
    const fetchKepalaKeluarga = async () => {
      try {
        const { data, error } = await supabase
          .from("data_penduduk")
          .select("*")
          .eq("status_keluarga", "Kepala Keluarga");

        if (error) throw error;
        setKepalaKeluarga(data || []);
      } catch (err) {
        console.error("Gagal ambil data kepala keluarga:", err.message);
      }
    };

    fetchKepalaKeluarga();
  }, []);

  return (
    <div className="p-6 bg-white rounded-lg shadow relative">
      {/* Header */}
      <div className="flex items-center bg-green-500 text-white px-4 py-3 rounded-t-lg">
        <FileText className="w-5 h-5 mr-2" />
        <h1 className="text-lg font-semibold">Data Penduduk</h1>
      </div>

     {/* top controls */}
    <div className="flex justify-between items-center mt-4 mb-4 flex-wrap gap-3">
      {/* kiri: show entries + filter RW & RT */}
      <div className="flex items-center gap-4 flex-wrap">
        {/* show entries */}
        <div className="flex items-center space-x-2">
          <span className="text-sm">Show</span>
          <select
            value={entriesPerPage}
            onChange={(e) => setEntriesPerPage(Number(e.target.value))}
            className="appearance-none bg-gray-200 border rounded px-2 py-1 text-sm pr-6 focus:outline-none"
          >
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={150}>150</option>
            <option value={200}>200</option>
          </select>
          <span className="text-sm">entries</span>
        </div>

        {/* filter RW & RT */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Filter:</span>
            {/* Segmented Control */}
            <div className="flex rounded-lg overflow-hidden border">
              <button
                onClick={() => {
                  setFilterMode("all");
                  setRwFilter("all");
                  setRtFilter("all");
                }}
                className={`px-4 py-1 text-sm font-medium ${
                  filterMode === "all"
                    ? "bg-green-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => {
                  setFilterMode("rw");
                  setRwFilter("all"); // default tampil semua RW
                  setRtFilter("all");
                }}
                className={`px-4 py-1 text-sm font-medium ${
                  filterMode === "rw"
                    ? "bg-green-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                RW
              </button>
            </div>

            {/* Dropdown RW & RT muncul kalau pilih RW */}
            {filterMode === "rw" && (
              <div className="flex items-center gap-2">
                {/* Dropdown RW */}
                <select
                  className="border rounded px-2 py-1 text-sm"
                  value={rwFilter}
                  onChange={(e) => {
                    setRwFilter(e.target.value);
                    setRtFilter("all");
                    setCurrentPage(1);
                  }}
                >
                  <option value="all">Semua RW</option>
                  {uniqueRWs.map((r) => (
                    <option key={r} value={r}>{`RW ${r}`}</option>
                  ))}
                </select>

                {/* Dropdown RT */}
                <select
                  className="border rounded px-2 py-1 text-sm"
                  value={rtFilter}
                  onChange={(e) => {
                    setRtFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="all">Semua RT</option>
                  {uniqueRTs.map((r) => (
                    <option key={r} value={r}>{`RT ${r}`}</option>
                  ))}
                </select>
              </div>
            )}
        </div>
      </div>

      {/* kanan: action buttons */}
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
          to="/admin/kelola_data/data_penduduk/template"
        >
          <Upload className="mr-2" /> Import Excel
        </Link>
      </div>
    </div>

      {/* Tabel */}
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-200">
          <thead className="bg-green-700 text-white">
            <tr>
              {/* Checkbox master */}
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
            {loading ? (
              <tr>
                <td colSpan="8" className="text-center py-4 text-gray-500">
                  Memuat data...
                </td>
              </tr>
            ) : displayedData.length > 0 ? (
              // ✅ Urutkan data dari id_penduduk terbaru
              displayedData
                .slice() // buat salinan agar tidak mutasi state asli
                .sort((a, b) => b.id_penduduk - a.id_penduduk)
                .map((item, index) => (
                  <tr key={item.id_penduduk} className="hover:bg-gray-50">
                    {/* Checkbox per baris */}
                    <td className="px-4 py-2 border text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item.id_penduduk)}
                        onChange={() => toggleSelect(item.id_penduduk)}
                      />
                    </td>

                    {/* Nomor urut tabel */}
                    <td className="px-4 py-2 border text-center">
                      {index + 1 + (currentPage - 1) * entriesPerPage}
                    </td>

                    {/* Kolom data penduduk */}
                    <td className="px-4 py-2 border text-center">{item.nik}</td>
                    <td className="px-4 py-2 border text-center">{item.nama}</td>
                    <td className="px-4 py-2 border text-center">{item.jk}</td>
                    <td className="px-4 py-2 border text-center">{item.no_kk}</td>
                    <td className="px-4 py-2 border text-center">
                      {item.alamat?.toLowerCase() === "lainnya" && item.alamat_detail
                        ? item.alamat_detail
                        : item.alamat || "-"}
                    </td>

                    {/* Tombol aksi */}
                    <td className="px-4 py-2 border text-center">
                      <div className="flex justify-center space-x-2">
                        {/* FileText */}
                        <button
                          onClick={() => handlePrintKelahiran(item.id_penduduk)}
                          className={`p-2 text-purple-600 hover:bg-blue-100 rounded-full ${
                            item.status_keluarga !== "Anak" ? "invisible" : ""
                          }`}
                        >
                          <FileText className="w-4 h-4" />
                        </button>

                        {/* Print */}
                        <button
                          onClick={() => handlePrint(item.id_penduduk)}
                          className="p-2 text-green-600 hover:bg-blue-100 rounded-full"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        {/* Lihat */}
                        <Link
                          to={`/admin/kelola_data/data_penduduk/${item.id_penduduk}${buildQueryString()}`}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-full"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>

                        {/* Edit */}
                        <Link
                          to={`/admin/kelola_data/edit/${item.id_penduduk}${buildQueryString()}`}
                          className="p-2 text-yellow-600 hover:bg-yellow-100 rounded-full"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>

                        {/* Hapus */}
                        <button
                          onClick={() => openDeleteModal(item.id_penduduk, "single")}
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
                <td colSpan="8" className="text-center py-4 text-gray-500">
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
          Showing {(currentPage - 1) * entriesPerPage + 1} to{" "}
          {Math.min(currentPage * entriesPerPage, allData.length)} of{" "}
          {allData.length} entries
        </span>

        <div className="space-x-2 flex items-center">
          <button
            onClick={handlePrevious}
            disabled={currentPage === 1}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            Previous
          </button>

          {(() => {
            const pageNumbers = [];
            const maxVisible = 3; // jumlah halaman sekitar currentPage yang ditampilkan
            const total = totalPages;

            for (let i = 1; i <= total; i++) {
              if (
                i === 1 || // selalu tampilkan halaman pertama
                i === total || // selalu tampilkan halaman terakhir
                (i >= currentPage - maxVisible && i <= currentPage + maxVisible)
              ) {
                pageNumbers.push(i);
              } else if (
                i === currentPage - maxVisible - 1 ||
                i === currentPage + maxVisible + 1
              ) {
                pageNumbers.push("ellipsis-" + i); // tanda ...
              }
            }

            return pageNumbers.map((num, idx) =>
              typeof num === "number" ? (
                <button
                  key={idx}
                  onClick={() => setCurrentPage(num)}
                  className={`px-3 py-1 rounded ${
                    currentPage === num
                      ? "bg-green-500 text-white"
                      : "bg-gray-200"
                  }`}
                >
                  {num}
                </button>
              ) : (
                <span key={idx} className="px-3 py-1">
                  ...
                </span>
              )
            );
          })()}

          <button
            onClick={handleNext}
            disabled={currentPage === totalPages || totalPages === 0}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {/* Modal Tambah Data Penduduk */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white rounded-lg shadow-lg w-full max-w-3xl p-6 z-10 overflow-y-auto max-h-[90vh]">
            <h2 className="text-xl font-semibold mb-4">Tambah Data Penduduk</h2>
            <form className="grid grid-cols-2 gap-4">

              {/* No KK - Kepala Keluarga*/}
              <div className="relative w-full">
                    <input
                      type="text"
                      placeholder="-- Pilih No KK / Kepala Keluarga --"
                      value={
                        inputManual
                          ? "Input Manual"
                          : searchKK ||
                            (formData.no_kk
                              ? `${formData.no_kk} - ${
                                  kepalaKeluarga.find((k) => k.no_kk === formData.no_kk)?.nama || ""
                                }`
                              : "")
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        setInputManual(false);
                        setSearchKK(val);
                        setShowKKDropdown(true);

                        if (val.trim() === "") {
                          setFormData({
                            ...formData,
                            no_kk: "",
                            alamat: "",
                            rt: "",
                            rw: "",
                            desa: "",
                            kecamatan: "",
                            kabupaten: "",
                            provinsi: "",
                            kode_pos: "",
                          });
                        }
                      }}
                      onClick={() => {
                        setInputManual(false);
                        setShowKKDropdown(true);
                      }}
                      onFocus={() => setShowKKDropdown(true)}
                      onBlur={() => setTimeout(() => setShowKKDropdown(false), 200)}
                      className="border rounded px-3 py-2 w-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-400"
                    />

                    {showKKDropdown && (
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
                              onMouseDown={() => {
                                setInputManual(false);
                                setFormData({
                                  ...formData,
                                  no_kk: k.no_kk,
                                  alamat: k.alamat,
                                  rt: k.rt,
                                  rw: k.rw,
                                  desa: k.desa,
                                  kecamatan: k.kecamatan,
                                  kabupaten: k.kabupaten,
                                  provinsi: k.provinsi,
                                  kode_pos: k.kode_pos,
                                });
                                setSearchKK(`${k.no_kk} - ${k.nama}`);
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
                          onMouseDown={() => {
                            setInputManual(true);
                            setFormData({
                              ...formData,
                              no_kk: "",
                              alamat: "",
                              rt: "",
                              rw: "",
                              desa: "",
                              kecamatan: "",
                              kabupaten: "",
                              provinsi: "",
                              kode_pos: "",
                            });
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

              {/* Input Manual No KK */}
              {inputManual && (
                <input
                  type="text"
                  placeholder="Masukkan No KK"
                  value={formData.no_kk}
                  onChange={(e) => setFormData({ ...formData, no_kk: e.target.value })}
                  className="border rounded px-3 py-2"
                />
              )}

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

              {/* RW (dropdown diambil dari users) */}
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="-- Pilih RW --"
                  value={searchRw} // <-- gunakan searchRw sebagai source of truth
                  onChange={(e) => {
                    const v = e.target.value;
                    setSearchRw(v);
                    // sinkron agar tidak fallback ketika dihapus
                    setFormData(prev => ({ ...prev, rw: v }));
                    setShowRwDropdown(true);
                  }}
                  onClick={() => setShowRwDropdown(true)}
                  onFocus={() => setShowRwDropdown(true)}
                  onBlur={() => setTimeout(() => setShowRwDropdown(false), 150)}
                  className="border rounded px-3 py-2 w-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-400"
                />

                {showRwDropdown && (
                  <ul className="absolute z-10 w-full bg-white border rounded shadow max-h-40 overflow-y-auto">
                    {rwOptions
                      .filter(item => item.toLowerCase().includes((searchRw || "").toLowerCase()))
                      .map((item, index) => (
                        <li
                          key={index}
                          onMouseDown={() => {
                            // ketika RW dipilih, set RW & reset RT (effect fetchRtsForRw akan men-set RT default)
                            setFormData(prev => ({ ...prev, rw: item, rt: "" }));
                            setSearchRw(item);
                            setSearchRt(""); // clear RT visible sementara
                            setShowRwDropdown(false);
                          }}
                          className="px-3 py-2 hover:bg-green-100 cursor-pointer"
                        >
                          {item}
                        </li>
                      ))}
                  </ul>
                )}
              </div>

              {/* RT (otomatis mengikuti RW yang dipilih) */}
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="-- Pilih RT --"
                  value={searchRt} // <-- gunakan searchRt sebagai source of truth
                  onChange={(e) => {
                    const v = e.target.value;
                    setSearchRt(v);
                    // sinkron agar tidak fallback ketika dihapus
                    setFormData(prev => ({ ...prev, rt: v }));
                    setShowRtDropdown(true);
                  }}
                  onClick={() => setShowRtDropdown(true)}
                  onFocus={() => setShowRtDropdown(true)}
                  onBlur={() => setTimeout(() => setShowRtDropdown(false), 150)}
                  className="border rounded px-3 py-2 w-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-400"
                />

                {showRtDropdown && (
                  <ul className="absolute z-10 w-full bg-white border rounded shadow max-h-40 overflow-y-auto">
                    {rtListForRw
                      .filter(item => item.toLowerCase().includes((searchRt || "").toLowerCase()))
                      .map((item, index) => (
                        <li
                          key={index}
                          onMouseDown={() => {
                            setFormData(prev => ({ ...prev, rt: item }));
                            setSearchRt(item);
                            setShowRtDropdown(false);
                          }}
                          className="px-3 py-2 hover:bg-green-100 cursor-pointer"
                        >
                          {item}
                        </li>
                      ))}
                  </ul>
                )}
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

              {/* Desa, Kecamatan, Kabupaten, Provinsi, Kode Pos*/}
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
                <span>Hapus Data Duplikat</span>
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

      {/* MODAL Data Orang Tua Untuk Surat Kelahiran */}
      {isModalKelahiranOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setIsModalKelahiranOpen(false)} // perbaikan: sesuai nama state modal
          ></div>

          <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md p-6 z-10">
            <h2 className="text-xl font-semibold mb-4 text-center">Data Orang Tua</h2>

            <form onSubmit={handleSimpanKelahiran} className="grid grid-cols-1 gap-3">
              {/* Nama Ibu */}
              <input
                type="text"
                placeholder="Nama Ibu"
                value={formData.nama_ibu || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, nama_ibu: e.target.value }))
                }
                className="border rounded px-3 py-2 w-full"
              />

              {/* Tanggal Lahir Ibu */}
              <input
                type="date"
                placeholder="Tanggal Lahir Ibu"
                value={formData.tanggal_lahir_ibu || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    tanggal_lahir_ibu: e.target.value,
                  }))
                }
                className="border rounded px-3 py-2 w-full"
              />

              {/* Nama Ayah */}
              <input
                type="text"
                placeholder="Nama Ayah"
                value={formData.nama_ayah || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, nama_ayah: e.target.value }))
                }
                className="border rounded px-3 py-2 w-full"
              />

              {/* Tanggal Lahir Ayah */}
              <input
                type="date"
                placeholder="Tanggal Lahir Ayah"
                value={formData.tanggal_lahir_ayah || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    tanggal_lahir_ayah: e.target.value,
                  }))
                }
                className="border rounded px-3 py-2 w-full"
              />

              {/* Pekerjaan Ayah */}
              <input
                type="text"
                placeholder="Pekerjaan Ayah"
                value={formData.pekerjaan_ayah || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, pekerjaan_ayah: e.target.value }))
                }
                className="border rounded px-3 py-2 w-full"
              />
            </form>

            {/* Tombol Batal / Print */}
            <div className="flex justify-end mt-4 space-x-2">
              <button
                onClick={() => setIsModalKelahiranOpen(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Batal
              </button>

              <button
                // onClick inline: update DB dulu, lalu panggil handlePrintKelahiran
                onClick={async () => {
                  try {
                    // pastikan ada id_penduduk di formData
                    if (!formData?.id_penduduk) {
                      // kalau id belum ada, kembalikan error ringan atau beri pesan
                      console.error("Tidak ada id_penduduk di formData");
                      return;
                    }

                    // Update kolom orang tua di tabel data_penduduk
                    const { error } = await supabase
                      .from("data_penduduk")
                      .update({
                        nama_ibu: formData.nama_ibu || null,
                        tanggal_lahir_ibu: formData.tanggal_lahir_ibu || null,
                        nama_ayah: formData.nama_ayah || null,
                        tanggal_lahir_ayah: formData.tanggal_lahir_ayah || null,
                        pekerjaan_ayah: formData.pekerjaan_ayah || null,
                      })
                      .eq("id_penduduk", formData.id_penduduk);

                    if (error) {
                      console.error("Gagal update data orang tua:", error);
                      return;
                    }

                    // tutup modal
                    setIsModalKelahiranOpen(false);

                    // panggil lagi handlePrintKelahiran -> sekarang data sudah lengkap sehingga akan langsung print
                    await handlePrintKelahiran(formData.id_penduduk);
                  } catch (err) {
                    console.error("Error saat print dari modal:", err);
                  }
                }}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Print
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
          onClick={() => setIsPindahModalOpen(false)}
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
                  // pastikan field alasan terisi
                  if (!formData.alasan) {
                    alert("Silakan pilih alasan pindah terlebih dahulu");
                    return;
                  }

                  // siapkan data yang akan disimpan ke data_pindah
                  const updatedData = formDataList.map((item) => ({
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
                    tanggal_pindah: tanggalPindah,
                    alasan: formData.alasan, // dari dropdown
                    alasan_lain:
                      formData.alasan === "Lainnya" ? formData.alasan_lain : "", // isi jika "lainnya"
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
                  }));

                  console.log("Data dikirim ke data_pindah:", updatedData);

                  const { error: pindahError } = await supabase
                    .from("data_pindah")
                    .insert(updatedData);

                  if (pindahError) throw new Error(pindahError.message);

                  // Hapus data lama dari data_penduduk
                  const { error: deleteError } = await supabase
                    .from("data_penduduk")
                    .delete()
                    .in(
                      "id_penduduk",
                      formDataList.map((item) => item.id_penduduk)
                    );

                  if (deleteError) throw new Error(deleteError.message);

                  // Update state UI
                  setAllData(allData.filter((item) => !selectedIds.includes(item.id_penduduk)));
                  setSelectedIds([]);
                  setIsPindahModalOpen(false);
                  alert("Data berhasil dipindahkan!");
                } catch (err) {
                  console.error("Error pindah:", err);
                  alert("Gagal memindahkan data: " + err.message);
                }
              }}
              className="grid grid-cols-2 gap-4"
            >
            {/* Tanggal Pindah */}
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
              <label className="block text-sm font-medium text-gray-700">
                Alasan Pindah
              </label>
              <select
                value={formData.alasan}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData({
                    ...formData,
                    alasan: value,
                    // kalau bukan "Lainnya", kosongkan alasan_lain
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
                <div className="mt-2">
                  <input
                    type="text"
                    placeholder="Sebutkan alasan lain"
                    value={formData.alasan_lain}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        alasan_lain: e.target.value,
                      })
                    }
                    className="border rounded px-3 py-2 w-full"
                    required
                  />
                </div>
              )}
            </div>

            {/* Alamat Pindah */}
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700">Alamat Pindah</label>
              <input
                type="text"
                placeholder="Alamat Pindah"
                value={alamatPindah}
                onChange={(e) => setAlamatPindah(e.target.value)}
                className="border rounded px-3 py-2 w-full"
                required
              />
            </div>
            
              {/* RT */}
             <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700">RT Pindah</label>
              <input
                type="text"
                placeholder="RT Pindah"
                value={rtPindah}
                onChange={(e) => setRtPindah(e.target.value)}
                className="border rounded px-3 py-2 w-full"
                required
              />
            </div>

            {/* RW */}
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700">RW Pindah</label>
              <input
                type="text"
                placeholder="RW Pindah"
                value={rwPindah}
                onChange={(e) => setRwPindah(e.target.value)}
                className="border rounded px-3 py-2 w-full"
                required
              />
            </div>

            {/* Desa, Kecamatan, Kabupaten */}
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700">Desa Pindah</label>
              <input
                type="text"
                placeholder="Desa Pindah"
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
                placeholder="Kecamatan Pindah"
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
                placeholder="Kabupaten Pindah"
                value={kabupatenPindah}
                onChange={(e) => setKabupatenPindah(e.target.value)}
                className="border rounded px-3 py-2 w-full"
                required
              />
            </div>

            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700">Provinsi Pindah </label>
              <input
                type="text"
                placeholder="Provinsi Pindah"
                value={provinsiPindah}
                onChange={(e) => setprovinsiPindah(e.target.value)}
                className="border rounded px-3 py-2 w-full"
                required
              />
            </div>

            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700">Kode Pos Pindah </label>
              <input
                type="text"
                placeholder="Kode Pos Pindah"
                value={kodeposPindah}
                onChange={(e) => setkodeposPindah(e.target.value)}
                className="border rounded px-3 py-2 w-full"
                required
              />
            </div>

            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700">
                Jenis Kepindahan
              </label>
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
              <label className="block text-sm font-medium text-gray-700">
                Status KK Bagi Yang Tidak Pindah
              </label>
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
              <label className="block text-sm font-medium text-gray-700">
                Status KK Bagi Yang Pindah
              </label>
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

            {/* Tombol Aksi */}
            <div className="col-span-2 flex justify-end mt-6 space-x-2">
              <button
                type="button"
                onClick={() => setIsPindahModalOpen(false)}
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

export default Data_Penduduk;
