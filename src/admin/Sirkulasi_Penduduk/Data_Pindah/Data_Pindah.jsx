import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Printer, Edit, Trash2, FileText } from "lucide-react";
import supabase from "../../../supabaseClient";
import { jsPDF } from "jspdf";
import "@/../../../../jsPDF/fonts/arial-normal.js";
import "@/../../../../jsPDF/fonts/arialbd-bold.js";
import "@/../../../../jsPDF/fonts/ariali-italic.js";

function Data_Pindah() {
  const [allData, setAllData] = useState([]);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [penduduk, setPenduduk] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  // RW/RT filter states
  const [rwOptions, setRwOptions] = useState([]); // array of RW strings
  const [rtOptions, setRtOptions] = useState([]); // array of RT strings for selected RW
  const [selectedRw, setSelectedRw] = useState("");
  const [selectedRt, setSelectedRt] = useState("");
  const [rtMap, setRtMap] = useState({}); // { rwValue: [rt1, rt2, ...] }

  // Helper lowercase safe
  const safeLower = (v) => String(v || "").toLowerCase();

  // Location untuk ambil parameter
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true); 
  // Fetch data_pindah (now global, with optional filters via URL params)
  const fetchData = async () => {
    try {
      setIsLoading(true); // 👈 mulai loading
      const params = new URLSearchParams(location.search);
      const keyword = params.get("keyword")?.trim() || "";
      const filterRw = params.get("rw") || "";
      const filterRt = params.get("rt") || "";

      let query = supabase
        .from("data_pindah")
        .select("*")
        .order("id", { ascending: true });

      if (keyword) {
        query = query.or(`nik.ilike.*${keyword}*,nama.ilike.*${keyword}*`);
      }
      if (filterRw) query = query.eq("rw", filterRw);
      if (filterRt) query = query.eq("rt", filterRt);

      const { data, error } = await query;
      if (error) {
        console.error("Error fetching data_pindah:", error);
        setAllData([]);
      } else {
        setAllData(data || []);
        setCurrentPage(1);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      setAllData([]);
    } finally {
      setIsLoading(false); // 👈 selesai loading
    }
  };
  // Fetch users -> build RW options and RT map
  const fetchUsersForRwRt = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("rt,rw")
        .order("rw", { ascending: true })
        .order("rt", { ascending: true });

      if (error) throw error;

      const users = data || [];
      const rwSet = new Set();
      const rtByRw = {};

      users.forEach((u) => {
        const rw = String(u.rw ?? "").trim();
        const rt = String(u.rt ?? "").trim();
        if (!rw) return; // skip empty
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

      // Jika ada selectedRw, set rtOptions accordingly (keep selectedRt if exists)
      if (selectedRw) {
        setRtOptions(rtMapObj[selectedRw] || []);
      }
    } catch (error) {
      console.error("Gagal fetch users (rw/rt):", error);
    }
  };

  // Fetch penduduk for autocomplete
  const fetchPenduduk = async () => {
    const { data, error } = await supabase
      .from("data_penduduk")
      .select("nik,nama")
      .order("nama", { ascending: true });

    if (error) {
      console.error("Error fetching penduduk:", error);
    } else {
      setPenduduk(data || []);
    }
  };

  // Jalankan setiap kali halaman atau query berubah
  useEffect(() => {
    fetchData();
  }, [location.search]);

  // Jalankan sekali saat mount: fetch penduduk dan users
  useEffect(() => {
    fetchPenduduk();
    fetchUsersForRwRt();
    // pull initial rw/rt from URL (so the UI matches query params)
    const params = new URLSearchParams(location.search);
    const rw = params.get("rw") || "";
    const rt = params.get("rt") || "";
    setSelectedRw(rw);
    setSelectedRt(rt);
  }, []);

  // Update rtOptions when selectedRw changes (rtMap is already prepared)
  useEffect(() => {
    if (selectedRw) {
      setRtOptions(rtMap[selectedRw] || []);
    } else {
      setRtOptions([]);
    }
  }, [selectedRw, rtMap]);

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
    const { error } = await supabase.from("data_pindah").delete().eq("id", id);

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

      const { error: insertError } = await supabase.from("data_penduduk").insert([newData]);

      if (insertError) throw insertError;

      const { error: deleteError } = await supabase.from("data_pindah").delete().eq("id", item.id);

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

  // Toggle pilih semua baris (hanya untuk displayedData)
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

      if (selectedAction === "hapus") {
        await handleDeleteMany();
      } else if (selectedAction === "kembalikan") {
        await handleRestoreMany();
      }

      // Reset state setelah aksi berhasil
      setSelectedAction("");
      setIsMultiModalOpen(false);
    } catch (error) {
      alert("Terjadi kesalahan: " + error.message);
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

      const { error } = await supabase.from("data_pindah").delete().in("id", selectedIds);

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

  // Hapus banyak data sekaligus (restore)
  const handleRestoreMany = async () => {
    try {
      // Ambil semua data yang dipilih dari allData (bukan hanya displayedData) untuk keamanan
      const dataToRestore = allData.filter((item) => selectedIds.includes(item.id));

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
      const { error: insertError } = await supabase.from("data_penduduk").insert(restoreData);

      if (insertError) throw insertError;

      // Hapus data dari data_pindah
      const { error: deleteError } = await supabase.from("data_pindah").delete().in("id", selectedIds);

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
    if (!selectedAction) {
      alert("Pilih salah satu aksi terlebih dahulu!");
      return;
    }

    if (selectedAction === "hapus") {
      await handleHapus(selectedData.id);
    } else if (selectedAction === "kembalikan") {
      await handleKembalikan(selectedData);
    }

    setSelectedAction("");
    setIsDeleteModalOpen(false);
  };

  const openMultiActionModal = () => {
    if (selectedIds.length === 0) {
      alert("Pilih data yang ingin dihapus atau dikembalikan!");
      return;
    }
    setIsMultiModalOpen(true);
  };

  // Apply filters by updating URL params (fetchData will react to location.search)
  const applyFiltersToUrl = () => {
    const params = new URLSearchParams(location.search);

    if (selectedRw) params.set("rw", selectedRw);
    else params.delete("rw");

    if (selectedRt) params.set("rt", selectedRt);
    else params.delete("rt");

    // Keep other params like keyword if present
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

  const handlePrintPindah = async (id_pindah) => {
    try {
      // === Ambil data pindah utama (yang diklik) ===
      const { data: pUtama, error: errP } = await supabase
        .from("data_pindah")
        .select("*")
        .eq("id", id_pindah)
        .single();
      if (errP) throw errP;
      const p = pUtama; // singkatan
  
      // === Ambil semua anggota yang punya no_kk sama dari tabel data_pindah ===
      let anggotaPindah = [];
      if (p.no_kk) {
        const { data: anggotaData, error: errAng } = await supabase
          .from("data_pindah")
          .select("*")
          .eq("no_kk", p.no_kk)
          .order("id", { ascending: true });
        if (errAng) throw errAng;
        anggotaPindah = anggotaData || [];
      } else {
        // fallback: jika tidak ada no_kk, gunakan hanya data utama
        anggotaPindah = [p];
      }
  
      // === Ambil nama kepala keluarga dari data_penduduk jika tersedia ===
      let namaKepalaKeluarga = "-";
      if (p.no_kk) {
        const { data: kk, error: errKk } = await supabase
          .from("data_penduduk")
          .select("nama")
          .eq("no_kk", p.no_kk)
          .eq("status_keluarga", "Kepala Keluarga")
          .single();
        if (!errKk && kk?.nama) {
          namaKepalaKeluarga = kk.nama.toUpperCase();
        } else {
          // fallback: ambil dari anggotaPindah (jika ada)
          if (anggotaPindah.length > 0 && anggotaPindah[0].nama) {
            namaKepalaKeluarga = anggotaPindah[0].nama.toUpperCase();
          }
        }
      } else {
        if (anggotaPindah.length > 0 && anggotaPindah[0].nama) {
          namaKepalaKeluarga = anggotaPindah[0].nama.toUpperCase();
        }
      }
  
      // === Helper format tanggal ===
      const formatTanggal = (tglStr) => {
        if (!tglStr) return "-";
        const d = new Date(tglStr);
        if (isNaN(d)) return "-";
        return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
      };
  
      // === Nomor surat otomatis ===
      const currentYear = new Date().getFullYear();
      const { data: semuaRiwayat } = await supabase
        .from("riwayat_cetak_pindah")
        .select("id_riwayat")
        .gte("tanggal_cetak", `${currentYear}-01-01T00:00:00Z`)
        .lte("tanggal_cetak", `${currentYear}-12-31T23:59:59Z`);
      const noUrut = String((semuaRiwayat?.length || 0) + 1).padStart(3, "0");
      const bulanRomawi = ["I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII"][new Date().getMonth()];
      const nomorSurat = `No. 471.12/${noUrut}/PND/MT/${bulanRomawi}/${currentYear}-PEM`;
  
      // === Simpan riwayat cetak ===
      await supabase.from("riwayat_cetak_pindah").insert([{
        id: id_pindah,
        nomor_surat: nomorSurat,
        tanggal_cetak: new Date().toISOString(),
      }]);
  
      const shdkMap = {
        "KEPALA KELUARGA": "1 - KEPALA KELUARGA",
        "SUAMI": "2 - SUAMI",
        "ISTRI": "3 - ISTRI",
        "ANAK": "4 - ANAK",
        "ORANG TUA": "5 - ORANG TUA",
        "MERTUA": "6 - MERTUA",
        "CUCU": "7 - CUCU",
        "MENANTU": "8 - MENANTU",
        "PEMBANTU": "9 - PEMBANTU",
        "FAMILY LAIN": "10 - FAMILY LAIN",
      };
      
      // Urutan prioritas berdasarkan SHDK
      const shdkOrder = [
        "KEPALA KELUARGA",
        "SUAMI",
        "ISTRI",
        "ANAK",
        "ORANG TUA",
        "MERTUA",
        "CUCU",
        "MENANTU",
        "PEMBANTU",
        "FAMILY LAIN",
      ];
      
      // Buat array dan urutkan berdasarkan urutan SHDK di atas
      const dataAnggota = (anggotaPindah || [])
        .map((a) => {
          const status = (a.status_keluarga || "").toUpperCase().trim();
          return {
            nik: a.nik || "-",
            nama: (a.nama || "-").toUpperCase(),
            masa: a.masa_ktp || "",
            shdk: shdkMap[status] || "-",
            _statusSort: shdkOrder.indexOf(status) !== -1 ? shdkOrder.indexOf(status) : 99, // urutan fallback
          };
        })
        .sort((a, b) => a._statusSort - b._statusSort) // urut sesuai prioritas SHDK
        .map(({ _statusSort, ...rest }) => rest); // hapus properti sementara
      

      // === Mulai buat PDF ===
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const lineHeight = 4;
      const padX = 20;
  
      // Kotak F-1.03
      doc.setFontSize(8);
      doc.setDrawColor(0);
      doc.setLineWidth(0.3);
      doc.rect(180, 7, 20, 5);
      doc.text("F-1.03", 190, 10.8, { align: "center" });
  
      // Header
      let y = 20;
      doc.setFont("arialbd", "bold").setFontSize(7);
      doc.text("PEMERINTAH PROVINSI JAWA BARAT", padX, y); y+=lineHeight;
      doc.text("PEMERINTAH KABUPATEN BANDUNG", padX, y); y+=lineHeight;
      doc.text("KECAMATAN", padX, y); doc.text(":", 45, y);
      doc.text("9", 50, y); doc.text("MARGAHAYU", 62, y); y+=lineHeight;
      doc.text("DESA/KELURAHAN", padX, y); doc.text(":", 45, y);
      doc.text("2001", 50, y); doc.text("MARGAHAYU TENGAH", 62, y);
  
      // Judul
      y += lineHeight*2;
      doc.setFont("arialbd", "bold").setFontSize(11);
      doc.text("SURAT KETERANGAN PINDAH WNI", 105, y, { align: "center" }); y+=lineHeight;
      doc.setFontSize(8);
      doc.text(nomorSurat, 105, y, { align: "center" });
  
      // DATA DAERAH ASAL
      y += lineHeight*2;
      doc.setFont("arialbd", "bold").setFontSize(8);
      doc.text("DATA DAERAH ASAL", padX, y);
      doc.setFont("arial", "normal");
  
      const labelXAsal = padX, titikDuaXAsal = 57, isiXAsal = 63;
      y += lineHeight; doc.text("1. No. KK", labelXAsal, y); doc.text(":", titikDuaXAsal, y);
      doc.setFont("arialbd","bold"); doc.text(p.no_kk || "-", isiXAsal, y);
      doc.setFont("arial","normal"); y += lineHeight;
      doc.text("2. Nama Kepala Keluarga", labelXAsal, y); doc.text(":", titikDuaXAsal, y);
      doc.text(namaKepalaKeluarga || "-", isiXAsal, y); y += lineHeight;
      doc.text("3. Alamat", labelXAsal, y); doc.text(":", titikDuaXAsal, y);
      doc.setFont("arialbd","bold"); doc.text(p.alamat || "-", isiXAsal, y);
      doc.text("RT", isiXAsal + 64, y); doc.text(".", isiXAsal + 68, y); doc.text(p.rt || "-", isiXAsal + 70, y);
      doc.text("RW", isiXAsal + 78, y); doc.text(".", isiXAsal + 83, y); doc.text(p.rw || "-", isiXAsal + 85, y);
      doc.setFont("arial","normal"); y += lineHeight;
  
      // a-d
      const kiriLabelX = isiXAsal, kiriTitikDuaX = kiriLabelX + 25, kiriIsiX = kiriTitikDuaX + 3;
      const kananLabelX = kiriIsiX + 48, kananTitikDuaX = kananLabelX + 22, kananIsiX = kananTitikDuaX + 3;
      doc.text("a. Desa/Kelurahan", kiriLabelX, y); doc.text(":", kiriTitikDuaX, y); doc.text((p.desa || "Margahayu Tengah").toUpperCase(), kiriIsiX, y);
      doc.text("b. Kecamatan", kananLabelX, y); doc.text(":", kananTitikDuaX, y); doc.text((p.kecamatan || "Margahayu").toUpperCase(), kananIsiX, y); y += lineHeight;
      doc.text("c. Kabupaten", kiriLabelX, y); doc.text(":", kiriTitikDuaX, y); doc.text((p.kabupaten || "Bandung").toUpperCase(), kiriIsiX, y);
      doc.text("d. Provinsi", kananLabelX, y); doc.text(":", kananTitikDuaX, y); doc.text((p.provinsi || "Jawa Barat").toUpperCase(), kananIsiX, y); y += lineHeight;
      doc.text("Kode Pos", kiriLabelX, y); doc.text(":", kiriTitikDuaX - 12, y); doc.text(p.kode_pos || "-", kiriIsiX - 12, y);
  
      // DATA KEPINDAHAN
      y += lineHeight*2; doc.setFont("arialbd","bold"); doc.text("DATA KEPINDAHAN", padX, y);
      doc.setFont("arial","normal"); const labelXPindah = padX, titikDuaXPindah = 57, isiXPindah = 63;
  
      // 1. Alasan Pindah
      y += lineHeight; doc.text("1. Alasan Pindah", labelXPindah, y); doc.text(":", titikDuaXPindah, y);
      const alasanMapping = { pekerjaan: "1", pendidikan: "2", keamanan: "3", kesehatan: "4", perumahan: "5", keluarga: "6", lainnya: "7" };
      let alasanTeks = (p.alasan || "").toLowerCase().trim();
      let alasanAngka = alasanMapping[alasanTeks] || (p.alasan_lain ? "7" : "-");
      const kotakX = isiXPindah, kotakY = y - 3.5, kotakW = 10, kotakH = 5;
      doc.rect(kotakX, kotakY, kotakW, kotakH);
      doc.setFont("arialbd","bold"); doc.text(String(alasanAngka), kotakX + 4, y); doc.setFont("arial","normal");
      const alasanListX = kotakX + 15, alasanListY = y;
      doc.text("1. Pekerjaan", alasanListX, alasanListY); doc.text("2. Pendidikan", alasanListX, alasanListY + lineHeight * 0.9);
      doc.text("3. Keamanan", alasanListX + 25, alasanListY); doc.text("4. Kesehatan", alasanListX + 25, alasanListY + lineHeight * 0.9);
      doc.text("5. Perumahan", alasanListX + 50, alasanListY); doc.text("6. Keluarga", alasanListX + 50, alasanListY + lineHeight * 0.9);
      doc.text("7. Lainnya (sebutkan)", alasanListX + 75, alasanListY);
      if (alasanAngka === "7") {
        doc.text(p.alasan_lain?.toUpperCase() || "..............................", alasanListX + 78, alasanListY + lineHeight * 0.8);
      } else {
        doc.text("..............................", alasanListX + 78, alasanListY + lineHeight * 0.8);
      }
  
      // 2. Alamat Tujuan
      y += lineHeight*2.5; doc.text("2. Alamat Tujuan", labelXPindah, y); doc.text(":", titikDuaXPindah, y);
      doc.setFont("arialbd","bold"); doc.text(p.alamat_pindah || "-", isiXPindah, y);
      doc.text("RT", isiXPindah + 64, y); doc.text(".", isiXPindah + 68, y); doc.text(p.rt_pindah || "-", isiXPindah + 70, y);
      doc.text("RW", isiXPindah + 78, y); doc.text(".", isiXPindah + 83, y); doc.text(p.rw_pindah || "-", isiXPindah + 85, y);
      doc.setFont("arial","normal");
  
      // a-d tujuan
      const kiriLabelX2 = isiXPindah, kiriTitikDuaX2 = kiriLabelX2 + 25, kiriIsiX2 = kiriTitikDuaX2 + 3;
      const kananLabelX2 = kiriIsiX2 + 48, kananTitikDuaX2 = kananLabelX2 + 22, kananIsiX2 = kananTitikDuaX2 + 3;
      y += lineHeight; doc.text("a. Desa/Kelurahan", kiriLabelX2, y); doc.text(":", kiriTitikDuaX2, y); doc.text((p.desa_pindah || "-").toUpperCase(), kiriIsiX2, y);
      doc.text("b. Kecamatan", kananLabelX2, y); doc.text(":", kananTitikDuaX2, y); doc.text((p.kecamatan_pindah || "-").toUpperCase(), kananIsiX2, y); y += lineHeight;
      doc.text("c. Kabupaten", kiriLabelX2, y); doc.text(":", kiriTitikDuaX2, y); doc.text((p.kabupaten_pindah || "-").toUpperCase(), kiriIsiX2, y);
      doc.text("d. Provinsi", kananLabelX2, y); doc.text(":", kananTitikDuaX2, y); doc.text((p.provinsi_pindah || "-").toUpperCase(), kananIsiX2, y); y += lineHeight;
      doc.text("Kode Pos", kiriLabelX2, y); doc.text(":", kiriTitikDuaX2 - 12, y); doc.text(p.kodepos_pindah || "-", kiriIsiX2 - 12, y);
  
      // 3. Jenis Kepindahan
      y += lineHeight*2; const titikDuaXJenis = 68, isiXJenis = 70;
      doc.text("3. Jenis Kepindahan", labelXPindah, y); doc.text(":", titikDuaXJenis, y);
      const jenisMapping = { "kepala keluarga":"1", "kepala & sebagian anggota":"3", "kepala & seluruh anggota":"2", "anggota keluarga":"4" };
      let jenisTeks = (p.jenis_pindah || "").toLowerCase().trim();
      let jenisAngka = jenisMapping[jenisTeks] || "-";
      doc.rect(isiXJenis, y - 3.5, 10, 5); doc.setFont("arialbd","bold"); doc.text(jenisAngka, isiXJenis + 4, y); doc.setFont("arial","normal");
      const jenisListX1 = isiXJenis + 15, jenisListX2 = jenisListX1 + 50;
      doc.text("1. Kepala Keluarga", jenisListX1, y); doc.text("3. Kepala & Sebagian Anggota", jenisListX1, y + lineHeight * 0.9);
      doc.text("2. Kepala & Seluruh Anggota", jenisListX2, y); doc.text("4. Anggota Keluarga", jenisListX2, y + lineHeight * 0.9);
  
      // 4 & 5: Status KK
      y += lineHeight*2; doc.text("4. Status KK bagi yang tidak pindah", labelXPindah, y); doc.text(":", 68, y);
      const statusTidakPindahMapping = { tetap: "1", "kk baru": "2" };
      let statusTidakPindahTeks = (p.statuskk_tidakpindah || "").toLowerCase().trim();
      let statusTidakPindahAngka = statusTidakPindahMapping[statusTidakPindahTeks] || "-";
      doc.rect(70, y - 3.5, 10, 5); doc.setFont("arialbd","bold"); doc.text(statusTidakPindahAngka, 74, y); doc.setFont("arial","normal");
      doc.text("1. Tetap", 85, y); doc.text("2. KK Baru", 135, y);
  
      y += lineHeight*2; doc.text("5. Status KK bagi yang pindah", labelXPindah, y); doc.text(":", 68, y);
      const statusPindahMapping = { "numpang kk": "1", "membuat kk baru": "2" };
      let statusPindahTeks = (p.statuskk_pindah || "").toLowerCase().trim();
      let statusPindahAngka = statusPindahMapping[statusPindahTeks] || "-";
      doc.rect(70, y - 3.5, 10, 5); doc.setFont("arialbd","bold"); doc.text(statusPindahAngka, 74, y); doc.setFont("arial","normal");
      doc.text("1. Numpang KK", 85, y); doc.text("2. Membuat KK Baru", 135, y);
  
      // 6. Keluarga yang pindah - TABEL (pakai dataAnggota)
      y += lineHeight*2;
      doc.text("6. Keluarga yang Pindah :", padX, y);
  
// === SETUP TABEL ===
const startX = padX, startY = y + 3;
const rowHeightHeader = 7;   // lebih kecil
const rowHeightData = 5.5;   // lebih kecil
const rowGap = 0.5, colGap = 1;
const borderColor = [150, 150, 150], headerFill = [210, 210, 210];
const colNo = 10, colNik = 30, colNama = 55, colMasa = 30, colShdk = 40;

// === HEADER TABEL ===
doc.setFont("arialbd", "bold");
doc.setDrawColor(...borderColor);
doc.setLineWidth(0.2);

let headerX = startX;
const textYOffsetHeader = 3.8;

doc.setFillColor(...headerFill);
doc.rect(headerX, startY, colNo, rowHeightHeader, "FD");
doc.text("No", headerX + colNo / 2, startY + textYOffsetHeader, { align: "center" });
headerX += colNo + colGap;

doc.setFillColor(...headerFill);
doc.rect(headerX, startY, colNik, rowHeightHeader, "FD");
doc.text("NIK", headerX + colNik / 2, startY + textYOffsetHeader, { align: "center" });
headerX += colNik + colGap;

doc.setFillColor(...headerFill);
doc.rect(headerX, startY, colNama, rowHeightHeader, "FD");
doc.text("NAMA LENGKAP", headerX + colNama / 2, startY + textYOffsetHeader, { align: "center" });
headerX += colNama + colGap;

doc.setFillColor(...headerFill);
doc.rect(headerX, startY, colMasa, rowHeightHeader, "FD");
doc.text(["MASA BERLAKU", "KTP  S/D"], headerX + colMasa / 2, startY + 2.8, { align: "center" });
headerX += colMasa + colGap;

doc.setFillColor(...headerFill);
doc.rect(headerX, startY, colShdk, rowHeightHeader, "FD");
doc.text("SHDK *)", headerX + colShdk / 2, startY + textYOffsetHeader, { align: "center" });

// === DATA BARIS ===
doc.setFont("arial", "normal");

const tableYStart = startY + rowHeightHeader + rowGap; // ⬅️ ganti dari currY
const textYOffsetData = 3.4;

dataAnggota.forEach((item, index) => {
  let dataX = startX;
  const tableRowY = tableYStart + index * (rowHeightData + rowGap);

  doc.setDrawColor(...borderColor);

  // Kolom No
  doc.rect(dataX, tableRowY, colNo, rowHeightData);
  doc.text(String(index + 1), dataX + colNo / 2, tableRowY + textYOffsetData, { align: "center" });
  dataX += colNo + colGap;

  // Kolom NIK
  doc.rect(dataX, tableRowY, colNik, rowHeightData);
  doc.text(item.nik || "-", dataX + colNik / 2, tableRowY + textYOffsetData, { align: "center" });
  dataX += colNik + colGap;

  // Kolom Nama
  doc.rect(dataX, tableRowY, colNama, rowHeightData);
  doc.text(item.nama || "-", dataX + colNama / 2, tableRowY + textYOffsetData, { align: "center" });
  dataX += colNama + colGap;

  // Kolom Masa Berlaku (kosong kalau tidak ada)
  doc.rect(dataX, tableRowY, colMasa, rowHeightData);
  if (item.masa) doc.text(item.masa, dataX + colMasa / 2, tableRowY + textYOffsetData, { align: "center" });
  dataX += colMasa + colGap;

  // Kolom SHDK
  doc.rect(dataX, tableRowY, colShdk, rowHeightData);
  doc.text(item.shdk || "-", dataX + colShdk / 2, tableRowY + textYOffsetData, { align: "center" });
});

     // === Bagian Tanda Tangan (versi posisi akhir sejajar seperti di gambar) ===
const today = new Date();
const tanggalCetak = `${today.getDate()} ${today.toLocaleString("id-ID", {
  month: "long",
})} ${today.getFullYear()}`;

// Posisi awal tanda tangan
y += 25 + lineHeight * 8;

// === Koordinat dasar ===
const leftCenterX = 55;    // blok kiri (Pemohon)
const rightCenterX = 155;  // blok kanan (Kepala Desa)
const centerX = 105;       // tengah bawah (Mengetahui)

// === Kolom kanan atas (Bandung, dst.) ===
doc.text(`Bandung, ${tanggalCetak}`, rightCenterX, y, { align: "center" });
y += lineHeight;
doc.text("Dikeluarkan oleh :", rightCenterX, y, { align: "center" });
y += lineHeight;
doc.text("a.n. Kepala Dinas Kependudukan dan", rightCenterX, y, { align: "center" });
y += lineHeight;
doc.text("Pencatatan Sipil", rightCenterX, y, { align: "center" });
y += lineHeight;
doc.text("Kepala Desa MARGAHAYU TENGAH", rightCenterX, y, { align: "center" });

// === Pemohon (sejajar dengan 'Pencatatan Sipil') ===
let yPemohon = y - lineHeight * 0.5; // sejajar tepat dengan "Pencatatan Sipil"
doc.text("Pemohon,", leftCenterX, yPemohon, { align: "center" });

// === Nama Pemohon sejajar dengan Drs. ASEP ===
let yNama = y + 25;
doc.setFont("arialbd", "bold");
doc.text((p.nama || "-").toUpperCase(), leftCenterX, yNama, { align: "center" });
doc.text("Drs. ASEP ZAENAL MAHMUD", rightCenterX, yNama, { align: "center" });
doc.setFont("Arial", "normal");

// === Mengetahui: Camat (lebih ke bawah, tidak sejajar tanda tangan) ===
let yCamat = yNama + 8;
doc.text("Mengetahui :", centerX, yCamat, { align: "center" });
yCamat += lineHeight;
doc.text("Camat MARGAHAYU", centerX, yCamat, { align: "center" });
yCamat += 20;
doc.text("NIP :", centerX, yCamat, { align: "center" });

  
      // Simpan / download PDF
      doc.save(`Surat_Keterangan_Pindah_WNI_${(p.no_kk || "").replace(/[^a-z0-9]/gi, "_")}.pdf`);
    } catch (err) {
      console.error("Gagal membuat surat pindah:", err);
    }
  };
  
  
  

  return (
    <div className="p-6 bg-white rounded-lg shadow relative">
      {/* Header */}
      <div className="flex items-center bg-green-500 text-white px-4 py-3 rounded-t-lg">
        <FileText className="w-5 h-5 mr-2" />
        <h1 className="text-lg font-semibold">Data Pindah</h1>
      </div>

      {/* Filters: Show entries & RW/RT filter & Tambah Data */}
      <div className="flex justify-between items-center mt-4 mb-4">
        {/* Show entries + RW/RT filter */}
        <div className="flex items-center space-x-4">
          {/* Show entries */}
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

          {/* RW & RT Filter */}
          <div className="flex items-center space-x-2">
            <select
              value={selectedRw}
              onChange={(e) => {
                setSelectedRw(e.target.value);
                setSelectedRt("");
              }}
              className="border rounded px-2 py-1"
            >
              <option value="">Semua RW</option>
              {rwOptions.map((rw) => (
                <option key={rw} value={rw}>
                  {rw}
                </option>
              ))}
            </select>

            <select
              value={selectedRt}
              onChange={(e) => setSelectedRt(e.target.value)}
              className="border rounded px-2 py-1"
              disabled={!selectedRw}
            >
              <option value="">Semua RT</option>
              {rtOptions.map((rt) => (
                <option key={rt} value={rt}>
                  {rt}
                </option>
              ))}
            </select>

            <button
              onClick={applyFiltersToUrl}
              className="px-3 py-1 bg-blue-600 text-white rounded"
            >
              Filter
            </button>

            <button
              onClick={clearFilters}
              className="px-3 py-1 bg-gray-300 rounded"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Hapus / Kembalikan banyak */}
        <div>
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
        <th className="px-4 py-2 border">NO KK</th>
        <th className="px-4 py-2 border">NIK</th>
        <th className="px-4 py-2 border">Nama</th>
        <th className="px-4 py-2 border">Tanggal Pindah</th>
        <th className="px-4 py-2 border">Alamat Pindah</th>
        <th className="px-4 py-2 border">Alasan</th>
        <th className="px-4 py-2 border text-center">Print</th>
        <th className="px-4 py-2 border text-center">Aksi</th>
      </tr>
    </thead>
    <tbody>
      {isLoading ? (
        <tr>
          <td colSpan={10} className="text-center py-4 text-gray-500">
            Memuat data...
          </td>
        </tr>
      ) : displayedData.length === 0 ? (
        <tr>
          <td colSpan={10} className="text-center py-4 text-gray-500">
            Tidak ada data
          </td>
        </tr>
      ) : (
        // Grup data berdasarkan no_kk
        Object.entries(
          displayedData
            .sort((a, b) => b.id - a.id)
            .reduce((acc, item) => {
              if (!acc[item.no_kk]) acc[item.no_kk] = [];
              acc[item.no_kk].push(item);
              return acc;
            }, {})
        ).map(([no_kk, items]) =>
          items.map((item, index) => (
            <tr key={item.id} className="hover:bg-gray-50">
              <td className="px-4 py-2 border text-center">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(item.id)}
                  onChange={() => toggleSelect(item.id)}
                />
              </td>

              <td className="px-4 py-2 border text-center">
                {(currentPage - 1) * entriesPerPage + displayedData.indexOf(item) + 1}
              </td>

              {/* Gunakan rowspan hanya di baris pertama per KK */}
              {index === 0 && (
                <td className="px-4 py-2 border text-center" rowSpan={items.length}>
                  {item.no_kk}
                </td>
              )}

              <td className="px-4 py-2 border">{item.nik}</td>
              <td className="px-4 py-2 border">{item.nama}</td>
              <td className="px-4 py-2 border">{item.tanggal_pindah}</td>
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
                  .filter(Boolean)
                  .join(", ")}
              </td>
              <td className="px-4 py-2 border">
                {item.alasan && item.alasan.toLowerCase().includes("lainnya")
                  ? (item.alasan_lain && item.alasan_lain.trim() !== "" ? item.alasan_lain : "Lainnya")
                  : item.alasan}
              </td>

              {/* Kolom PRINT (hanya tampil di baris pertama KK) */}
              {index === 0 && (
                <td className="px-4 py-2 border text-center" rowSpan={items.length}>
                  <button
                    onClick={() => handlePrintPindah(item.id)}
                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-full"
                    title={`Print data KK ${item.id}`}
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                </td>
              )}

              <td className="px-4 py-2 border text-center">
                <div className="flex justify-center space-x-2">
                  <Link
                    to={`/admin/sirkulasi_penduduk/data_pindah/edit_pindah/${item.id}`}
                    className="p-2 text-yellow-600 hover:bg-yellow-100 rounded-full"
                  >
                    <Edit className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => openDeleteModal(item)}
                    className="p-2 text-red-600 hover:bg-red-100 rounded-full"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))
        )
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
          <button onClick={handlePrevious} disabled={currentPage === 1} className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50">
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
            <button key={num} onClick={() => setCurrentPage(num)} className={`px-3 py-1 rounded ${currentPage === num ? "bg-blue-500 text-white" : "bg-gray-200"}`}>
              {num}
            </button>
          ))}
          <button onClick={handleNext} disabled={currentPage === totalPages || totalPages === 0} className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50">
            Next
          </button>
        </div>
      </div>

      {isDeleteModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          {/* Background hitam */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsDeleteModalOpen(false)} />

          {/* Konten modal */}
          <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md p-6 z-10">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Pilih Aksi</h2>
            <p className="text-gray-600 mb-4">Apa yang ingin dilakukan dengan data <b>{selectedData?.nama}</b>?</p>

            {/* Pilihan Radio */}
            <div className="space-y-3 mb-6">
              <label className="flex items-center gap-3">
                <input type="radio" name="aksi" value="hapus" checked={selectedAction === "hapus"} onChange={(e) => setSelectedAction(e.target.value)} className="w-4 h-4" />
                <span className="text-red-600 font-medium">Hapus Permanen</span>
              </label>

              <label className="flex items-center gap-3">
                <input type="radio" name="aksi" value="kembalikan" checked={selectedAction === "kembalikan"} onChange={(e) => setSelectedAction(e.target.value)} className="w-4 h-4" />
                <span className="text-green-600 font-medium">Kembalikan ke Data Penduduk</span>
              </label>
            </div>

            {/* Tombol aksi */}
            <div className="flex justify-end gap-3">
              <button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400">Batal</button>
              <button onClick={handleConfirm} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Konfirmasi</button>
            </div>
          </div>
        </div>
      )}

      {isMultiModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          {/* Background hitam */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsMultiModalOpen(false)} />

          {/* Konten modal */}
          <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md p-6 z-10">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Pilih Aksi</h2>
            <p className="text-gray-600 mb-4">Anda memilih <b>{selectedIds.length}</b> data. Apa yang ingin dilakukan?</p>

            {/* Radio Pilihan */}
            <div className="space-y-3 mb-6">
              <label className="flex items-center gap-3">
                <input type="radio" name="multiAction" value="hapus" checked={selectedAction === "hapus"} onChange={(e) => setSelectedAction(e.target.value)} className="w-4 h-4" />
                <span className="text-red-600 font-medium">Hapus Permanen</span>
              </label>

              <label className="flex items-center gap-3">
                <input type="radio" name="multiAction" value="kembalikan" checked={selectedAction === "kembalikan"} onChange={(e) => setSelectedAction(e.target.value)} className="w-4 h-4" />
                <span className="text-green-600 font-medium">Kembalikan ke Data Penduduk</span>
              </label>
            </div>

            {/* Tombol Aksi */}
            <div className="flex justify-end gap-3">
              <button onClick={() => setIsMultiModalOpen(false)} className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400">Batal</button>
              <button onClick={handleMultiConfirm} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Konfirmasi</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default Data_Pindah;
