import React, { useState, useEffect } from "react";
import { UploadCloud } from "lucide-react";
import supabase from "../../supabaseClient";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { useNavigate } from "react-router-dom";

function TemplateCSV() {
  const [file, setFile] = useState(null);
  const [userData, setUserData] = useState({ rt: "-", rw: "-" });
  const [loadingUser, setLoadingUser] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const navigate = useNavigate();

  // 🔹 Ambil data user RT/RW (tetap dipakai untuk fallback saat mapping jika kolom RT/RW kosong)
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userId = localStorage.getItem("userId");
        if (!userId) {
          console.warn("User belum login!");
          setLoadingUser(false);
          return;
        }

        const { data, error } = await supabase
          .from("users")
          .select("rt, rw")
          .eq("id", userId)
          .single();

        if (error) {
          console.error("Gagal ambil data user:", error.message);
        } else if (data) {
          setUserData(data);
        }
      } catch (err) {
        console.error("Terjadi kesalahan:", err.message);
      } finally {
        setLoadingUser(false);
      }
    };

    fetchUser();
  }, []);

  // 🔹 Normalisasi RT/RW → selalu 2 digit
  const normalizeRT_RW = (value) => {
    if (!value) return "";
    const str = value.toString().trim();
    if (str.length === 1) return "0" + str;
    return str;
  };

  // 🔹 Normalisasi teks → Capitalize
  const normalizeCase = (text) => {
    if (!text) return "";
    return text
      .toString()
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ")
      .replace(/(^\w|\s\w)/g, (m) => m.toUpperCase());
  };

  // 🔹 Format tanggal (Excel → yyyy-mm-dd)
  const formatTanggal = (tgl) => {
    if (!tgl) return null;
    if (tgl instanceof Date) return tgl.toISOString().split("T")[0];
    if (typeof tgl === "string") {
      const parts = tgl.split("/");
      if (parts.length === 3) {
        const [day, month, year] = parts;
        return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
      }
      return tgl;
    }
    if (typeof tgl === "number") {
      const excelEpoch = new Date(1899, 11, 30);
      const date = new Date(excelEpoch.getTime() + tgl * 24 * 60 * 60 * 1000);
      return date.toISOString().split("T")[0];
    }
    return null;
  };

  // 🔹 Auto-upload saat file dipilih
  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setIsUploading(true);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet);

        if (!jsonData.length) {
          alert("File kosong atau format salah!");
          setIsUploading(false);
          return;
        }

        // 🔹 Fungsi pembatas panjang teks
        const truncate = (str, max) => str?.toString().substring(0, max) || "";

        // 🔹 Mapping data Excel → Database
        const mappedData = jsonData.map((row) => ({
          no_kk: truncate(row["No KK"], 20),
          nik: truncate(row["NIK"], 20), // ✅ ini yang dicek duplikat
          nama: truncate(normalizeCase(row["Nama"]), 100),
          tempat_lahir: truncate(normalizeCase(row["Tempat Lahir"]), 50),
          tanggal_lahir: formatTanggal(row["Tanggal Lahir"]),
          jk: row["Jenis Kelamin"]?.toString().toLowerCase().includes("perempuan")
            ? "Perempuan"
            : "Laki-laki",
          golongan_darah: normalizeCase(row["Golongan Darah"]),
          agama: normalizeCase(row["Agama"]),
          status_perkawinan: normalizeCase(row["Status Perkawinan"]),
          pendidikan: normalizeCase(row["Pendidikan"]),
          pekerjaan: truncate(normalizeCase(row["Pekerjaan"]), 100),
          alamat: truncate(normalizeCase(row["Alamat"]), 50),
          rt: normalizeRT_RW(row["RT"]) || normalizeRT_RW(userData.rt),
          rw: normalizeRT_RW(row["RW"]) || normalizeRT_RW(userData.rw),
          status_keluarga: normalizeCase(row["Status Keluarga"]),
          nik_ayah: truncate(row["NIK Ayah"], 20), // ✅ tidak dicek duplikat
          nama_ayah: truncate(normalizeCase(row["Nama Ayah"]), 100),
          nik_ibu: truncate(row["NIK Ibu"], 20),  // ✅ tidak dicek duplikat
          nama_ibu: truncate(normalizeCase(row["Nama Ibu"]), 100),
          desa: truncate(normalizeCase(row["Desa"]) || "Margahayu Tengah", 50),
          kecamatan: truncate(normalizeCase(row["Kecamatan"]) || "Margahayu", 50),
          kabupaten: truncate(normalizeCase(row["Kabupaten"]) || "Bandung", 50),
          provinsi: truncate(normalizeCase(row["Provinsi"]) || "Jawa Barat", 50),
          kode_pos: truncate(normalizeCase(row["kode_pos"]) || "40225", 50),
        }));

        // 🔹 Hapus duplikat berdasarkan NIK orang itu saja
        const uniqueByNIK = Object.values(
          mappedData.reduce((acc, curr) => {
            if (!curr.nik) return acc; // skip kalau nik kosong
            acc[curr.nik] = curr; // simpan terakhir, otomatis hapus duplikat
            return acc;
          }, {})
        );

        // 🔹 Upload ke Supabase
        const { error } = await supabase
          .from("data_penduduk")
          .upsert(uniqueByNIK, { onConflict: ["nik"] }); 

        if (error) {
          alert("Gagal menyimpan data: " + error.message);
        } else {
          alert("Data berhasil diunggah!");
          setFile(null);
          document.getElementById("fileInput").value = "";
          navigate("/admin/kelola_data/data_penduduk");
        }

        setIsUploading(false);
      };

      reader.readAsArrayBuffer(selectedFile);
    } catch (err) {
      console.error(err);
      alert("Gagal mengunggah file: " + err.message);
      setIsUploading(false);
    }
  };

  // 🔹 Download template Excel
  const handleDownloadTemplate = () => {
    const header = [
      [
        "No KK",
        "NIK",
        "Nama",
        "Tempat Lahir",
        "Tanggal Lahir",
        "Jenis Kelamin",
        "Golongan Darah",
        "Agama",
        "Status Perkawinan",
        "Pendidikan",
        "Pekerjaan",
        "Alamat",
        "RT",
        "RW",
        "Status Keluarga",
        "NIK Ayah",
        "Nama Ayah",
        "NIK Ibu",
        "Nama Ibu",
        "Desa",
        "Kecamatan",
        "Kabupaten",
        "Provinsi",
        "Kode Pos"
      ],
      // Row default dengan value otomatis
      [
        "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", 
        "Margahayu Tengah", "Margahayu", "Bandung", "Jawa Barat", "40225"
      ],
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(header);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template Penduduk");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(data, "template_penduduk.xlsx");
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow space-y-4">
      <div className="bg-green-600 text-white px-4 py-2 rounded text-lg font-semibold">
        {/* Judul tanpa menampilkan RT/RW */}
        {loadingUser ? "Memuat..." : "Bulk Upload Data Penduduk"}
      </div>

      <div className="flex flex-col md:flex-row gap-5">
        <div className="flex-10 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center relative hover:border-green-600 transition">
          <UploadCloud className="mx-auto mb-3 w-16 h-16 text-gray-400" />
          <p className="text-gray-500 mb-4">Drag & drop files atau pilih file</p>

          <input
            id="fileInput"
            type="file"
            accept=".csv,.xlsx"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />

          {isUploading && (
            <p className="text-green-600 font-medium mt-4">Mengunggah data...</p>
          )}
        </div>

        <div className="flex flex-col md:w-150 gap-4">
          <div className="bg-green-600 text-white p-3 rounded">
            Help Documents
            <p className="text-sm text-gray-100 mt-1">
              Documents to generate your EXCEL file
            </p>
          </div>
          <button
            onClick={handleDownloadTemplate}
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
          >
            DOWNLOAD EXCEL TEMPLATE
          </button>
        </div>
      </div>
    </div>
  );
}

export default TemplateCSV;
