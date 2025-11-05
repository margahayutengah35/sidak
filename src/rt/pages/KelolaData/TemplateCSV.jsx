// src/rt/pages/TemplateCSV.jsx
import React, { useState, useEffect } from "react";
import { UploadCloud } from "lucide-react";
import supabase from "../../../supabaseClient";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { useNavigate } from "react-router-dom";

function TemplateCSV() {
  const [file, setFile] = useState(null);
  const [userData, setUserData] = useState({ rt: "-", rw: "-" });
  const [loadingUser, setLoadingUser] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const navigate = useNavigate();

  // 🔹 Ambil data user RT/RW
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

      const truncate = (str, max) => (str == null ? "" : str.toString().substring(0, max));
      const normalizeCase = (text) =>
        text?.toString().trim().toLowerCase().replace(/\s+/g, " ").replace(/(^\w|\s\w)/g, (m) => m.toUpperCase()) || "";
      const normalizeRT_RW = (value) => {
        if (!value && value !== 0) return "";
        const str = value.toString().trim();
        return str.length === 1 ? "0" + str : str;
      };
      const formatTanggal = (tgl) => {
        if (!tgl && tgl !== 0) return null;
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
      const normalizeNIK = (nik) => {
        if (!nik) return "";
        return nik.toString().trim().replace(/[\s.-]/g, "").replace(/^0+/, "");
      };

      // Mapping Excel → object
      const mappedData = jsonData.map((row) => ({
        no_kk: truncate(row["No KK"], 20),
        nik: truncate(normalizeNIK(row["NIK"]), 20),
        nama: truncate(normalizeCase(row["Nama"]), 100),
        tempat_lahir: truncate(normalizeCase(row["Tempat Lahir"]), 100),
        tanggal_lahir: formatTanggal(row["Tanggal Lahir"]),
        jk: row["Jenis Kelamin"]?.toString().toLowerCase().includes("perempuan") ? "Perempuan" : "Laki-laki",
        golongan_darah: truncate(normalizeCase(row["Golongan Darah"]), 200),
        agama: truncate(normalizeCase(row["Agama"]), 20),
        status_perkawinan: truncate(normalizeCase(row["Status Perkawinan"]), 30),
        pendidikan: truncate(normalizeCase(row["Pendidikan"]), 50),
        pekerjaan: truncate(normalizeCase(row["Pekerjaan"]), 100),
        alamat: truncate(normalizeCase(row["Alamat"]), 200),
        rt: normalizeRT_RW(row["RT"]) || normalizeRT_RW(userData.rt),
        rw: normalizeRT_RW(row["RW"]) || normalizeRT_RW(userData.rw),
        status_keluarga: truncate(normalizeCase(row["Status Keluarga"]), 30),
        nik_ayah: truncate(normalizeNIK(row["NIK Ayah"]), 20),
        nama_ayah: truncate(normalizeCase(row["Nama Ayah"]), 100),
        nik_ibu: truncate(normalizeNIK(row["NIK Ibu"]), 20),
        nama_ibu: truncate(normalizeCase(row["Nama Ibu"]), 100),
        desa: truncate(normalizeCase(row["Desa"]) || "Margahayu Tengah", 50),
        kecamatan: truncate(normalizeCase(row["Kecamatan"]) || "Margahayu", 50),
        kabupaten: truncate(normalizeCase(row["Kabupaten"]) || "Bandung", 50),
        provinsi: truncate(normalizeCase(row["Provinsi"]) || "Jawa Barat", 200),
        kode_pos: truncate(row["Kode Pos"] || "40225", 10),
        status_verifikasi: "menunggu persetujuan",
        jenis_update: "tambah"
      }));

      // Hapus duplikat NIK
      const uniqueByNIK = Object.values(
        mappedData.reduce((acc, curr) => {
          if (!curr.nik) return acc;
          acc[curr.nik] = curr;
          return acc;
        }, {})
      );

      // Ambil data penduduk utama
      const { data: pendudukData } = await supabase
        .from("data_penduduk")
        .select("id_penduduk, nik");

      // Pisahkan data baru & data lama
      const finalData = [];
      for (const item of uniqueByNIK) {
        const match = pendudukData.find((p) => normalizeNIK(p.nik) === normalizeNIK(item.nik));
        if (match) {
          // Sudah ada di data_penduduk → pakai id_penduduk
          finalData.push({ ...item, id_penduduk: match.id_penduduk });
        } else {
          // Belum ada → insert dulu ke data_penduduk
          const { data: newPenduduk, error } = await supabase
            .from("data_penduduk")
            .insert([{
              no_kk: item.no_kk,
              nik: item.nik,
              nama: item.nama,
              tempat_lahir: item.tempat_lahir,
              tanggal_lahir: item.tanggal_lahir,
              jk: item.jk,
              golongan_darah: item.golongan_darah,
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
              provinsi: item.provinsi,
              kode_pos: item.kode_pos,
              status_verifikasi: "menunggu persetujuan",
              jenis_update: "tambah" // ← pastikan ini ada
            }])
            .select();
          if (error) {
            console.error("Insert ke data_penduduk error:", error);
            continue;
          }
          finalData.push({ ...item, id_penduduk: newPenduduk[0].id_penduduk });
        }
      }

      // Upsert ke data_penduduk_update
      const { error: updateError } = await supabase
        .from("data_penduduk_update")
        .upsert(finalData, { onConflict: ["nik"] });

      if (updateError) {
        console.error("Upsert data_penduduk_update error:", updateError);
        alert("Gagal simpan ke data_penduduk_update: " + updateError.message);
        setIsUploading(false);
        return;
      }

      alert("✅ Data berhasil diajukan! Menunggu persetujuan admin.");
      setFile(null);
      document.getElementById("fileInput").value = "";
      navigate("/rt/keloladata/datapenduduk");
      setIsUploading(false);
    };

    reader.readAsArrayBuffer(selectedFile);
  } catch (err) {
    console.error("General upload error:", err);
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
        "Kode Pos",
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
        {loadingUser
          ? "Memuat data RT/RW..."
          : `Bulk Upload Data Penduduk RT ${userData.rt} / RW ${userData.rw}`}
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
              Documents to generate your excel file
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
