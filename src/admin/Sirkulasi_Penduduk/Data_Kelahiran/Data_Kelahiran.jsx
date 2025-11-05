// src/rt/pages/KelolaData/Data_Kelahiran.jsx
import React, { useState, useEffect, useRef } from "react";
import { useLocation, useSearchParams, Link } from "react-router-dom";
import { Printer, Eye, Edit, Trash2, FileText, UserPlus } from "lucide-react";
import supabase from "../../../supabaseClient";
import jsPDF from "jspdf";
import "../../../../jsPDF/fonts/arial-normal.js";
import "../../../../jsPDF/fonts/arialbd-bold.js";
import "../../../../jsPDF/fonts/ariali-italic.js";

function Data_Kelahiran() {
  const [allData, setAllData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const [rtOptions, setRtOptions] = useState([]);
  const [rwOptions, setRwOptions] = useState([]);
  const [selectedRt, setSelectedRt] = useState("");
  const [selectedRw, setSelectedRw] = useState("");

  // kepalaKeluarga sekarang menyimpan 1 record representatif per no_kk
  const [kepalaKeluarga, setKepalaKeluarga] = useState([]);
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

  const [isLoading, setIsLoading] = useState(false);

  // Fetch semua data kelahiran
  const fetchData = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("data_kelahiran")
        .select("*")
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
        setFilteredData([]);
      } else {
        setAllData(data || []);
        setFilteredData(data || []);
        setCurrentPage(1);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setAllData([]);
      setFilteredData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [location.search]);

  const [loadingKK, setLoadingKK] = useState(false);

  useEffect(() => {
    const fetchAllKepalaKK = async () => {
      try {
        setLoadingKK(true);
        let allRows = [];
        const { count, error: countError } = await supabase
          .from("data_penduduk")
          .select("id_penduduk", { count: "exact", head: true }); // hanya ambil count

        if (countError) throw countError;

        const batchSize = 1000;
        for (let i = 0; i < count; i += batchSize) {
          const { data, error } = await supabase
            .from("data_penduduk")
            .select("id_penduduk,no_kk,nama,status_keluarga,alamat,rt,rw,desa,kecamatan,kabupaten,provinsi,kode_pos,nik,tanggal_lahir,pekerjaan")
            .order("id_penduduk", { ascending: true })
            .range(i, i + batchSize - 1);

          if (error) throw error;
          allRows = [...allRows, ...data];
        }

        // simpan allPenduduk supaya bisa dicari istri
        setAllPenduduk(allRows);

        // Group per no_kk
        const grouped = {};
        allRows.forEach((d) => {
          const kk = d.no_kk?.trim() || "_TANPA_NO_KK";
          if (!grouped[kk]) grouped[kk] = [];
          grouped[kk].push(d);
        });

        const result = Object.values(grouped).map((anggota) => {
          const kepala = anggota.find(
            (a) => (a.status_keluarga || "").toLowerCase().trim() === "kepala keluarga"
          );
          if (kepala) {
            return {
              ...kepala,
              label: `${kepala.no_kk} - ${kepala.nama}`,
            };
          } else {
            const first = anggota[0];
            return {
              ...first,
              label: `${first.no_kk || "TANPA NO KK"} - ${first.nama}`,
            };
          }
        });

        setKepalaKeluarga(result);
      } catch (err) {
        console.error("Gagal ambil data kepala keluarga:", err);
        setKepalaKeluarga([]);
      } finally {
        setLoadingKK(false);
      }
    };

    fetchAllKepalaKK();
  }, []);

  // Klik di luar dropdown -> tutup
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Pagination berdasarkan filteredData
  const totalPages = Math.ceil(filteredData.length / entriesPerPage) || 0;
  const displayedData = filteredData.slice(
    (currentPage - 1) * entriesPerPage,
    currentPage * entriesPerPage
  );

  const handlePrevious = () => {
    if (currentPage > 1) setCurrentPage((p) => p - 1);
  };
  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage((p) => p + 1);
  };

  // Delete single
  const handleHapus = async (id) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus data ini?")) return;
    const { error } = await supabase.from("data_kelahiran").delete().eq("id_kelahiran", id);
    if (error) alert("Gagal menghapus data: " + error.message);
    else {
      setAllData((prev) => prev.filter((item) => item.id_kelahiran !== id));
      setFilteredData((prev) => prev.filter((item) => item.id_kelahiran !== id));
      setSelectedIds((prev) => prev.filter(i => i !== id));
    }
  };

  // Toggle select one row
  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Toggle select all (visible page)
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

  // Hapus banyak
  const handleDeleteMany = async () => {
    if (selectedIds.length === 0) {
      alert("Pilih data yang ingin dihapus!");
      return;
    }
    if (!window.confirm(`Yakin ingin menghapus ${selectedIds.length} data terpilih?`)) return;

    const { error } = await supabase
      .from("data_kelahiran")
      .delete()
      .in("id_kelahiran", selectedIds);  // ✅ ini cara yang benar

    if (error) {
      alert("Gagal menghapus data: " + error.message);
    } else {
      // update state lokal biar UI langsung refresh
      setAllData((prev) =>
        prev.filter((item) => !selectedIds.includes(item.id_kelahiran))
      );
      setFilteredData((prev) =>
        prev.filter((item) => !selectedIds.includes(item.id_kelahiran))
      );
      setSelectedIds([]);
      setSelectAll(false);
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

    // refresh table
    await fetchData();

    // reset form (include added fields)
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
    setIsModalOpen(false);
    alert("Data kelahiran berhasil disimpan!");
  };

  // Cari kepala keluarga berdasarkan no_kk (untuk menampilkan di tabel)
  const getKepalaKeluarga = (no_kk) => {
    const kk = kepalaKeluarga.find((k) => String(k.no_kk) === String(no_kk));
    return kk ? `${kk.no_kk} - ${kk.nama || "(Tanpa Nama)"}` : `${no_kk} - Tidak ditemukan`;
  };

  // Fetch RT/RW dari table users.
  const fetchRtRw = async () => {
    const { data, error } = await supabase
      .from("users")
      .select("rt, rw");

    if (error) {
      console.error("Error fetching RT/RW:", error);
      return;
    }

    const filtered = (data || []).filter(u => u.rt !== null && u.rw !== null);
    const rws = [...new Set(filtered.map(u => String(u.rw).trim()))].sort((a,b) => a.localeCompare(b));
    const rts = [...new Set(filtered.map(u => String(u.rt).trim()))].sort((a,b) => a.localeCompare(b));

    setRwOptions(rws);
    setRtOptions(rts);
  };

  // Ketika RW dipilih: set selectedRw dan filter RT sesuai RW terpilih
  useEffect(() => {
    const filterRtByRw = async () => {
      if (!selectedRw) {
        const { data, error } = await supabase.from("users").select("rt, rw");
        if (error) {
          console.error("Error fetching RT/RW:", error);
          return;
        }
        const filtered = (data || []).filter(u => u.rt !== null && u.rw !== null);
        const rts = [...new Set(filtered.map(u => String(u.rt).trim()))].sort((a,b) => a.localeCompare(b));
        setRtOptions(rts);
      } else {
        const { data, error } = await supabase.from("users").select("rt").eq("rw", selectedRw);
        if (error) {
          console.error("Error fetching RT for RW:", error);
          setRtOptions([]);
          return;
        }
        const rts = [...new Set((data || []).map(u => String(u.rt).trim()))].sort((a,b) => a.localeCompare(b));
        setRtOptions(rts);
      }
      setSelectedRt("");
    };

    filterRtByRw();
  }, [selectedRw]);

  useEffect(() => {
    fetchRtRw();
  }, []);

  // Fungsi filter & clear (dipicu tombol)
  const applyFiltersToUrl = () => {
    let temp = [...allData];
    if (selectedRw) temp = temp.filter(item => String(item.rw) === String(selectedRw));
    if (selectedRt) temp = temp.filter(item => String(item.rt) === String(selectedRt));
    setFilteredData(temp);
    setCurrentPage(1);
    setSelectedIds([]);
    setSelectAll(false);
  };

  const clearFilters = () => {
    setSelectedRw("");
    setSelectedRt("");
    setFilteredData(allData);
    setCurrentPage(1);
    setSelectedIds([]);
    setSelectAll(false);
  };

  const safeLower = (v = "") => String(v).toLowerCase();

    const handlePrintKelahiran = async (id_kelahiran) => {
      try {
        // === Ambil data penduduk ===
        const { data: p, error } = await supabase
          .from("data_kelahiran")
          .select("*")
          .eq("id_kelahiran", id_kelahiran)
          .single();
        if (error) throw error;
    
        // === Ambil data ayah & ibu ===
        let dataAyah = null;
        let dataIbu = null;
    
        if (p.nik_ayah && p.nik_ayah.trim() !== "") {
          const { data: ayah, error: errAyah } = await supabase
            .from("data_kelahiran")
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
          setPendingPrintId(id_kelahiran);
          setFormData((prev) => ({
            ...prev,
            id_kelahiran: p.id_kelahiran,
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
              id_kelahiran,
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
          {/* Entries per page */}
          <span className="text-sm">Show</span>
          <select
            value={entriesPerPage}
            onChange={(e) => {
              setEntriesPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="appearance-none bg-gray-200 border rounded px-2 py-1 text-sm pr-6 focus:outline-none"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span className="text-sm">entries</span>

          <div className="flex items-center space-x-2">
            {/* Filter RW */}
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
                <option key={rw} value={rw}>{rw}</option>
              ))}
            </select>

            {/* Filter RT */}
            <select
              value={selectedRt}
              onChange={(e) => setSelectedRt(e.target.value)}
              className="border rounded px-2 py-1"
              disabled={!selectedRw}
            >
              <option value="">Semua RT</option>
              {rtOptions.map((rt) => (
                <option key={rt} value={rt}>{rt}</option>
              ))}
            </select>

            {/* Tombol Filter */}
            <button
              onClick={applyFiltersToUrl}
              className="px-3 py-1 bg-blue-600 text-white rounded"
            >
              Filter
            </button>

            {/* Tombol Clear */}
            <button
              onClick={clearFilters}
              className="px-3 py-1 bg-gray-300 rounded"
            >
              Clear
            </button>
          </div>
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
                  checked={displayedData.length > 0 && selectedIds.length === displayedData.length}
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
            {isLoading ? (
              <tr>
                <td colSpan={9} className="text-center py-6 text-gray-600">
                  Memuat data...
                </td>
              </tr>
            ) : (
              <>
                {[...displayedData]
                  .sort((a, b) => b.id_kelahiran - a.id_kelahiran)
                  .map((item, index) => (
                    <tr key={item.id_kelahiran} className="hover:bg-gray-50">
                      <td className="px-4 py-2 border text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(item.id_kelahiran)}
                          onChange={() => toggleSelect(item.id_kelahiran)}
                        />
                      </td>
                      <td className="px-4 py-2 border text-center">{(currentPage - 1) * entriesPerPage + index + 1}</td>
                      <td className="px-4 py-2 border text-center">{item.nik}</td>
                      <td className="px-4 py-2 border text-center">{item.no_kk}</td>
                      <td className="px-4 py-2 border text-center">{item.nama}</td>
                      <td className="px-4 py-2 border text-center">{item.tanggal_lahir}</td>
                      <td className="px-4 py-2 border text-center">{item.jk}</td>
                      <td className="px-4 py-2 border text-center">{getKepalaKeluarga(item.no_kk)}</td>
                      <td className="px-4 py-2 border text-center">
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={() => handlePrintKelahiran(item.id_kelahiran)}
                            className="p-2 text-green-600 hover:bg-blue-100 rounded-full"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <Link to={`/admin/sirkulasi_penduduk/data_kelahiran/${item.id_kelahiran}`} className="p-2 text-blue-600 hover:bg-blue-100 rounded-full">
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link to={`/admin/sirkulasi_penduduk/data_kelahiran/edit/${item.id_kelahiran}`} className="p-2 text-yellow-600 hover:bg-yellow-100 rounded-full">
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button onClick={() => handleHapus(item.id_kelahiran)} className="p-2 text-red-600 hover:bg-red-100 rounded-full">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                {!isLoading && displayedData.length === 0 && (
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
          Showing {filteredData.length === 0 ? 0 : (currentPage - 1) * entriesPerPage + 1} to {Math.min(currentPage * entriesPerPage, filteredData.length)} of {filteredData.length} entries
        </span>

        <div className="space-x-2 flex items-center">
          <button onClick={handlePrevious} disabled={currentPage === 1} className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50">Previous</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
            <button key={num} onClick={() => setCurrentPage(num)} className={`px-3 py-1 rounded ${currentPage === num ? "bg-blue-500 text-white" : "bg-gray-200"}`}>
              {num}
            </button>
          ))}
          <button onClick={handleNext} disabled={currentPage === totalPages || totalPages === 0} className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50">Next</button>
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
                        // cari data ibu pada semua anggota (allPenduduk)
                        const ibu = allPenduduk.find(
                          (p) =>
                            p.no_kk === k.no_kk &&
                            (p.status_keluarga || "").toLowerCase() === "istri"
                        );

                        return (
                          <div
                            key={k.id_kelahiran}
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
                  setFormData({ ...formData, nik: e.target.value.trimStart() })
                }
                className="border rounded px-3 py-2"
              />
              <input
                type="text"
                placeholder="Nama"
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                className="border rounded px-3 py-2"
              />
              <input
                type="text"
                placeholder="Tempat Lahir"
                value={formData.tempat_lahir}
                onChange={(e) =>
                  setFormData({ ...formData, tempat_lahir: e.target.value })
                }
                className="border rounded px-3 py-2"
              />
              <input
                type="date"
                placeholder="Tanggal Lahir"
                value={formData.tanggal_lahir}
                onChange={(e) =>
                  setFormData({ ...formData, tanggal_lahir: e.target.value })
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
                      .filter((item) =>
                        item.toLowerCase().includes(searchJK.toLowerCase())
                      )
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
                  setFormData({
                    ...formData,
                    golongan_darah: e.target.value.trimStart(),
                  })
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
                      .filter((item) =>
                        item.toLowerCase().includes(searchAgama.toLowerCase())
                      )
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
              <input type="text" value={formData.status_perkawinan} readOnly className="border rounded px-3 py-2 bg-gray-100" />
              <input type="text" value={formData.pendidikan} readOnly className="border rounded px-3 py-2 bg-gray-100" />
              <input type="text" value={formData.pekerjaan} readOnly className="border rounded px-3 py-2 bg-gray-100" />

              <input type="text" placeholder="Alamat" value={formData.alamat} readOnly className="border rounded px-3 py-2 bg-gray-100" />
              <input type="text" placeholder="RT" value={formData.rt} readOnly className="border rounded px-3 py-2 bg-gray-100" />
              <input type="text" placeholder="RW" value={formData.rw} readOnly className="border rounded px-3 py-2 bg-gray-100" />
              <input type="text" value={formData.status_keluarga} readOnly className="border rounded px-3 py-2 bg-gray-100" />

              {/* Data Ayah & Ibu */}
              <input
                type="text"
                placeholder="NIK Ayah"
                value={formData.nik_ayah}
                onChange={(e) => setFormData((prev) => ({ ...prev, nik_ayah: e.target.value.trimStart() }))}
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
                onChange={(e) => setFormData((prev) => ({ ...prev, nik_ibu: e.target.value.trimStart() }))}
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

export default Data_Kelahiran;
