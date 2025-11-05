// src/rt/pages/Laporan.jsx
import React, { useState, useEffect } from "react";
import { FileText, Download } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import supabase from "../../supabaseClient";
import logo from "../../assets/logo_desa.png";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

function Laporan() {
  const [laporan, setLaporan] = useState([]);
  const [jenisLaporan, setJenisLaporan] = useState("data_penduduk");
  const [bulan, setBulan] = useState(new Date().getMonth() + 1);
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [showFilter, setShowFilter] = useState(false);
  const [filterActive, setFilterActive] = useState(false);
  const [loading, setLoading] = useState(false);

  // Perubahan: HAPUS bagian yang ambil profil login.
  // Ganti dengan dropdown RW dan RT: RT bergantung pada RW yang dipilih.
  const [ketuaRWName, setKetuaRWName] = useState("Nama Ketua RW");

  // tambahan untuk laporan kematian / pindah: jabatan & nama pencetak
  const [pencetakJabatan, setPencetakJabatan] = useState("");
  const [pencetakNama, setPencetakNama] = useState("");

  // RW / RT controls
  const [rwOptions, setRwOptions] = useState([]);
  const [selectedRW, setSelectedRW] = useState("01"); 

  // setiap item RT = { value: rawRt, label: padded (plus count) }
  const [rtOptions, setRtOptions] = useState([]);
  const [selectedRT, setSelectedRT] = useState("all"); // default semua RT

  const namaBulan = [
    "Januari","Februari","Maret","April","Mei","Juni",
    "Juli","Agustus","September","Oktober","November","Desember"
  ];

  const getIdColumn = (tableName) => {
    switch (tableName) {
      case "data_penduduk":
        return "id_penduduk";
      case "data_kelahiran":
        return "id_kelahiran";
      case "data_kartu_keluarga":
        return "no_kk";
      default:
        return "id";
    }
  };

  // -------------------------
  // Helpers untuk tanggal / hari / pukul formatting
  // -------------------------
  function getNamaHari(dateString) {
    if (!dateString) return "";
    const [y, m, d] = String(dateString).split("-");
    const dt = new Date(Number(y), Number(m) - 1, Number(d));
    const hariArray = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    return hariArray[dt.getDay()] || "";
  }

  function formatDateToDDMMYYYY(dateString) {
    if (!dateString) return "";
    const [y, m, d] = String(dateString).split("-");
    return `${String(d).padStart(2, "0")}-${String(m).padStart(2, "0")}-${y}`;
  }

  function formatTimeHHMM(timeString) {
    if (!timeString) return "";
    const parts = String(timeString).split(":");
    const hh = parts[0] ? String(parts[0]).padStart(2, "0") : "00";
    const mm = parts[1] ? String(parts[1]).padStart(2, "0") : "00";
    return `${hh}:${mm}`;
  }

  const pad2 = (v) => {
    if (v === null || v === undefined || v === "") return "-";
    const n = Number(String(v).trim());
    if (!isNaN(n)) return String(n).padStart(2, "0");
    return String(v).trim();
  };

  const isUUID = (id) =>
    typeof id === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  const isNumericId = (id) => typeof id === "string" && /^[0-9]+$/.test(id);

  useEffect(() => {
  const fetchRWs = async () => {
    try {
      let rows = [];

      // 1) coba ambil dari users
      try {
        const { data: uRows, error: uErr } = await supabase.from("users").select("rw");
        if (!uErr && Array.isArray(uRows) && uRows.length > 0) {
          rows = uRows
            .map((r) =>
              r && r.rw !== undefined && r.rw !== null ? String(r.rw).trim() : ""
            )
            .filter(Boolean);
        }
      } catch (e) {
        console.debug("fetchRWs users error (ignored):", e);
      }

      // 2) fallback ke data_penduduk
      if (rows.length === 0) {
        try {
          const { data: dpRows, error: dpErr } = await supabase
            .from("data_penduduk")
            .select("rw");
          if (!dpErr && Array.isArray(dpRows) && dpRows.length > 0) {
            rows = dpRows
              .map((r) =>
                r && r.rw !== undefined && r.rw !== null ? String(r.rw).trim() : ""
              )
              .filter(Boolean);
          }
        } catch (e) {
          console.debug("fetchRWs data_penduduk error (ignored):", e);
        }
      }

      // hitung counts per RW
      const counts = {};
      rows.forEach((r) => {
        counts[r] = (counts[r] || 0) + 1;
      });

      let options = Object.keys(counts)
        .filter(Boolean)
        .sort((a, b) => Number(a) - Number(b))
        .map((rw) => ({
          value: rw,
          label: `${pad2(rw)}`,
        }));

      // jika kosong -> default RW 01..05
      if (options.length === 0) {
        options = Array.from({ length: 5 }, (_, i) => {
          const raw = String(i + 1);
          return { value: raw, label: pad2(raw) };
        });
      }

      setRwOptions(options);

      // set default selectedRW bila belum valid
      if (!options.some((o) => o.value === selectedRW)) {
        setSelectedRW(options[0].value); // otomatis RW pertama (misalnya RW01)
      }
    } catch (e) {
      console.error("Gagal fetch RW:", e);

      // fallback kalau error besar
      const fallback = Array.from({ length: 5 }, (_, i) => {
        const raw = String(i + 1);
        return { value: raw, label: pad2(raw) };
      });
      setRwOptions(fallback);
      if (!fallback.some((o) => o.value === selectedRW)) {
        setSelectedRW(fallback[0].value);
      }
    }
  };

  fetchRWs();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

  useEffect(() => {
    const fetchRTs = async () => {
      if (!selectedRW) {
        setRtOptions([]);
        return;
      }

      try {
        const variants = [];
        if (selectedRW !== "all") {
          const raw = String(selectedRW).trim();
          const rawNoPad = String(Number(raw));
          const padded = pad2(raw);
          variants.push(...Array.from(new Set([raw, rawNoPad, padded].filter(Boolean))));
        }

        // 1) Utamakan ambil dari tabel `users` untuk menghitung jumlah per RT
        let userQuery = supabase.from("users").select("rt,rw");
        if (variants.length > 0) userQuery = userQuery.or(variants.map((v) => `rw.eq.${v}`).join(","));

        const { data: userRows, error: usersError } = await userQuery;

        let counts = {};

        if (!usersError && Array.isArray(userRows) && userRows.length > 0) {
          userRows.forEach((r) => {
            if (!r) return;
            // jika selectedRW is set (variants), pastikan rw match — already applied by .or()
            const rawRt = (r.rt === null || r.rt === undefined) ? "" : String(r.rt).trim();
            if (!rawRt) return;
            counts[rawRt] = (counts[rawRt] || 0) + 1;
          });
        }

        // 2) fallback ke data_penduduk jika counts kosong
        if (Object.keys(counts).length === 0) {
          let dpQuery = supabase.from("data_penduduk").select("rt,rw").order("rt", { ascending: true });
          if (variants.length > 0) dpQuery = dpQuery.or(variants.map((v) => `rw.eq.${v}`).join(","));

          const { data: dpRows, error: dpErr } = await dpQuery;
          if (!dpErr && Array.isArray(dpRows) && dpRows.length > 0) {
            dpRows.forEach((r) => {
              if (!r) return;
              const rawRt = (r.rt === null || r.rt === undefined) ? "" : String(r.rt).trim();
              if (!rawRt) return;
              counts[rawRt] = (counts[rawRt] || 0) + 1;
            });
          }
        }

        let finalOptions = Object.keys(counts)
          .filter(Boolean)
          .sort((a, b) => Number(a) - Number(b))
          .map((rawRt) => ({ value: rawRt, label: `${pad2(rawRt)}` }));

        if (finalOptions.length === 0) {
          finalOptions = Array.from({ length: 5 }, (_, i) => {
            const raw = String(i + 1);
            return { value: raw, label: pad2(raw) };
          });
        }

        // tambahkan opsi 'all'
        finalOptions = [{ value: "all", label: "Semua RT" }, ...finalOptions];

        setRtOptions(finalOptions);

        // Pastikan selectedRT valid
        if (!finalOptions.some((o) => o.value === selectedRT)) {
          setSelectedRT(finalOptions[0].value);
        }
      } catch (e) {
        console.error("Gagal fetch RT:", e);
        const fallback = [{ value: "all", label: "Semua RT" }, ...Array.from({ length: 5 }, (_, i) => ({ value: String(i + 1), label: pad2(String(i + 1)) }))];
        setRtOptions(fallback);
        if (!fallback.some((o) => o.value === selectedRT)) setSelectedRT(fallback[0].value);
      }
    };

    fetchRTs();
  }, [selectedRW]);

  async function fetchAllRows(tableName, selectCols = "*", filters = (q) => q, idColumn = "id") {
    let allData = [];
    let batchSize = 1000;
    let from = 0;
    let to = batchSize - 1;
    let hasMore = true;

    while (hasMore) {
      let query = supabase
        .from(tableName)
        .select(selectCols)
        .order(idColumn, { ascending: true })
        .range(from, to);

      query = filters(query);

      const { data, error } = await query;
      if (error) {
        console.error("Supabase error:", error);
        break;
      }

      if (!data || data.length === 0) {
        hasMore = false;
      } else {
        allData = [...allData, ...data];
        from += batchSize;
        to += batchSize;
        if (data.length < batchSize) {
          hasMore = false;
        }
      }
    }

    return allData;
  }

  const fetchLaporan = async () => {
    if (!jenisLaporan) return;
    setLoading(true);

    try {
      const tableName = jenisLaporan;
      const idColumn = getIdColumn(tableName);

      const startDate = `${tahun}-${String(bulan).padStart(2, "0")}-01`;
      const lastDay = new Date(tahun, bulan, 0).getDate();
      const endDate = `${tahun}-${String(bulan).padStart(2, "0")}-${lastDay}`;

      // filter dinamis
      const filterFn = (query) => {
        if (filterActive) {
          query = query.gte("created_at", startDate).lte("created_at", endDate);
        }

        // apply RW filter only when selectedRW is set (i.e. not 'all')
        if (selectedRW && selectedRW !== "all") query = query.eq("rw", selectedRW);

        // jika selectedRT === 'all' berarti tidak memfilter RT
        if (selectedRT && selectedRT !== "all") query = query.eq("rt", selectedRT);
        return query;
      };

      let data = [];
      if (tableName === "data_kartu_keluarga") {
        data = await fetchAllRows(
          "data_penduduk",
          "no_kk, nama, nik, alamat, rt, rw, created_at",
          filterFn,
          "no_kk"
        );
      } else {
        data = await fetchAllRows(tableName, "*", filterFn, idColumn);
      }

      // formatting
      let formattedData = (data || []).map((d) => ({
        ...d,
        _rt_raw: d.rt ?? "",
        _rw_raw: d.rw ?? "",
        rt: d.rt ? String(d.rt).padStart(2, "0") : d.rt,
        rw: d.rw ? String(d.rw).padStart(2, "0") : d.rw,
      }));

      if (tableName === "data_pindah") {
        formattedData = formattedData.map((d) => {
          const alamatGabung = [
            d.alamat_pindah,
            d.rt_pindah ? `RT ${d.rt_pindah}` : "",
            d.rw_pindah ? `RW ${d.rw_pindah}` : "",
            d.desa_pindah,
            d.kecamatan_pindah,
            d.kabupaten_pindah,
            d.provinsi_pindah,
            d.kodepos_pindah
          ]
            .filter(Boolean)
            .join(", ");
          return { ...d, alamat_pindah: alamatGabung };
        });
      }

      if (tableName === "data_kematian") {
        formattedData = formattedData.map((item) => {
          const hari = item.hari_kematian || getNamaHari(item.tanggal_kematian);
          const tanggal = item.tanggal_kematian
            ? formatDateToDDMMYYYY(item.tanggal_kematian)
            : "";
          const pukul = item.pukul_kematian
            ? formatTimeHHMM(item.pukul_kematian)
            : "";

          const hari_tanggal_pukul =
            hari || tanggal || pukul
              ? `${hari}${tanggal ? `, ${tanggal}` : ""}${pukul ? ` - ${pukul}` : ""}`
              : "-";

          return { ...item, hari_tanggal_pukul };
        });
      }

      // ✅ urutkan berdasarkan RT (01 → 05)
      formattedData.sort((a, b) => {
        const rtA = parseInt(a._rt_raw || "0", 10);
        const rtB = parseInt(b._rt_raw || "0", 10);
        return rtA - rtB;
      });

      setLaporan(formattedData);
    } catch (err) {
      console.error("Terjadi kesalahan saat mengambil laporan:", err);
      setLaporan([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLaporan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jenisLaporan, filterActive, bulan, tahun, selectedRW, selectedRT]);

  const isHiddenColumn = (key) => {
    if (!key) return true;
    const k = String(key).toLowerCase();

    if (jenisLaporan === "data_kematian") {
      const allowed = ["nik", "no_kk", "nama", "sebab_kematian", "tempat_kematian", "hari_tanggal_pukul", "rt", "rw"];
      return !allowed.includes(k);
    }

    if (jenisLaporan === "data_pindah") {
      const allowed = ["nik","no_kk","nama","tanggal_pindah","alasan","alamat_pindah", "rt", "rw"];
      return !allowed.includes(k);
    }

    if (k === "id") return true;
    if (k.startsWith("id_")) return true;
    if (k.endsWith("_id")) return true;
    if (k === "created_at") return true;
    if (k === "updated_at") return true;

    if (k === "_rt_raw" || k === "_rw_raw") return true;

    return false;
  };

  const computeVisibleColumns = () => {
    if (!laporan || laporan.length === 0) return [];
    const first = laporan[0];
    return Object.keys(first).filter((k) => !isHiddenColumn(k));
  };

  const exportExcel = async () => {
    if (laporan.length === 0) {
      alert("Tidak ada data untuk diekspor!");
      return;
    }

    const visibleCols = computeVisibleColumns();
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Laporan");

    worksheet.addRow(["No", ...visibleCols]);

    laporan.forEach((row, index) => {
      const rowData = [index + 1];
      visibleCols.forEach((col) => {
        rowData.push(row[col] ?? "");
      });
      worksheet.addRow(rowData);
    });

    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.alignment = { horizontal: "center", vertical: "middle" };
      });
    });

    const namaBulanText = filterActive ? String(bulan).padStart(2, "0") : "";
    const tahunText = filterActive ? tahun : "semua_data";
    const rtText = selectedRT && selectedRT !== "all" ? `RT${pad2(selectedRT)}` : "semuaRT";
    const rwText = selectedRW && selectedRW !== "all" ? `RW${pad2(selectedRW)}` : "semuaRW";

    const fileName = `Laporan_${jenisLaporan}_${namaBulanText}-${tahunText}_${rtText}_${rwText}.xlsx`;

    const buf = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buf]), fileName);
  };

  const exportPDF = () => {
    if (laporan.length === 0) {
      alert("Tidak ada data untuk diekspor!");
      return;
    }

    const visibleCols = computeVisibleColumns();
    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // --- Logo & Kop ---
    const logoWidth = 30;
    const logoHeight = 30;
    const topMargin = 10;
    const leftMargin = 30;
    try {
      doc.addImage(logo, "PNG", leftMargin, topMargin, logoWidth, logoHeight);
    } catch (e) {
      // abaikan jika logo gagal
    }

    const lines = [
      { text: "PEMERINTAH KABUPATEN BANDUNG", font: "times", style: "bold", size: 14 },
      { text: "KECAMATAN MARGAHAYU", font: "times", style: "bold", size: 12 },
      { text: "DESA MARGAHAYU TENGAH", font: "times", style: "bold", size: 12 },
      { text: "Jalan Sadang 90 Margahayu, Bandung 40225 Telp: 022-5418334", font: "times", style: "normal", size: 10 },
      { text: "Website: https://margahayutengah.desa.id | Email: desa.margahayutengah@gmail.com", font: "times", style: "normal", size: 9 }
    ];

    const lineHeights = lines.map((ln) => ln.size * 0.35);
    const textBlockHeight = lineHeights.reduce((a, b) => a + b, 0);
    const startY = topMargin + (logoHeight - textBlockHeight) / 2 + lineHeights[0];

    let maxTextWidth = 0;
    lines.forEach((ln) => {
      doc.setFont(ln.font, ln.style);
      doc.setFontSize(ln.size);
      const w = doc.getTextWidth(ln.text);
      if (w > maxTextWidth) maxTextWidth = w;
    });

    const centerX = pageWidth / 2;
    const minGap = 8;
    const requiredLeft = leftMargin + logoWidth + minGap;
    const leftIfCentered = centerX - maxTextWidth / 2;
    let adjustedCenterX = centerX;
    if (leftIfCentered < requiredLeft) {
      adjustedCenterX = requiredLeft + maxTextWidth / 2;
    }

    let currentY = startY;
    lines.forEach((ln) => {
      doc.setFont(ln.font, ln.style);
      doc.setFontSize(ln.size);
      doc.text(ln.text, adjustedCenterX, currentY, { align: "center" });
      currentY += ln.size * 0.35;
    });

    const separatorY = topMargin + logoHeight + 6;
    doc.setLineWidth(0.8);
    doc.line(10, separatorY, pageWidth - 10, separatorY);

    // --- Judul Laporan ---
    let cursor = separatorY + 8;
    doc.setFont("times", "bold");
    doc.setFontSize(12);
    doc.text("LAPORAN " + jenisLaporan.replace("_", " ").toUpperCase(), pageWidth / 2, cursor, { align: "center" });
    cursor += 6;

    doc.setFont("times", "normal");
    doc.setFontSize(10);

    // --- Periode & Lokasi (gabungan 1 baris) ---
    const periodeText = filterActive
      ? `Periode: ${String(bulan).padStart(2, "0")}-${tahun}`
      : "Periode: Semua Data";

    const lokasiText =
      (selectedRT && selectedRT !== "all") || (selectedRW && selectedRW !== "all")
        ? `Lokasi: ${selectedRT && selectedRT !== "all" ? `RT ${pad2(selectedRT)}` : "Semua RT"}${selectedRW && selectedRW !== "all" ? ` / RW ${pad2(selectedRW)}` : ""}`
        : "Lokasi: Semua RT/RW";

    doc.text(`${periodeText} | ${lokasiText}`, pageWidth / 2, cursor, { align: "center" });
    cursor += 2;

    // --- Tabel Data ---
    const exportData = laporan.map((row, idx) => {
      const out = { No: idx + 1 };
      visibleCols.forEach((c) => (out[c] = row[c] ?? ""));
      return out;
    });
    const headers = Object.keys(exportData[0] || {});
    const body = exportData.map((r) => Object.values(r));

    autoTable(doc, {
      head: [headers],
      body,
      startY: cursor + 4,
      styles: { fontSize: 9, halign: "center", valign: "middle" },
      headStyles: { fillColor: [30, 120, 60], halign: "center" },
      theme: "grid",
    });

    // --- Tanda tangan ---
    const inferredKabupaten = "Bandung";

    const printedDate = new Date().toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : cursor + 8;
    let signatureY = finalY + 18;

    const bottomSafeMargin = 40;
    if (signatureY > pageHeight - bottomSafeMargin) {
      doc.addPage();
      signatureY = 50;
    }

    const rightMargin = 20;
    const signatureBlockWidth = 80;
    const signatureCenterX = pageWidth - rightMargin - signatureBlockWidth / 2;

    doc.setFont("times", "normal");
    doc.setFontSize(10);
    doc.text(`${inferredKabupaten}, ${printedDate}`, signatureCenterX, signatureY, { align: "center" });

    const signTitleY = signatureY + 8;
    doc.setFont("times", "normal");
    doc.setFontSize(11);

    // jika laporan kematian atau pindah -> ganti Ketua RW dengan jabatan yang diisi
    const isSpecial = jenisLaporan === "data_kematian" || jenisLaporan === "data_pindah";
    const titleText = isSpecial ? (pencetakJabatan || "Ketua RW") : (selectedRW && selectedRW !== "all" ? `Ketua RW ${pad2(selectedRW)}` : "Ketua RW");

    doc.text(titleText, signatureCenterX, signTitleY, { align: "center" });

    const nameY = signTitleY + 24;
    doc.setFont("times", "bold");
    doc.setFontSize(11);

    const nameText = isSpecial ? (pencetakNama || ketuaRWName) : ketuaRWName;
    doc.text(nameText, signatureCenterX, nameY, { align: "center" });

    // --- Simpan file ---
    const namaBulanText = filterActive ? String(bulan).padStart(2, "0") : "";
    const tahunText = filterActive ? tahun : "semua_data";
    const rtText = selectedRT && selectedRT !== "all" ? `RT${pad2(selectedRT)}` : "semuaRT";
    const rwText = selectedRW && selectedRW !== "all" ? `RW${pad2(selectedRW)}` : "semuaRW";

    const fileName = `Laporan_${jenisLaporan}_${namaBulanText}-${tahunText}_${rtText}_${rwText}.pdf`;
    doc.save(fileName);
  };

  const handleTerapkanFilter = () => {
    setFilterActive(true);
    setShowFilter(false);
  };
  const handleResetSemua = () => {
    setFilterActive(false);
    setShowFilter(false);
    setSelectedRT("all");
    setSelectedRW("all");
  };

  const visibleCols = computeVisibleColumns();
  const showPdfButton = !(
    jenisLaporan === "data_penduduk" ||
    jenisLaporan === "data_kelahiran" ||
    jenisLaporan === "data_pendatang"
  );

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      {/* Header */}
      <div className="flex items-center bg-green-500 text-white px-4 py-3 rounded-t-lg justify-between">
        <div className="flex items-center">
          <FileText className="w-5 h-5 mr-2" />
          <h1 className="text-lg font-semibold">
            Kelola Laporan
            {selectedRW && selectedRW !== "all" ? ` / RW ${pad2(selectedRW)}` : ""}
            {selectedRT && selectedRT !== "all" ? ` / RT ${pad2(selectedRT)}` : ""}
          </h1>
        </div>
      </div>

      {/* Filter & Export */}
      <div className="flex flex-wrap items-end gap-2 mt-4">
        <div>
          <label className="block text-sm">Pilih Jenis Laporan</label>
          <select value={jenisLaporan} onChange={(e) => setJenisLaporan(e.target.value)} className="border rounded px-3 py-2">
            <option value="data_penduduk">Laporan Data Penduduk</option>
            <option value="data_kartu_keluarga">Laporan Kartu Keluarga</option>
            <option value="data_kelahiran">Laporan Kelahiran</option>
            <option value="data_kematian">Laporan Kematian</option>
            <option value="data_pindah">Laporan Pindah</option>
            <option value="data_pendatang">Laporan Pendatang</option>
          </select>
        </div>

        <div className="flex items-end gap-3">
          <div>
            <label className="block text-sm">Pilih RW</label>
            <select value={selectedRW} onChange={(e) => setSelectedRW(e.target.value)} className="border rounded px-3 py-2">
              {rwOptions.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm">Pilih RT</label>
            <select
              value={selectedRT}
              onChange={(e) => setSelectedRT(e.target.value)}
              className="border rounded px-3 py-2"
            >
              {rtOptions.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-end gap-3">
          {!showFilter ? (
            <button onClick={() => setShowFilter(true)} className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">Filter Periode</button>
          ) : (
            <>
              <div>
                <label className="block text-sm">Bulan</label>
                <select value={bulan} onChange={(e) => setBulan(Number(e.target.value))} className="border rounded px-3 py-2">
                  {namaBulan.map((nama, index) => (
                    <option key={index + 1} value={index + 1}>{nama}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm">Tahun</label>
                <select value={tahun} onChange={(e) => setTahun(Number(e.target.value))} className="border rounded px-3 py-2">
                  {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i).map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button onClick={handleTerapkanFilter} className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700">Terapkan</button>
                <button onClick={() => setShowFilter(false)} className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400">Batal</button>
              </div>
            </>
          )}
        </div>

        <div>
          {filterActive ? (
            <button onClick={handleResetSemua} className="px-4 py-2 rounded bg-gray-600 text-white hover:bg-gray-700">Reset</button>
          ) : (
            <button onClick={() => { setFilterActive(false); setShowFilter(false); setSelectedRT("all"); setSelectedRW("all"); }} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300">Tampilkan Semua</button>
          )}
        </div>

        {/* Form kecil untuk laporan kematian / pindah */}
        {(jenisLaporan === "data_kematian" || jenisLaporan === "data_pindah") && (
          <div className="flex items-end gap-2">
            <div>
              <label className="block text-sm">Jabatan Pencetak</label>
              <input
                type="text"
                value={pencetakJabatan}
                onChange={(e) => setPencetakJabatan(e.target.value)}
                placeholder="Contoh: Kepala Desa / Sekretaris"
                className="border rounded px-3 py-2 w-48"
              />
            </div>
            <div>
              <label className="block text-sm">Nama Pencetak</label>
              <input
                type="text"
                value={pencetakNama}
                onChange={(e) => setPencetakNama(e.target.value)}
                placeholder="Nama yang tercetak di tanda tangan"
                className="border rounded px-3 py-2 w-48"
              />
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={exportExcel} className="flex items-center bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
            <Download className="w-4 h-4 mr-2" /> Export Excel
          </button>
          {showPdfButton && (
            <button onClick={exportPDF} className="flex items-center bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700" disabled={laporan.length === 0}>
              <Download className="w-4 h-4 mr-2" /> Export PDF
            </button>
          )}
        </div>
      </div>

      {/* Tabel */}
      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full border border-gray-300 text-sm">
         <thead className="bg-green-600 text-white">
            <tr>
              <th className="px-4 py-2 border text-center">NO</th>
              {visibleCols.map((key) => (
                <th key={key} className="px-4 py-2 border text-center">
                  {key === "hari_tanggal_pukul"
                    ? "HARI / TANGGAL / PUKUL"
                    : String(key).replace(/_/g, " ").toUpperCase()}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {laporan.length > 0 ? (
              laporan.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-100">
                  <td className="px-4 py-2 border text-center">{idx + 1}</td>
                  {visibleCols.map((col) => (
                    <td key={col} className="px-3 py-2 border text-center">
                      {row[col] === null || row[col] === undefined || row[col] === "" ? "-" : String(row[col])}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={Math.max(visibleCols.length + 1, 1)} className="text-center py-4 text-gray-500 italic">{loading ? "Memuat data..." : "Tidak ada data pada periode ini."}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Laporan;
