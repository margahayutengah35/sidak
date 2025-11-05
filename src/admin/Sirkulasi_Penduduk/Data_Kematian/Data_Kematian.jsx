import React, { useState, useEffect, useRef } from "react";
import { useLocation, Link } from "react-router-dom";
import { Printer, Edit, Trash2, FileText, UserPlus } from "lucide-react";
import supabase from "../supabaseClient";
import jsPDF from "jspdf";
import "@/../../../jsPDF/fonts/arial-normal.js";
import "@/../../../jsPDF/fonts/arialbd-bold.js";

function Data_Kematian() {
  const [allData, setAllData] = useState([]);
  const [entriesPerPage, setEntriesPerPage] = useState(500);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isMultiModalOpen, setIsMultiModalOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState("");
  const [loading, setLoading] = useState(false);

  // Modal tambah
  const [isModalOpen, setIsModalOpen] = useState(false);

  const location = useLocation();
  const pendudukDropdownRef = useRef(null);

  const userRt = localStorage.getItem("userRt") || "";
  const userRw = localStorage.getItem("userRw") || "";

  // opsi RT/RW dari tabel users
  const [rwOptions, setRwOptions] = useState([]);
  const [rtOptions, setRtOptions] = useState([]);
  const [usersRtRw, setUsersRtRw] = useState([]); // array of {rt, rw}

  // filter aktif yang dipakai saat fetch (hanya berubah kalau user klik "Filter")
  const [filterRw, setFilterRw] = useState("");
  const [filterRt, setFilterRt] = useState("");

  // pending filter (dipakai di select — tidak langsung memicu fetch)
  const [pendingRw, setPendingRw] = useState(filterRw);
  const [pendingRt, setPendingRt] = useState(filterRt);

  // initial form
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
    rt: userRt || "", // default from localStorage but editable
    rw: userRw || "", // default from localStorage but editable
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

  // -------------------------
  // Ambil daftar RT/RW dari tabel users
  // -------------------------
  useEffect(() => {
    let cancelled = false;
    const fetchUsersRtRw = async () => {
      try {
        const { data, error } = await supabase.from("users").select("rt, rw");
        if (error) {
          console.error("Gagal fetch users rt/rw:", error);
          return;
        }
        if (cancelled) return;

        const filtered = (data || []).map((r) => ({
          rt: r.rt || "",
          rw: r.rw || "",
        })).filter(x => x.rt !== "" || x.rw !== "");

        setUsersRtRw(filtered);

        const uniqueRWs = Array.from(new Set(filtered.map((u) => u.rw).filter(Boolean))).sort();
        setRwOptions(uniqueRWs);

        // initial RT options: if formData.rw exists, show RTs for that RW; else all unique RTs
        if (formData.rw) {
          const rtsForRw = Array.from(new Set(filtered.filter(u => u.rw === formData.rw).map(u => u.rt).filter(Boolean))).sort();
          setRtOptions(rtsForRw);
        } else {
          const uniqueRTs = Array.from(new Set(filtered.map((u) => u.rt).filter(Boolean))).sort();
          setRtOptions(uniqueRTs);
        }
      } catch (err) {
        console.error("Unexpected fetch users rt/rw error:", err);
      }
    };

    fetchUsersRtRw();
    return () => {
      cancelled = true;
    };
    // we intentionally do not include formData.rw in deps here to only fetch once; RT options will be updated in separate effect
  }, []);

  // update RT options whenever selected RW changes or usersRtRw changes (untuk modal form)
  useEffect(() => {
    const filtered = usersRtRw;
    if (!filtered || filtered.length === 0) {
      setRtOptions([]);
      return;
    }

    if (formData.rw) {
      const rtsForRw = Array.from(new Set(filtered.filter(u => u.rw === formData.rw).map(u => u.rt).filter(Boolean))).sort();
      setRtOptions(rtsForRw);
      // jika RT saat ini tidak ada lagi di opsi baru, kosongkan RT supaya user memilih ulang
      if (formData.rt && !rtsForRw.includes(formData.rt)) {
        setFormData((prev) => ({ ...prev, rt: "" }));
      }
    } else {
      const uniqueRTs = Array.from(new Set(filtered.map((u) => u.rt).filter(Boolean))).sort();
      setRtOptions(uniqueRTs);
    }
  }, [formData.rw, usersRtRw]);

  // computed RT options untuk filter aktif (dipakai saat filter sudah diterapkan)
  const filterRtOptions = React.useMemo(() => {
    const filtered = usersRtRw || [];
    if (filterRw) {
      return Array.from(new Set(filtered.filter(u => u.rw === filterRw).map(u => u.rt).filter(Boolean))).sort();
    }
    return Array.from(new Set(filtered.map(u => u.rt).filter(Boolean))).sort();
  }, [filterRw, usersRtRw]);

  // computed RT options untuk pending selection (dipakai di dropdown sebelum klik Filter)
  const pendingRtOptions = React.useMemo(() => {
    const filtered = usersRtRw || [];
    if (pendingRw) {
      return Array.from(new Set(filtered.filter(u => u.rw === pendingRw).map(u => u.rt).filter(Boolean))).sort();
    }
    return Array.from(new Set(filtered.map(u => u.rt).filter(Boolean))).sort();
  }, [pendingRw, usersRtRw]);

  // -------------------------
  // Fetch utama data_kematian (AMBIL SEMUA DATA) - sekarang mendukung filter RW/RT
  // -------------------------
  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams(location.search);
        const keyword = (params.get("keyword") || "").trim();

        let results = [];

        // build query step by step so we can add filters RW/RT
        let query = supabase.from("data_kematian").select("*").order("id", { ascending: true });

        if (keyword) {
          const orClause = `nik.ilike.%${keyword}%,no_kk.ilike.%${keyword}%,nama.ilike.%${keyword}%`;
          query = query.or(orClause);
        }

        if (filterRw) query = query.eq("rw", filterRw);
        if (filterRt) query = query.eq("rt", filterRt);

        const { data, error } = await query;

        if (error) {
          console.error("Gagal fetch (search/filter):", error);
          results = [];
        } else {
          results = data || [];
        }

        if (!cancelled) {
          setAllData(results);
          setCurrentPage(1);
        }
      } catch (err) {
        console.error("Unexpected error:", err);
        if (!cancelled) setAllData([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [location.search, filterRw, filterRt]);

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

  // when active filterRw changes, if current active filterRt is not valid for selected RW, clear filterRt
  useEffect(() => {
    if (filterRt && !filterRtOptions.includes(filterRt)) {
      setFilterRt("");
    }
    setCurrentPage(1);
  }, [filterRw, filterRtOptions]);

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

  // Hapus banyak data kematian sekaligus
  const handleDeleteMany = async () => {
    if (selectedIds.length === 0) return alert("Pilih data yang ingin dihapus!");
    if (!window.confirm(`Yakin ingin menghapus ${selectedIds.length} data terpilih?`)) return;

    const { error } = await supabase.from("data_kematian").delete().in("id", selectedIds);
    if (error) return alert("Gagal menghapus data: " + error.message);
    setAllData((prev) => prev.filter((r) => !selectedIds.includes(r.id)));
    setSelectedIds([]);
    setSelectAll(false);
  };

  // Kembalikan data ke data_penduduk
  const handleKembalikan = async (data) => {
    try {
      const mapped = {
        no_kk: data.no_kk || "-",
        nik: data.nik,
        nama: data.nama,
        tempat_lahir: data.tempat_lahir || null,
        tanggal_lahir: data.tanggal_lahir || null,
        jk: data.jk || null,
        agama: data.agama || null,
        status_perkawinan: data.status_perkawinan || null,
        pendidikan: data.pendidikan || null,
        pekerjaan: data.pekerjaan || null,
        alamat: data.alamat || null,
        rt: data.rt || null,
        rw: data.rw || null,
        status_keluarga: data.status_keluarga || null,
        nik_ayah: data.nik_ayah || null,
        nama_ayah: data.nama_ayah || null,
        nik_ibu: data.nik_ibu || null,
        nama_ibu: data.nama_ibu || null,
        desa: data.desa || "Margahayu Tengah",
        kecamatan: data.kecamatan || "Margahayu",
        kabupaten: data.kabupaten || "Bandung",
      };

      const { error: insertError } = await supabase.from("data_penduduk").insert([mapped]);
      if (insertError) throw insertError;

      const { error: deleteError } = await supabase.from("data_kematian").delete().eq("id", data.id);
      if (deleteError) throw deleteError;

      setAllData((prev) => prev.filter((r) => r.id !== data.id));
      alert("Data berhasil dikembalikan!");
    } catch (error) {
      alert("Gagal mengembalikan data: " + (error.message || JSON.stringify(error)));
    }
  };

  // Modal multi-konfirmasi
  const handleMultiConfirm = async () => {
    if (!selectedAction) return alert("Pilih aksi terlebih dahulu!");

    if (selectedAction === "hapus") {
      await handleDeleteMany();
    } else if (selectedAction === "kembalikan") {
      for (let id of selectedIds) {
        const item = allData.find((x) => x.id === id);
        if (item) await handleKembalikan(item);
      }
    }

    setSelectedIds([]);
    setSelectedAction("");
    setIsMultiModalOpen(false);
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

      // pastikan rt/rw yang disimpan sesuai formData (bukan readonly)
      payload.rt = payload.rt || null;
      payload.rw = payload.rw || null;

      const { data, error } = await supabase.from("data_kematian").insert([payload]).select();
      if (error) throw error;

      if (data && data[0]) {
        setAllData((prev) => [...prev, data[0]]);
      }

      alert("Data kematian berhasil disimpan!");
      setIsModalOpen(false);

      // reset
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

  const handlePrintKematian = async (id_kematian) => {
    try {
      // === Ambil data kematian ===
      const { data: p, error } = await supabase
        .from("data_kematian")
        .select("*")
        .eq("id", id_kematian)
        .single();
      if (error) throw error;
  
      // === Format tanggal helper ===
      const formatTanggal = (tglStr) => {
        if (!tglStr) return "-";
        const d = new Date(tglStr);
        if (isNaN(d)) return "-";
        const hari = String(d.getDate()).padStart(2, "0");
        const bulan = String(d.getMonth() + 1).padStart(2, "0");
        const tahun = d.getFullYear();
        return `${hari}/${bulan}/${tahun}`;
      };
  
      // === Format pukul (jam:menit) tanpa detik ===
      const formatPukul = (waktu) => {
        if (!waktu) return "-";
        let clean = waktu.trim().replace(".", ":");
        const parts = clean.split(":");
        if (parts.length >= 2) {
          const jam = parts[0].padStart(2, "0");
          const menit = parts[1].padStart(2, "0");
          return `${jam}:${menit}`;
        }
        return clean;
      };
  
      // === Siapkan nomor surat ===
      const currentYear = new Date().getFullYear();
      const startOfYear = `${currentYear}-01-01T00:00:00Z`;
      const endOfYear = `${currentYear}-12-31T23:59:59Z`;
  
      const { data: semuaRiwayat } = await supabase
        .from("riwayat_cetak_kematian")
        .select("id_riwayat")
        .gte("tanggal_cetak", startOfYear)
        .lte("tanggal_cetak", endOfYear);
  
      const noUrut = String((semuaRiwayat?.length || 0) + 1).padStart(3, "0");
      const bulanRomawi = [
        "I", "II", "III", "IV", "V", "VI",
        "VII", "VIII", "IX", "X", "XI", "XII",
      ][new Date().getMonth()];
  
      const nomorSurat = `No. 471.12/${noUrut}/K/MT/${bulanRomawi}/${currentYear}-PEM`;
  
      // === Simpan riwayat cetak ===
      await supabase.from("riwayat_cetak_kematian").insert([
        {
          id_kematian,
          nomor_surat: nomorSurat,
          tanggal_cetak: new Date().toISOString(),
        },
      ]);
  
      // === Mulai buat PDF ===
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  
      const marginLeft = 15;
      const kolomLebar = 80;
      const tinggiSurat = 190;
      const jarakKolom = 13;
      const lineHeight = 6;
  
      const kolom = [
        { x: marginLeft, label: "Untuk Keluarga" },
        { x: marginLeft + kolomLebar + jarakKolom, label: "Arsip Desa/Kelurahan" },
        { x: marginLeft + (kolomLebar + jarakKolom) * 2, label: "Arsip Kecamatan" },
      ];
  
      const today = new Date();
      const tanggalCetak = `${today.getDate()} ${today.toLocaleString("id-ID", {
        month: "long",
      })} ${today.getFullYear()}`;
  
      // === Fungsi gambar tiap surat ===
      const drawSurat = (x, label) => {
        let y = 8;
        const centerX = x + kolomLebar / 2;
        const padX = 6;
        const labelWidth = 25;
        const titik2XOffset = 1.5;
  
        // Label pojok kanan atas
        doc.setFont("arial", "normal");
        doc.setFontSize(9);
        doc.text(label, x + kolomLebar - 2, y, { align: "right" });
  
        // Kotak luar
        doc.setLineWidth(0.4);
        doc.rect(x, y + 3, kolomLebar, tinggiSurat);
  
        y += 12;
        doc.setFontSize(14);
        doc.text("SURAT KEMATIAN", centerX, y, { align: "center" });
  
        y += lineHeight;
        doc.setFontSize(9);
        doc.text(nomorSurat, centerX, y, { align: "center" });
  
        y += lineHeight * 1.4;
        doc.setFont("arial", "normal");
  
        doc.text("      Yang    bertanda    tangan    dibawah   ini,", x + padX, y);
        y += lineHeight;
        doc.text("menerangkan bahwa pada :", x + padX, y);
        y += lineHeight * 0.3;
  
        // Detail waktu kematian
        const label2X = x + padX;
        const titik2X = label2X + labelWidth - titik2XOffset;
        const isiX = titik2X + 3;
  
        const detailKematian = [
          ["Hari", (p.hari_kematian || "-").toUpperCase()],
          ["Tanggal", formatTanggal(p.tanggal_kematian)],
          ["Pukul", formatPukul(p.pukul_kematian)],
          ["Tempat", p.tempat_kematian || "-"],
        ];
  
        detailKematian.forEach(([label, val]) => {
          y += lineHeight;
          doc.text(label, label2X, y);
          doc.text(":", titik2X, y);
          doc.text(val, isiX, y);
        });
  
        y += lineHeight * 1.3;
        doc.setFont("arialbd", "bold");
        doc.text("Telah Meninggal Dunia yang bernama :", centerX, y, { align: "center" });
  
        y += lineHeight * 1;
        doc.setFontSize(11);
        doc.text(`== ${(p.nama || "-").toUpperCase()} ==`, centerX, y, { align: "center" });
  
        y += lineHeight * 0.3;
        doc.setFont("arial", "normal");
        doc.setFontSize(9);
  
        // Data almarhum
        const rows = [
          ["NIK", p.nik || "-"],
          ["Nomor KK", p.no_kk || "-"],
          ["Jenis Kelamin", p.jk || "-"],
          ["Tgl Lahir", formatTanggal(p.tanggal_lahir)],
          ["Agama", p.agama || "-"],
          ["Alamat", p.alamat || "-"],
        ];
  
        rows.forEach(([label, val]) => {
          y += lineHeight;
          doc.text(label, label2X, y);
          doc.text(":", titik2X, y);
        
          if (label === "Alamat") {
            // 🔹 Bungkus teks alamat agar tidak keluar kotak
            const maxWidth = kolomLebar - (isiX - x) - 5;
            const wrapped = doc.splitTextToSize(val, maxWidth);
            doc.text(wrapped, isiX, y);
        
            // 🔹 Sesuaikan jarak otomatis:
            // - Kalau alamat 1 baris → kasih jarak 2
            // - Kalau lebih dari 1 baris → tambahkan jarak kecil sesuai panjangnya
            const extraSpace = wrapped.length === 1 ? 4 : 1.5;
            y += lineHeight * (wrapped.length - 1) + extraSpace;
          } else {
            doc.text(val, isiX, y);
          }
        });
        
        // 🔹 RT/RW di bawah alamat
        doc.text(`RT : ${p.rt || "-"}      RW : ${p.rw || "-"}`, isiX, y);
        
  
        y += lineHeight;
        doc.text("Desa/Kel", label2X, y);
        doc.text(":", titik2X, y);
        doc.text((p.desa || "MARGAHAYU TENGAH").toUpperCase(), isiX, y);
  
        y += lineHeight;
        doc.text("Kecamatan", label2X, y);
        doc.text(":", titik2X, y);
        doc.text((p.kecamatan || "MARGAHAYU").toUpperCase(), isiX, y);
  
        y += lineHeight;
        doc.text("Kabupaten", label2X, y);
        doc.text(":", titik2X, y);
        doc.text((p.kabupaten || "BANDUNG").toUpperCase(), isiX, y);
  
        y += lineHeight;
        doc.text("Provinsi", label2X, y);
        doc.text(":", titik2X, y);
        doc.text((p.provinsi || "JAWA BARAT").toUpperCase(), isiX, y);
  
        // === Kalimat penutup ===
        y += lineHeight * 0.8;
        doc.text("      Surat   keterangan    ini   dibuat    atas", x + padX, y);
        y += lineHeight;
        doc.text("dasar yang sebenarnya.", x + padX, y);
  
        // === Tanda tangan ===
        const yTtd = Math.max(y + 6, 122);
        const ttdCenter = x + kolomLebar / 2;
        doc.text(`Bandung, ${tanggalCetak}`, ttdCenter, yTtd, { align: "center" });
        doc.text("Kepala Desa MARGAHAYU TENGAH", ttdCenter, yTtd + lineHeight, {
          align: "center",
        });
        doc.setFont("arialbd", "bold");
        doc.text(
          "Drs. ASEP ZAENAL MAHMUD",
          ttdCenter,
          yTtd + lineHeight * 4.3,
          { align: "center" }
        );
      };
  
      // === Cetak 3 rangkap ===
      kolom.forEach((k) => drawSurat(k.x, k.label));
  
      // === Simpan PDF ===
      doc.save(`Surat_Kematian_${(p.nama || "").replace(/[^a-z0-9]/gi, "_")}.pdf`);
    } catch (err) {
      console.error("Gagal membuat surat kematian:", err);
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
        {/* Controls (filter RW/RT dengan pending state) */}
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

          <div className="flex items-center space-x-2">
            {/* RW filter (pending) */}
            <select
              value={pendingRw}
              onChange={(e) => {
                const newRw = e.target.value;
                setPendingRw(newRw);
                // reset pending RT saat RW berubah
                setPendingRt("");
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

            {/* RT filter (pending, opsi berdasarkan pendingRw) */}
            <select
              value={pendingRt}
              onChange={(e) => setPendingRt(e.target.value)}
              className="border rounded px-2 py-1"
              disabled={!pendingRw}
            >
              <option value="">Semua RT</option>
              {pendingRtOptions.map((rt) => (
                <option key={rt} value={rt}>
                  {rt}
                </option>
              ))}
            </select>

            {/* Tombol Terapkan (salin pending -> aktif) */}
            <button
              onClick={() => {
                setFilterRw(pendingRw);
                setFilterRt(pendingRt);
                setCurrentPage(1);
              }}
              className="px-3 py-1 bg-blue-600 text-white rounded"
            >
              Filter
            </button>

            {/* Clear filter (reset pending dan active) */}
            <button
              onClick={() => {
                setPendingRw("");
                setPendingRt("");
                setFilterRw("");
                setFilterRt("");
                setCurrentPage(1);
              }}
              className="px-3 py-1 bg-gray-300 rounded"
            >
              Clear
            </button>
          </div>
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
                <td colSpan={9} className="text-center py-6">
                  <div className="flex items-center justify-center space-x-3">
                    <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                    </svg>
                    <span className="text-gray-600">Memuat data...</span>
                  </div>
                </td>
              </tr>
            ) : displayedData.length > 0 ? (
              displayedData.map((item, index) => {
                const hari = item.hari_kematian || getNamaHari(item.tanggal_kematian);
                const tanggal = item.tanggal_kematian ? formatDateToDDMMYYYY(item.tanggal_kematian) : "";
                const pukul = item.pukul_kematian ? formatTimeHHMM(item.pukul_kematian) : "";
                const combined = hari || tanggal || pukul ? `${hari}${tanggal ? `, ${tanggal}` : ""}${pukul ? ` - ${pukul}` : ""}` : "-";

                return (
                  <tr key={item.id ?? index} className="hover:bg-gray-50">
                    <td className="px-4 py-2 border text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item.id)}
                        onChange={() => toggleSelect(item.id)}
                      />
                    </td>

                    <td className="px-4 py-2 border text-center">{(currentPage - 1) * entriesPerPage + index + 1}</td>

                    <td className="px-4 py-2 border">{item.nik}</td>
                    <td className="px-4 py-2 border">{item.no_kk}</td>
                    <td className="px-4 py-2 border">{item.nama}</td>

                    <td className="px-4 py-2 border">{combined}</td>
                    <td className="px-4 py-2 border">{item.sebab}</td>
                    <td className="px-4 py-2 border">{item.tempat_kematian}</td>

                    <td className="px-4 py-2 border text-center">
                      <div className="flex justify-center space-x-2">
                        <button
                            onClick={() => handlePrintKematian(item.id)}
                            className="p-2 text-green-600 hover:bg-blue-100 rounded-full"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        <Link to={`/admin/sirkulasi_penduduk/data_kematian/edit_kematian/${item.id}`} className="p-2 text-yellow-600 hover:bg-yellow-100 rounded-full">
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button onClick={() => openDeleteModal(item)} className="p-2 text-red-600 hover:bg-red-100 rounded-full">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={9} className="text-center py-4 text-gray-500">Tidak ada data</td>
              </tr>
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

              {/* RW (dropdown, non-readonly) */}
              <div className="relative w-full">
                <select
                  value={formData.rw || ""}
                  onChange={(e) => {
                    const newRw = e.target.value;
                    setFormData((prev) => ({ ...prev, rw: newRw }));
                  }}
                  className="border rounded px-3 py-2 w-full bg-white"
                >
                  <option value="">-- Pilih RW --</option>
                  {rwOptions.map((rw, idx) => (
                    <option key={idx} value={rw}>{rw}</option>
                  ))}
                </select>
              </div>

              {/* RT (dropdown, depends on selected RW) */}
              <div className="relative w-full">
                <select
                  value={formData.rt || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, rt: e.target.value }))}
                  className="border rounded px-3 py-2 w-full bg-white"
                >
                  <option value="">-- Pilih RT --</option>
                  {rtOptions.map((rt, idx) => (
                    <option key={idx} value={rt}>{rt}</option>
                  ))}
                </select>
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
            <p className="text-gray-600 mb-4">Anda memilih <b>{selectedIds.length}</b> data. Apa yang ingin dilakukan?</p>

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

export default Data_Kematian;
