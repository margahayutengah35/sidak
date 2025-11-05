import React, { useState, useEffect } from "react";
import { FileText, Download } from "lucide-react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import supabase from "../../../supabaseClient";
import logo from "../../../assets/logo_desa.png";

function KelolaLaporan() {
  const [laporan, setLaporan] = useState([]);
  const [jenisLaporan, setJenisLaporan] = useState("data_penduduk");
  const [bulan, setBulan] = useState(new Date().getMonth() + 1);
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [showFilter, setShowFilter] = useState(false);
  const [filterActive, setFilterActive] = useState(false);
  const [loading, setLoading] = useState(false);

  // tambahan state untuk nama ketua RT, nomor RT & kabupaten (ambil dari profil login bila ada)
  const [ketuaRTName, setKetuaRTName] = useState("Nama Ketua RT");
  const [ketuaRTNumber, setKetuaRTNumber] = useState(""); // mis. "02"
  const [userKabupaten, setUserKabupaten] = useState(""); // jika kosong -> fallback saat export

  // --- RT/RW diambil dari profil login (tidak ada dropdown) ---
  const [selectedRT, setSelectedRT] = useState("all");
  const [selectedRW, setSelectedRW] = useState("all");

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
  // Helpers for tanggal / hari / pukul formatting
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
    return `${String(d).padStart(2, "0")} - ${String(m).padStart(2, "0")} - ${y}`.replace(/\s/g, "");
  }

  function formatTimeHHMM(timeString) {
    if (!timeString) return "";
    const parts = String(timeString).split(":");
    const hh = parts[0] ? String(parts[0]).padStart(2, "0") : "00";
    const mm = parts[1] ? String(parts[1]).padStart(2, "0") : "00";
    return `${hh}:${mm}`;
  }

  // === ambil profil user (nama ketua RT, nomor RT & kabupaten bila tersedia) ===
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // --- Ambil user ID dari supabase auth atau localStorage ---
        let userId = null;
        try {
          const res = await supabase.auth.getUser();
          const user = res?.data?.user;
          if (user?.id) userId = user.id;
        } catch (e) {
          // ignore, fallback ke localStorage
        }
        if (!userId) {
          const stored = localStorage.getItem("userId");
          if (stored) userId = stored;
        }
        if (!userId) return;

        // --- Ambil data profil dari tabel users ---
        let profile = null;
        try {
          const { data: p, error: pErr } = await supabase
            .from("users")
            .select("*")
            .eq("id", userId)
            .single();
          if (!pErr && p) profile = p;
        } catch (e) {}

        // --- Jika tidak ada, ambil dari tabel users ---
        if (!profile) {
          try {
            const { data: u, error: uErr } = await supabase
              .from("users")
              .select("*")
              .eq("id", userId)
              .single();
            if (!uErr && u) profile = u;
          } catch (e) {}
        }

        if (!profile) return;

        // --- Keys fleksibel untuk nama, RT, RW, kabupaten ---
        const nameKeys = ["nama","name","full_name","display_name","nama_rt","username"];
        const rtKeys = ["rt","no_rt","rt_number","rt_no","rt_rt"];
        const rwKeys = ["rw","no_rw","rw_number"];
        const kabKeys = ["kabupaten","kota","district","kab"];

        const findFirst = (obj, keys) => {
          for (const k of keys) {
            if (Object.prototype.hasOwnProperty.call(obj, k)) {
              const v = obj[k];
              if (v !== null && v !== undefined && String(v).trim() !== "") return String(v);
            }
          }
          return null;
        };

        const foundName = findFirst(profile, nameKeys) || findFirst(profile.user_metadata || {}, nameKeys);
        const foundRT = findFirst(profile, rtKeys);
        const foundRW = findFirst(profile, rwKeys);
        const foundKab = findFirst(profile, kabKeys) || profile.kabupaten || profile.city;

        if (foundName) setKetuaRTName(foundName);
        if (foundRT) {
          setKetuaRTNumber(foundRT);
          setSelectedRT(String(foundRT));
        }
        if (foundRW) setSelectedRW(String(foundRW));
        if (foundKab) setUserKabupaten(foundKab);

      } catch (e) {
        console.warn("Gagal ambil profil user:", e);
      }
    };

    fetchProfile();
  }, []);

  // fetchLaporan tetap pakai selectedRT/selectedRW yang diambil dari profil
  const fetchLaporan = async () => {
    if (!jenisLaporan) return;
    setLoading(true);

    try {
      const tableName = jenisLaporan;
      const idColumn = getIdColumn(tableName);

      let query;
      if (!filterActive) {
        if (tableName === "data_kartu_keluarga") {
          query = supabase
            .from("data_penduduk")
            .select("no_kk, nama, nik, alamat, rt, rw, created_at")
            .order("no_kk", { ascending: true });
        } else {
          query = supabase.from(tableName).select("*").order(idColumn, { ascending: true });
        }
      } else {
        const startDate = `${tahun}-${String(bulan).padStart(2, "0")}-01`;
        const lastDay = new Date(tahun, bulan, 0).getDate();
        const endDate = `${tahun}-${String(bulan).padStart(2, "0")}-${lastDay}`;

        if (tableName === "data_kartu_keluarga") {
          query = supabase
            .from("data_penduduk")
            .select("no_kk, nama, nik, alamat, rt, rw, created_at")
            .gte("created_at", startDate)
            .lte("created_at", endDate)
            .order("no_kk", { ascending: true });
        } else {
          query = supabase
            .from(tableName)
            .select("*")
            .gte("created_at", startDate)
            .lte("created_at", endDate)
            .order(idColumn, { ascending: true });
        }
      }

      // --- terapkan filter RT / RW jika dipilih (akan diisi dari profil login) ---
      if (selectedRW && selectedRW !== "all") {
        query = query.eq("rw", selectedRW);
      }
      if (selectedRT && selectedRT !== "all") {
        query = query.eq("rt", selectedRT);
      }

      const { data, error } = await query;
      if (error) {
        console.error("Gagal ambil data:", error);
        setLaporan([]);
      } else {
        let formattedData = data || [];

        // khusus data_pindah -> gabungkan alamat tujuan pindah
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

        // khusus data_kematian -> gabungkan hari/tanggal/pukul jadi satu field tanggal_kematian_full
        if (tableName === "data_kematian") {
          formattedData = formattedData.map((item) => {
            const hari = item.hari_kematian || getNamaHari(item.tanggal_kematian);
            const tanggal = item.tanggal_kematian ? formatDateToDDMMYYYY(item.tanggal_kematian) : "";
            const pukul = item.pukul_kematian ? formatTimeHHMM(item.pukul_kematian) : "";

            const hari_tanggal_pukul =
              hari || tanggal || pukul
                ? `${hari}${tanggal ? `, ${tanggal}` : ""}${pukul ? ` - ${pukul}` : ""}`
                : "-";

            return { 
              ...item, 
              hari_tanggal_pukul 
            };
          });
        }

        setLaporan(formattedData);
      }
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
  }, [jenisLaporan, filterActive, bulan, tahun, selectedRT, selectedRW]);

  const isHiddenColumn = (key) => {
    if (!key) return true;
    const k = String(key).toLowerCase();

    if (jenisLaporan === "data_kematian") {
      const allowed = ["nik", "no_kk", "nama", "sebab_kematian", "tempat_kematian", "hari_tanggal_pukul"];
      return !allowed.includes(k);
    }

    if (jenisLaporan === "data_pindah") {
      const allowed = ["nik","no_kk","nama","tanggal_pindah","alasan","alamat_pindah"];
      return !allowed.includes(k);
    }

    if (k === "id") return true;
    if (k.startsWith("id_")) return true;
    if (k.endsWith("_id")) return true;
    if (k === "created_at") return true;
    if (k === "updated_at") return true;
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

    // Header
    worksheet.addRow(["No", ...visibleCols]);

    // Data
    laporan.forEach((row, index) => {
      const rowData = [index + 1];
      visibleCols.forEach((col) => {
        rowData.push(row[col] ?? "");
      });
      worksheet.addRow(rowData);
    });

    // ✅ Styling rata tengah semua cell
    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.alignment = { horizontal: "center", vertical: "middle" };
      });
    });

    // === BUAT NAMA FILE DINAMIS ===
    const namaBulanText = filterActive ? String(bulan).padStart(2, "0") : "";
    const tahunText = filterActive ? tahun : "semua_data";
    const rtText = selectedRT && selectedRT !== "all" ? `RT${selectedRT}` : "semuaRT";
    const rwText = selectedRW && selectedRW !== "all" ? `RW${selectedRW}` : "semuaRW";

    const fileName = `Laporan_${jenisLaporan}_${namaBulanText}-${tahunText}_${rtText}_${rwText}.xlsx`;

    // Simpan file
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

    // logo + kop
    const logoWidth = 30;
    const logoHeight = 30;
    const topMargin = 10;
    const leftMargin = 30;
    try {
      doc.addImage(logo, "PNG", leftMargin, topMargin, logoWidth, logoHeight);
    } catch (e) {
      // ignore if logo failed to load
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

    let cursor = separatorY + 8;
    doc.setFont("times", "bold");
    doc.setFontSize(12);
    doc.text("LAPORAN " + jenisLaporan.replace("_", " ").toUpperCase(), pageWidth / 2, cursor, { align: "center" });
    cursor += 6;
    doc.setFont("times", "normal");
    doc.setFontSize(10);
    const periodeText = filterActive ? `Periode: ${String(bulan).padStart(2, "0")}-${tahun}` : "Periode: Semua Data";
    const lokasiText = (selectedRW && selectedRW !== "all") || (selectedRT && selectedRT !== "all")
      ? `Lokasi: ${selectedRT !== "all" ? `RT ${selectedRT}` : "Semua RT"}${selectedRW !== "all" ? ` / RW ${selectedRW}` : ""}`
      : "Lokasi: Semua RT/RW";

    doc.text(`${periodeText} | ${lokasiText}`, pageWidth / 2, cursor, { align: "center" });

    // prepare export data using visible columns
    const exportData = laporan.map((row, idx) => {
      const out = { No: idx + 1 };
      visibleCols.forEach((c) => (out[c] = row[c] ?? ""));
      return out;
    });

    const headers = Object.keys(exportData[0] || {});
    const body = exportData.map((r) => Object.values(r));

    // autoTable dengan rata tengah untuk header & body
    autoTable(doc, {
      head: [headers],
      body,
      startY: cursor + 8,
      styles: { fontSize: 9, halign: 'center', valign: 'middle', cellPadding: 2 },
      headStyles: { fillColor: [30, 120, 60], halign: 'center', valign: 'middle' },
      theme: "grid",
    });

    // --- bagian tambahan: kabupaten, tanggal cetak, tanda tangan kanan bawah ---
    const inferredKabupaten =
      userKabupaten ||
      (laporan && laporan.length > 0 && (laporan[0].kabupaten || laporan[0].kabupaten_pindah)) ||
      "Bandung";

    const printedDate = new Date().toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : cursor + 8;
    let signatureY = finalY + 18;
    const bottomSafeMargin = 40; // mm
    if (signatureY > pageHeight - bottomSafeMargin) {
      doc.addPage();
      signatureY = 50; // posisi di halaman baru
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
    const titleText = ketuaRTNumber ? `Ketua RT ${ketuaRTNumber}` : "Ketua RT";
    doc.text(titleText, signatureCenterX, signTitleY, { align: "center" });

    const nameY = signTitleY + 24;
    doc.setFont("times", "bold");
    doc.setFontSize(11);
    doc.text(ketuaRTName, signatureCenterX, nameY, { align: "center" });

    // Simpan file
    const namaBulanText = filterActive ? String(bulan).padStart(2, "0") : "";
    const tahunText = filterActive ? tahun : "semua_data";
    const rtText = selectedRT && selectedRT !== "all" ? `RT${selectedRT}` : "semuaRT";
    const rwText = selectedRW && selectedRW !== "all" ? `RW${selectedRW}` : "semuaRW";

    const fileName = `Laporan_${jenisLaporan}_${namaBulanText}-${tahunText}_${rtText}_${rwText}.pdf`;
    doc.save(fileName);
  };

  const handleTerapkanFilter = () => {
    setFilterActive(true);
    setShowFilter(false);
  };
  const handleResetSemua = () => {
    // jangan ubah selectedRT/selectedRW — tetap ambil dari profil login
    setFilterActive(false);
    setShowFilter(false);
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
      <div className="flex items-center bg-green-500 text-white px-4 py-3 rounded-t-lg">
        <FileText className="w-5 h-5 mr-2" />
        <h1 className="text-lg font-semibold mr-4">
          Kelola Laporan
          {selectedRT && selectedRT !== "all" ? ` RT ${selectedRT}` : ""}
          {selectedRW && selectedRW !== "all" ? ` / RW ${selectedRW}` : ""}
        </h1>
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
            <button onClick={() => { setFilterActive(false); setShowFilter(false); }} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300">Tampilkan Semua</button>
          )}
        </div>

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

export default KelolaLaporan;
